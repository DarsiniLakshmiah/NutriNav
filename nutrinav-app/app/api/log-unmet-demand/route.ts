import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { storeId, products, source } = await req.json()

  if (!storeId || !products || !source) {
    return Response.json({ error: 'storeId, products, and source required' }, { status: 400 })
  }

  const productList: string[] = Array.isArray(products) ? products : [products]

  const rows = productList.map((product: string) => ({
    store_id: storeId,
    product,
    source,
  }))

  const { error } = await supabaseAdmin.from('unmet_demand_events').insert(rows)
  if (error) {
    console.error('Supabase insert error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, logged: productList.length })
}
