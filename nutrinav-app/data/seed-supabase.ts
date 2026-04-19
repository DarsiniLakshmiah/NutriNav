/**
 * Seed Supabase with all 75 Healthy Corners stores + synthetic inventory.
 * Run once: npx tsx data/seed-supabase.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import storesJson from './healthy-corners-stores.json'
import { generateStoreInventory } from '../lib/synthetic-data'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('Seeding stores…')

  // Upsert stores
  const { error: storeErr } = await supabase
    .from('stores')
    .upsert(storesJson, { onConflict: 'id' })

  if (storeErr) {
    console.error('Store seed failed:', storeErr.message)
    process.exit(1)
  }
  console.log(`✓ ${storesJson.length} stores inserted`)

  // Seed inventory for each store
  console.log('Seeding inventory…')
  let totalItems = 0
  for (const store of storesJson) {
    const items = generateStoreInventory(store.id).map(item => ({
      store_id: item.storeId,
      name: item.name,
      category: item.category,
      price: item.price,
      unit: item.unit,
      grade: item.grade,
      in_stock: item.inStock,
    }))

    // Delete existing inventory for this store before reinserting
    await supabase.from('inventory').delete().eq('store_id', store.id)

    const { error: invErr } = await supabase.from('inventory').insert(items)
    if (invErr) {
      console.error(`Inventory seed failed for ${store.id}:`, invErr.message)
    } else {
      totalItems += items.length
    }
  }
  console.log(`✓ ${totalItems} inventory items inserted`)

  // Seed demo unmet demand events for the dashboard demo
  console.log('Seeding demo demand events…')
  const DEMO_STORE = 'HC342' // Holiday Market, Ward 8 — real store ID
  const demoProducts = [
    { product: 'Plantains',             count: 28 },
    { product: 'Scotch Bonnet Peppers', count: 24 },
    { product: 'Masa Harina',           count: 18 },
    { product: 'Yuca',                  count: 12 },
    { product: 'Tomatillos',            count: 7  },
  ]

  for (const { product, count } of demoProducts) {
    const rows = Array.from({ length: count }, (_, i) => ({
      store_id: DEMO_STORE,
      product,
      source: i % 2 === 0 ? 'ai_gap' : 'user_tap',
      // Spread events over past 30 days
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }))
    const { error } = await supabase.from('unmet_demand_events').insert(rows)
    if (error) console.error(`Demo demand seed failed for ${product}:`, error.message)
  }
  console.log('✓ Demo demand events inserted')

  console.log('\n✅ Seed complete!')
}

seed().catch(console.error)
