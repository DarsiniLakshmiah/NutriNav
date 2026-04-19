'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import storesData from '@/data/healthy-corners-stores.json'

interface InventoryRow {
  id: string
  store_id: string
  name: string
  category: string
  price: number
  unit: string
  grade: string
  in_stock: boolean
}

function InventoryContent() {
  const searchParams = useSearchParams()
  const [storeId, setStoreId] = useState(searchParams.get('storeId') ?? 'HC342')
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('inventory')
      .select('*')
      .eq('store_id', storeId)
      .order('category')
      .then(({ data }) => {
        setInventory(data ?? [])
        setLoading(false)
      })
  }, [storeId])

  const toggleStock = async (item: InventoryRow) => {
    setSaving(item.id)
    const newVal = !item.in_stock
    await supabase.from('inventory').update({ in_stock: newVal }).eq('id', item.id)
    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, in_stock: newVal } : i))
    setSaving(null)
  }

  const updatePrice = async (item: InventoryRow, price: number) => {
    await supabase.from('inventory').update({ price }).eq('id', item.id)
    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, price } : i))
  }

  const categories = Array.from(new Set(inventory.map(i => i.category)))
  const inStockCount = inventory.filter(i => i.in_stock).length

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#1A7A6E]">My Inventory</h1>
          <p className="text-sm text-gray-500">Toggle items in/out of stock — residents see this in real time</p>
        </div>

        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <label className="text-xs text-gray-500 block mb-1">Your Store</label>
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {storesData.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-[#1A7A6E] text-white rounded-xl p-4 mb-4 flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">{inStockCount}</p>
            <p className="text-sm text-white/80">items in stock</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{inventory.length - inStockCount}</p>
            <p className="text-sm text-white/80">out of stock</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading inventory…</div>
        ) : (
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {cat}
                </h2>
                <div className="space-y-2">
                  {inventory.filter(i => i.category === cat).map(item => (
                    <div key={item.id} className={`bg-white rounded-xl p-3 flex items-center gap-3 border ${item.in_stock ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
                      <button
                        onClick={() => toggleStock(item)}
                        disabled={saving === item.id}
                        className={`w-12 h-6 rounded-full transition-colors shrink-0 ${item.in_stock ? 'bg-[#1A7A6E]' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow mx-0.5 transition-transform ${item.in_stock ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#2C2C2C]">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.unit} · Grade {item.grade}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          defaultValue={item.price}
                          onBlur={e => updatePrice(item, parseFloat(e.target.value))}
                          className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          Changes go live instantly for residents using the app
        </p>
      </div>
    </main>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <InventoryContent />
    </Suspense>
  )
}
