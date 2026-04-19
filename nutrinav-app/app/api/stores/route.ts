import { NextRequest } from 'next/server'
import { getNearbyStores } from '@/lib/haversine'
import { supabaseAdmin } from '@/lib/supabase'
import storesFallback from '@/data/healthy-corners-stores.json'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '38.8921')
  const lng = parseFloat(searchParams.get('lng') ?? '-76.9567')

  // Try Supabase first, fall back to local JSON
  const { data, error } = await supabaseAdmin.from('stores').select('*')
  const stores = (!error && data && data.length > 0) ? data : storesFallback

  return Response.json(getNearbyStores(lat, lng, stores))
}
