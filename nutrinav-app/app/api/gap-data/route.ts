// GET /api/gap-data
// Returns aggregated census tract gap data.
// - If Supabase has >= MIN_SESSIONS real sessions → returns real aggregated data
// - Otherwise blends real data with synthetic fallback so the map is never empty
//
// Response shape matches TractSummary used by gap-map/page.tsx

import { supabaseAdmin } from '@/lib/supabase'
import tractData from '@/data/food-desert-tracts.json'
import storesData from '@/data/healthy-corners-stores.json'

// Minimum sessions before we trust a tract's real data over synthetic
const MIN_SESSIONS_PER_TRACT = 5

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export async function GET() {
  try {
    // Pull aggregated session counts + avg distance from Supabase
    const { data: rows, error } = await supabaseAdmin
      .from('tract_sessions')
      .select('tract_geoid, ward, nearest_store_miles, nearest_store_id')

    if (error || !rows) throw new Error(error?.message ?? 'no data')

    // Aggregate by tract_geoid
    const agg: Record<string, {
      tract_geoid: string
      ward: number | null
      sessions: number
      total_distance: number
      valid_distances: number
    }> = {}

    for (const row of rows) {
      if (!agg[row.tract_geoid]) {
        agg[row.tract_geoid] = {
          tract_geoid: row.tract_geoid,
          ward: row.ward,
          sessions: 0,
          total_distance: 0,
          valid_distances: 0,
        }
      }
      agg[row.tract_geoid].sessions++
      if (typeof row.nearest_store_miles === 'number') {
        agg[row.tract_geoid].total_distance += row.nearest_store_miles
        agg[row.tract_geoid].valid_distances++
      }
    }

    // Build real-data records for tracts with enough sessions
    const realTracts = new Set<string>()
    const realResults: ReturnType<typeof buildTractResult>[] = []

    for (const entry of Object.values(agg)) {
      if (entry.sessions < MIN_SESSIONS_PER_TRACT) continue
      realTracts.add(entry.tract_geoid)

      const avgDist = entry.valid_distances > 0
        ? entry.total_distance / entry.valid_distances
        : 0.5

      // Find matching synthetic tract for population/income data (if available)
      const synth = tractData.find(t => t.tract === entry.tract_geoid)

      realResults.push(buildTractResult({
        tract:              entry.tract_geoid,
        ward:               entry.ward ?? synth?.ward ?? 0,
        population:         synth?.population ?? estimatePopulation(entry.sessions),
        medianIncome:       synth?.medianIncome ?? 0,
        snapHouseholds:     synth?.snapHouseholds ?? 0,
        lat:                synth?.lat ?? 0,
        lng:                synth?.lng ?? 0,
        nearestStoreMiles:  avgDist,
        isDesert:           synth?.isDesert ?? avgDist > 0.5,
        source:             'real',
        sessionCount:       entry.sessions,
      }))
    }

    // Fill remaining gaps from synthetic data for tracts not yet in Supabase
    const synthResults = tractData
      .filter(t => !realTracts.has(t.tract))
      .map(t => {
        const nearest = Math.min(
          ...storesData.map(s => haversine(t.lat, t.lng, s.lat, s.lng))
        )
        return buildTractResult({
          tract:             t.tract,
          ward:              t.ward,
          population:        t.population,
          medianIncome:      t.medianIncome,
          snapHouseholds:    t.snapHouseholds,
          lat:               t.lat,
          lng:               t.lng,
          nearestStoreMiles: nearest,
          isDesert:          t.isDesert,
          source:            'synthetic',
          sessionCount:      0,
        })
      })
      .filter(t => t.nearestStoreMiles > 0.25)

    const combined = [...realResults, ...synthResults]
      .sort((a, b) => b.nearestStoreMiles - a.nearestStoreMiles)

    return Response.json({
      tracts: combined,
      meta: {
        total_sessions:  rows.length,
        real_tracts:     realResults.length,
        synthetic_tracts: synthResults.length,
        data_as_of:      new Date().toISOString(),
      },
    })
  } catch (err) {
    // Supabase unavailable — return pure synthetic data so the map always works
    console.warn('[gap-data] falling back to synthetic:', err)
    const synthetic = tractData.map(t => {
      const nearest = Math.min(
        ...storesData.map(s => haversine(t.lat, t.lng, s.lat, s.lng))
      )
      return buildTractResult({
        tract:             t.tract,
        ward:              t.ward,
        population:        t.population,
        medianIncome:      t.medianIncome,
        snapHouseholds:    t.snapHouseholds,
        lat:               t.lat,
        lng:               t.lng,
        nearestStoreMiles: nearest,
        isDesert:          t.isDesert,
        source:            'synthetic',
        sessionCount:      0,
      })
    }).filter(t => t.nearestStoreMiles > 0.25)
      .sort((a, b) => b.nearestStoreMiles - a.nearestStoreMiles)

    return Response.json({
      tracts: synthetic,
      meta: { total_sessions: 0, real_tracts: 0, synthetic_tracts: synthetic.length, data_as_of: new Date().toISOString() },
    })
  }
}

function buildTractResult(t: {
  tract: string; ward: number; population: number; medianIncome: number
  snapHouseholds: number; lat: number; lng: number; nearestStoreMiles: number
  isDesert: boolean; source: 'real' | 'synthetic'; sessionCount: number
}) {
  const priority: 'critical' | 'high' | 'moderate' =
    t.nearestStoreMiles > 0.75 ? 'critical' : t.nearestStoreMiles > 0.5 ? 'high' : 'moderate'
  return { ...t, priority }
}

// Rough population estimate from session count when no synthetic tract exists
function estimatePopulation(sessions: number): number {
  return Math.round(sessions * 120)
}
