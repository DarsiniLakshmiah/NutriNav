// POST /api/log-session
// Logs an anonymous, privacy-safe session event tied to a census tract.
// NO user ID, NO precise coordinates, NO device info stored.
//
// Supabase table required — run this SQL once in Supabase SQL Editor:
//
//   CREATE TABLE IF NOT EXISTS tract_sessions (
//     id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
//     tract_geoid     text        NOT NULL,          -- e.g. "11001008200"
//     ward            int,
//     nearest_store_miles  numeric(5,3),
//     nearest_store_id     text,
//     session_date    date        NOT NULL DEFAULT current_date,
//     created_at      timestamptz NOT NULL DEFAULT now()
//   );
//   CREATE INDEX ON tract_sessions (tract_geoid);
//   CREATE INDEX ON tract_sessions (session_date);
//   -- No RLS needed — insert-only from service role, no reads by residents.

import { supabaseAdmin } from '@/lib/supabase'
import { getTractFromCoords } from '@/lib/census'

export async function POST(req: Request) {
  try {
    const { lat, lng, nearestStoreMiles, nearestStoreId } = await req.json()

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return Response.json({ error: 'lat and lng required' }, { status: 400 })
    }

    // Resolve census tract — fire-and-forget friendly (returns null on timeout)
    const tract = await getTractFromCoords(lat, lng)

    if (!tract) {
      // Geocoder unavailable — still return ok so the client isn't blocked
      return Response.json({ ok: true, logged: false, reason: 'tract_lookup_failed' })
    }

    const { error } = await supabaseAdmin.from('tract_sessions').insert({
      tract_geoid:          tract.geoid,
      ward:                 tract.ward ?? null,
      nearest_store_miles:  typeof nearestStoreMiles === 'number' ? nearestStoreMiles : null,
      nearest_store_id:     nearestStoreId ?? null,
      session_date:         new Date().toISOString().slice(0, 10),
    })

    if (error) {
      // Table may not exist yet — fail silently so the app keeps working
      console.warn('[log-session] Supabase insert failed:', error.message)
      return Response.json({ ok: true, logged: false, reason: 'db_error' })
    }

    return Response.json({ ok: true, logged: true, tract: tract.geoid, ward: tract.ward })
  } catch (err) {
    console.error('[log-session] unexpected error:', err)
    return Response.json({ ok: true, logged: false, reason: 'server_error' })
  }
}
