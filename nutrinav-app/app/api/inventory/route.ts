import { NextRequest } from 'next/server'
import { generateStoreInventory } from '@/lib/synthetic-data'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) return Response.json({ error: 'storeId required' }, { status: 400 })

  // Try Supabase first, fall back to synthetic generation
  const { data, error } = await supabaseAdmin
    .from('inventory')
    .select('*')
    .eq('store_id', storeId)
    .eq('in_stock', true)

  if (!error && data && data.length > 0) {
    // Normalize Supabase column names to match InventoryItem interface
    const normalized = data.map(row => ({
      storeId: row.store_id,
      name: row.name,
      category: row.category,
      price: parseFloat(row.price),
      unit: row.unit,
      grade: row.grade,
      inStock: row.in_stock,
    }))
    return Response.json(normalized)
  }

  // Fallback: generate synthetic inventory
  return Response.json(generateStoreInventory(storeId))
}
