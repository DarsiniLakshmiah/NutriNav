'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { HC_PRODUCTS } from '@/lib/synthetic-data'
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

const GRADE_OPTIONS = ['A', 'B', 'C', 'D']
const CATEGORY_OPTIONS = ['fruit', 'vegetable', 'frozen']

function InventoryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [storeId, setStoreId] = useState(searchParams.get('storeId') ?? 'HC342')
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Add item drawer
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [addTab, setAddTab] = useState<'catalog' | 'custom'>('catalog')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)

  // Custom item form
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('fruit')
  const [customPrice, setCustomPrice] = useState('')
  const [customUnit, setCustomUnit] = useState('ea')
  const [customGrade, setCustomGrade] = useState('A')
  const [customSaving, setCustomSaving] = useState(false)

  useEffect(() => {
    loadInventory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  const loadInventory = () => {
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
  }

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

  const removeItem = async (item: InventoryRow) => {
    if (!confirm(`Remove "${item.name}" from your inventory?`)) return
    await supabase.from('inventory').delete().eq('id', item.id)
    setInventory(prev => prev.filter(i => i.id !== item.id))
  }

  // HC catalog products not yet in this store's inventory
  const existingNames = useMemo(
    () => new Set(inventory.map(i => i.name.toLowerCase())),
    [inventory]
  )

  const catalogSuggestions = useMemo(() => {
    const q = catalogSearch.toLowerCase()
    return HC_PRODUCTS.filter(p =>
      !existingNames.has(p.name.toLowerCase()) &&
      (!q || p.name.toLowerCase().includes(q))
    )
  }, [existingNames, catalogSearch])

  const addFromCatalog = async (product: typeof HC_PRODUCTS[0]) => {
    setAddingId(product.name)
    const newItem = {
      store_id: storeId,
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      grade: product.grade,
      in_stock: true,
    }
    const { data, error } = await supabase.from('inventory').insert(newItem).select().single()
    if (!error && data) {
      setInventory(prev => [...prev, data as InventoryRow].sort((a, b) => a.category.localeCompare(b.category)))
    } else {
      // Fallback: add locally with temp id
      setInventory(prev => [
        ...prev,
        { ...newItem, id: `local-${Date.now()}` },
      ].sort((a, b) => a.category.localeCompare(b.category)))
    }
    setAddingId(null)
  }

  const addCustomItem = async () => {
    if (!customName.trim() || !customPrice) return
    setCustomSaving(true)
    const newItem = {
      store_id: storeId,
      name: customName.trim(),
      category: customCategory,
      price: parseFloat(customPrice),
      unit: customUnit.trim() || 'ea',
      grade: customGrade,
      in_stock: true,
    }
    const { data, error } = await supabase.from('inventory').insert(newItem).select().single()
    if (!error && data) {
      setInventory(prev => [...prev, data as InventoryRow].sort((a, b) => a.category.localeCompare(b.category)))
    } else {
      setInventory(prev => [
        ...prev,
        { ...newItem, id: `local-${Date.now()}` },
      ].sort((a, b) => a.category.localeCompare(b.category)))
    }
    setCustomName('')
    setCustomPrice('')
    setCustomUnit('ea')
    setCustomGrade('A')
    setCustomSaving(false)
    setShowAddDrawer(false)
  }

  const categories = Array.from(new Set(inventory.map(i => i.category)))
  const inStockCount = inventory.filter(i => i.in_stock).length

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-6">
      <div className="max-w-lg mx-auto pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="text-[#1A7A6E] text-xl">←</button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A7A6E]">My Inventory</h1>
            <p className="text-sm text-gray-500">Toggle items in/out of stock — residents see this in real time</p>
          </div>
        </div>

        {/* Store selector */}
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

        {/* Stats bar */}
        <div className="bg-[#1A7A6E] text-white rounded-xl p-4 mb-4 flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">{inStockCount}</p>
            <p className="text-sm text-white/80">items in stock</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{inventory.length}</p>
            <p className="text-sm text-white/80">total items</p>
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
            {inventory.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                No items yet. Tap <strong>+ Add Item</strong> to start building your inventory.
              </div>
            )}
            {categories.map(cat => (
              <div key={cat}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{cat}</h2>
                <div className="space-y-2">
                  {inventory.filter(i => i.category === cat).map(item => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl p-3 flex items-center gap-3 border transition-opacity ${
                        item.in_stock ? 'border-gray-100' : 'border-red-100 opacity-60'
                      }`}
                    >
                      {/* Toggle */}
                      <button
                        onClick={() => toggleStock(item)}
                        disabled={saving === item.id}
                        className={`w-12 h-6 rounded-full transition-colors shrink-0 ${item.in_stock ? 'bg-[#1A7A6E]' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow mx-0.5 transition-transform ${item.in_stock ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#2C2C2C]">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.unit} · Grade {item.grade}</p>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          defaultValue={item.price}
                          onBlur={e => updatePrice(item, parseFloat(e.target.value))}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right"
                        />
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item)}
                        className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0 transition-colors"
                        title="Remove item"
                      >
                        ×
                      </button>
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

      {/* Floating Add Item button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <button
          onClick={() => { setShowAddDrawer(true); setCatalogSearch('') }}
          className="pointer-events-auto bg-[#1A7A6E] text-white font-bold px-8 py-4 rounded-full shadow-xl flex items-center gap-2 text-base"
        >
          <span className="text-xl font-bold">+</span> Add Item
        </button>
      </div>

      {/* Add Item Drawer */}
      {showAddDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddDrawer(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <p className="font-bold text-[#1A7A6E] text-lg">Add Item to Inventory</p>
              <button onClick={() => setShowAddDrawer(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 pt-3 pb-2">
              <button
                onClick={() => setAddTab('catalog')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  addTab === 'catalog' ? 'bg-[#1A7A6E] text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                From HC Catalog
              </button>
              <button
                onClick={() => setAddTab('custom')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  addTab === 'custom' ? 'bg-[#1A7A6E] text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Custom Item
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">

              {/* ── Catalog tab ── */}
              {addTab === 'catalog' && (
                <>
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder="Search HC products (e.g. mango, kale…)"
                    className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm outline-none mb-3 mt-1"
                    autoFocus
                  />
                  {catalogSuggestions.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">
                      {catalogSearch ? 'No matching products.' : 'All HC catalog items are already in your inventory!'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 mb-1">{catalogSuggestions.length} products available to add</p>
                      {catalogSuggestions.map(product => (
                        <div
                          key={product.name}
                          className="flex items-center gap-3 bg-[#F5F0E8] rounded-xl px-3 py-3"
                        >
                          <span className="text-lg shrink-0">
                            {product.category === 'fruit' ? '🍎' : product.category === 'vegetable' ? '🥦' : '❄️'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#2C2C2C]">{product.name}</p>
                            <p className="text-xs text-gray-400 capitalize">
                              {product.category} · ${product.price.toFixed(2)} / {product.unit} · Grade {product.grade}
                            </p>
                          </div>
                          <button
                            onClick={() => addFromCatalog(product)}
                            disabled={addingId === product.name}
                            className="shrink-0 bg-[#1A7A6E] text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50"
                          >
                            {addingId === product.name ? '…' : '+ Add'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Custom item tab ── */}
              {addTab === 'custom' && (
                <div className="space-y-3 mt-2">
                  <p className="text-xs text-gray-400">
                    Add a product not in the HC catalog — for items you source independently.
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      placeholder="e.g. Plantains, Scotch Bonnet Peppers"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A7A6E]"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Category</label>
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm"
                      >
                        {CATEGORY_OPTIONS.map(c => (
                          <option key={c} value={c} className="capitalize">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Nutrition Grade</label>
                      <select
                        value={customGrade}
                        onChange={e => setCustomGrade(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm"
                      >
                        {GRADE_OPTIONS.map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Price ($) *</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={customPrice}
                        onChange={e => setCustomPrice(e.target.value)}
                        placeholder="e.g. 1.50"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A7A6E]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Unit</label>
                      <input
                        type="text"
                        value={customUnit}
                        onChange={e => setCustomUnit(e.target.value)}
                        placeholder="ea, lb, bag, bunch…"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A7A6E]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addCustomItem}
                    disabled={!customName.trim() || !customPrice || customSaving}
                    className="w-full bg-[#1A7A6E] text-white font-bold rounded-xl py-4 mt-2 disabled:opacity-40 text-base"
                  >
                    {customSaving ? 'Adding…' : '+ Add to Inventory'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
