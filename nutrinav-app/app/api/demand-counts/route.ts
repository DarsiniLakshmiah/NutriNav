import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) return Response.json({ error: 'storeId required' }, { status: 400 })

  const now = new Date()
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: events30, error } = await supabaseAdmin
    .from('unmet_demand_events')
    .select('product, created_at')
    .eq('store_id', storeId)
    .gte('created_at', days30)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const productMap: Record<string, { count_7d: number; count_30d: number }> = {}
  for (const event of events30 ?? []) {
    if (!productMap[event.product]) productMap[event.product] = { count_7d: 0, count_30d: 0 }
    productMap[event.product].count_30d++
    if (event.created_at >= days7) productMap[event.product].count_7d++
  }

  const result = Object.entries(productMap)
    .map(([product, counts]) => ({
      store_id: storeId,
      product,
      ...counts,
      alert: counts.count_30d > 20 ? 'red' : counts.count_30d >= 8 ? 'yellow' : 'green',
    }))
    .sort((a, b) => b.count_30d - a.count_30d)

  return Response.json(result)
}
