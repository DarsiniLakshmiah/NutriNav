'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import storesData from '@/data/healthy-corners-stores.json'

interface TractSummary {
  tract: string
  ward: number
  population: number
  medianIncome: number
  snapHouseholds: number
  lat: number
  lng: number
  nearestStoreMiles: number
  isDesert: boolean
  priority: 'critical' | 'high' | 'moderate'
  source: 'real' | 'synthetic'
  sessionCount: number
}

interface GapMeta {
  total_sessions: number
  real_tracts: number
  synthetic_tracts: number
  data_as_of: string
}

const PRIORITY_CONFIG = {
  critical: { color: '#C0392B', bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    label: 'Critical',  dot: 'bg-red-500',    desc: '> 0.75 mi walk' },
  high:     { color: '#C07A00', bg: 'bg-amber-50',   border: 'border-amber-300',  text: 'text-amber-700',  label: 'High',      dot: 'bg-amber-500',  desc: '> 0.5 mi walk' },
  moderate: { color: '#1A7A6E', bg: 'bg-teal-50',    border: 'border-teal-300',   text: 'text-teal-700',   label: 'Moderate',  dot: 'bg-teal-500',   desc: '> 0.25 mi walk' },
}

export default function GapMapPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  const [gaps, setGaps] = useState<TractSummary[]>([])
  const [meta, setMeta] = useState<GapMeta | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high' | 'moderate'>('all')

  // Fetch real+synthetic blended gap data from the API
  useEffect(() => {
    fetch('/api/gap-data')
      .then(r => r.json())
      .then(({ tracts, meta: m }) => {
        setGaps(tracts ?? [])
        setMeta(m)
        setDataLoading(false)
      })
      .catch(() => setDataLoading(false))
  }, [])

  const critical = gaps.filter(g => g.priority === 'critical')
  const high     = gaps.filter(g => g.priority === 'high')
  const moderate = gaps.filter(g => g.priority === 'moderate')
  const totalPop = gaps.reduce((s, g) => s + g.population, 0)
  const criticalPop = critical.reduce((s, g) => s + g.population, 0)
  const avgSnap = gaps.length
    ? Math.round((gaps.reduce((s, g) => s + g.snapHouseholds, 0) / gaps.length) * 100)
    : 0

  const filteredList = filterPriority === 'all' ? gaps : gaps.filter(g => g.priority === filterPriority)

  useEffect(() => {
    if (activeTab !== 'map') return
    if (typeof window === 'undefined' || !mapRef.current) return

    import('leaflet').then(L => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([38.865, -76.975], 12)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // HC store markers — green pins
      storesData.forEach(store => {
        L.circleMarker([store.lat, store.lng], {
          radius: 6, color: '#1E7A3A', fillColor: '#1E7A3A', fillOpacity: 0.9, weight: 2,
        })
          .addTo(map)
          .bindPopup(`<b style="font-size:12px">${store.name}</b><br><span style="font-size:11px;color:#666">${store.address}</span>`)
      })

      // Gap circles — sized by population, colored by priority
      gaps.forEach(gap => {
        const cfg = PRIORITY_CONFIG[gap.priority]
        const radiusMeters = Math.max(200, gap.population / 8)

        L.circle([gap.lat, gap.lng], {
          radius: radiusMeters,
          color: cfg.color,
          fillColor: cfg.color,
          fillOpacity: 0.3,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px;font-family:sans-serif">
              <b style="font-size:13px">Ward ${gap.ward} · Tract ${gap.tract.slice(-6)}</b>
              <br><span style="font-size:11px;color:#666;font-weight:600;color:${cfg.color}">${cfg.label} Priority</span>
              <br><br>
              <span style="font-size:11px">👥 <b>${gap.population.toLocaleString()}</b> residents</span><br>
              <span style="font-size:11px">🚶 <b>${gap.nearestStoreMiles.toFixed(2)} mi</b> to nearest HC store</span><br>
              <span style="font-size:11px">🏷️ <b>${Math.round(gap.snapHouseholds * 100)}%</b> SNAP households</span><br>
              <span style="font-size:11px">💰 Median income: <b>$${gap.medianIncome.toLocaleString()}</b></span>
            </div>
          `, { maxWidth: 220 })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaps, activeTab])

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.back()} className="text-[#1A7A6E] text-xl">←</button>
            <div>
              <h1 className="text-xl font-bold text-[#1A7A6E]">Gap Analysis Map</h1>
              <p className="text-xs text-gray-500">DCCK store expansion planning · Synthetic data</p>
            </div>
          </div>

          {/* Data source badge */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {meta && meta.total_sessions > 0 ? (
              <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
                ✓ {meta.total_sessions.toLocaleString()} real sessions · {meta.real_tracts} live tracts
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                Synthetic baseline · updates as users join
              </span>
            )}
            {meta && meta.synthetic_tracts > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                +{meta.synthetic_tracts} synthetic tracts
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Tracts',       value: dataLoading ? '…' : gaps.length,      color: 'text-[#2C2C2C]' },
              { label: 'Critical',     value: dataLoading ? '…' : critical.length,  color: 'text-red-600' },
              { label: 'High',         value: dataLoading ? '…' : high.length,      color: 'text-amber-600' },
              { label: 'Avg SNAP %',   value: dataLoading ? '…' : `${avgSnap}%`,    color: 'text-[#1A7A6E]' },
            ].map(s => (
              <div key={s.label} className="bg-[#F5F0E8] rounded-xl p-2.5 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 pt-3">
        <div className="flex gap-2 mb-3">
          {(['map', 'list'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                activeTab === tab ? 'bg-[#1A7A6E] text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {tab === 'map' ? '🗺 Map View' : '📋 Priority List'}
            </button>
          ))}
        </div>
      </div>

      {dataLoading && (
        <div className="text-center py-12 text-gray-400 text-sm">Loading gap data…</div>
      )}

      {/* Map tab */}
      {!dataLoading && activeTab === 'map' && (
        <div className="max-w-3xl mx-auto px-4">
          {/* Map — tall */}
          <div className="rounded-2xl overflow-hidden shadow-md mb-3" style={{ height: 'calc(100vh - 280px)', minHeight: '420px' }}>
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl p-3 mb-3 flex flex-wrap gap-3 text-xs">
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${cfg.dot} opacity-80 shrink-0`} />
                <span className="font-medium">{cfg.label}</span>
                <span className="text-gray-400">({cfg.desc})</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#1E7A3A] shrink-0" />
              <span className="font-medium">HC Store</span>
            </span>
          </div>

          {/* Callout */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700">
            <p className="font-semibold mb-0.5">🔴 {critical.length} critical tracts · ~{criticalPop.toLocaleString()} residents</p>
            <p>These areas have no HC store within a 15-minute walk. Circles are sized by population. Tap any circle for details.</p>
          </div>

          <p className="text-xs text-gray-400 text-center pb-6">
            Synthetic data based on Census ACS + USDA Food Access Research Atlas — for planning purposes only
          </p>
        </div>
      )}

      {/* List tab */}
      {!dataLoading && activeTab === 'list' && (
        <div className="max-w-3xl mx-auto px-4 pb-10">
          {/* Filter pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(['all', 'critical', 'high', 'moderate'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                  filterPriority === p
                    ? 'bg-[#1A7A6E] text-white border-[#1A7A6E]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {p === 'all' ? `All (${gaps.length})` : `${PRIORITY_CONFIG[p].label} (${gaps.filter(g => g.priority === p).length})`}
              </button>
            ))}
          </div>

          {/* Summary impact card */}
          <div className="bg-[#1A7A6E] text-white rounded-xl p-4 mb-4">
            <p className="font-bold text-lg">{totalPop.toLocaleString()} residents</p>
            <p className="text-white/80 text-sm">live in tracts with limited HC store access</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Critical', count: critical.length, pop: criticalPop },
                { label: 'High', count: high.length, pop: high.reduce((s, g) => s + g.population, 0) },
                { label: 'Moderate', count: moderate.length, pop: moderate.reduce((s, g) => s + g.population, 0) },
              ].map(r => (
                <div key={r.label} className="bg-white/10 rounded-lg py-2">
                  <p className="font-bold text-sm">{r.count} tracts</p>
                  <p className="text-xs text-white/70">{r.pop.toLocaleString()} ppl</p>
                  <p className="text-xs text-white/60">{r.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ranked rows */}
          <div className="space-y-2">
            {filteredList.map((g, i) => {
              const cfg = PRIORITY_CONFIG[g.priority]
              return (
                <div key={g.tract} className={`${cfg.bg} border ${cfg.border} rounded-xl p-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-sm text-[#2C2C2C]">Ward {g.ward} · Tract {g.tract.slice(-6)}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          {g.source === 'real' ? (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              ✓ {g.sessionCount} sessions
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                              synthetic
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-500">
                          <span>👥 {g.population.toLocaleString()} residents</span>
                          <span>🏷️ {Math.round(g.snapHouseholds * 100)}% SNAP</span>
                          <span>💰 ${(g.medianIncome / 1000).toFixed(0)}k income</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-base ${cfg.text}`}>{g.nearestStoreMiles.toFixed(2)} mi</p>
                      <p className="text-xs text-gray-400">nearest HC</p>
                    </div>
                  </div>

                  {/* Distance bar */}
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        g.priority === 'critical' ? 'bg-red-500' : g.priority === 'high' ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, (g.nearestStoreMiles / 2) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            Synthetic data based on Census ACS + USDA Food Access Research Atlas — for planning purposes only
          </p>
        </div>
      )}
    </main>
  )
}
