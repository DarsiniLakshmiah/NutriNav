'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { HC_PRODUCTS, InventoryItem } from '@/lib/synthetic-data'
import { getNutrition } from '@/lib/nutrition'
import { getCart, addToCart, updateQty, removeFromCart, CartItem } from '@/lib/cart'

const CATEGORY_LABELS: Record<string, string> = {
  all:       'All',
  fruit:     'Fruit',
  vegetable: 'Vegetables',
  frozen:    'Frozen',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-orange-100 text-orange-800',
  D: 'bg-red-100 text-red-800',
}

interface StoreInfo {
  id: string
  name: string
  address: string
  distance?: number
  ward?: number
}

export default function HCAppPage() {
  const router = useRouter()

  // Store context from sessionStorage
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [storeInventory, setStoreInventory] = useState<InventoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'store' | 'all'>('store')

  // Filters
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  // Missing items
  const [requestInput, setRequestInput] = useState('')
  const [requestedItems, setRequestedItems] = useState<string[]>([])
  const [reportedMissing, setReportedMissing] = useState<Set<string>>(new Set())

  // Load store + cart from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('nutrinav_store')
    if (saved) {
      const s = JSON.parse(saved) as StoreInfo
      setStore(s)
      fetch(`/api/inventory?storeId=${s.id}`)
        .then(r => r.json())
        .then(setStoreInventory)
    } else {
      setActiveTab('all')
    }
    setCart(getCart())
  }, [])

  // Sync cart from sessionStorage whenever drawer opens
  const openCart = () => {
    setCart(getCart())
    setShowCart(true)
  }

  const storeItemNames = useMemo(
    () => new Set(storeInventory.map(i => i.name.toLowerCase())),
    [storeInventory]
  )

  const getStoreItem = useCallback(
    (name: string) => storeInventory.find(i => i.name.toLowerCase() === name.toLowerCase()),
    [storeInventory]
  )

  const isInCart = (name: string) =>
    cart.some(i => i.name.toLowerCase() === name.toLowerCase())

  const cartQty = (name: string) =>
    cart.find(i => i.name.toLowerCase() === name.toLowerCase())?.qty ?? 0

  const cartCount = cart.length
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0)

  const handleAddToCart = (product: { name: string; price: number; unit: string }) => {
    const updated = addToCart({ name: product.name, qty: 1, unitPrice: product.price, unit: product.unit, inCart: true })
    setCart([...updated])
  }

  const handleQty = (name: string, delta: number) => {
    const current = cartQty(name)
    const updated = updateQty(name, current + delta)
    setCart([...updated])
  }

  const handleRemove = (name: string) => {
    const updated = removeFromCart(name)
    setCart([...updated])
  }

  const reportMissing = async (itemName: string) => {
    if (reportedMissing.has(itemName)) return
    setReportedMissing(prev => new Set(prev).add(itemName))
    if (!store) return
    await fetch('/api/log-unmet-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store.id, products: [itemName], source: 'user_tap' }),
    })
  }

  const submitRequestedItem = async () => {
    const item = requestInput.trim()
    if (!item || requestedItems.includes(item.toLowerCase())) return
    setRequestedItems(prev => [...prev, item.toLowerCase()])
    setRequestInput('')
    if (!store) return
    await fetch('/api/log-unmet-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store.id, products: [item], source: 'user_tap' }),
    })
  }

  // Products to show based on active tab + filters
  const sourceProducts = activeTab === 'store' && store
    ? HC_PRODUCTS.filter(p => storeItemNames.has(p.name.toLowerCase()))
    : HC_PRODUCTS

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return sourceProducts.filter(p => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory
      const matchSearch = !q || p.name.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [sourceProducts, activeCategory, search])

  // Items not at store (for "not carried" section in store tab)
  const unavailableFiltered = useMemo(() => {
    if (activeTab !== 'store' || !store) return []
    const q = search.toLowerCase().trim()
    return HC_PRODUCTS.filter(p => {
      if (storeItemNames.has(p.name.toLowerCase())) return false
      const matchCat = activeCategory === 'all' || p.category === activeCategory
      const matchSearch = !q || p.name.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [activeTab, store, storeItemNames, activeCategory, search])

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-32">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-[#1A7A6E] text-xl">←</button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A7A6E]">Healthy Corners Catalog</h1>
            {store ? (
              <p className="text-xs text-gray-500 truncate">
                {store.name} · {store.distance?.toFixed(2) ?? '?'} mi away
              </p>
            ) : (
              <p className="text-xs text-gray-500">{HC_PRODUCTS.length} products · DCCK Fall 2024</p>
            )}
          </div>
          {/* Cart button */}
          {cartCount > 0 && (
            <button
              onClick={openCart}
              className="relative bg-[#1A7A6E] text-white px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
            >
              🛒
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          )}
        </div>

        {/* No store selected notice */}
        {!store && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
            <span>📍</span>
            <div>
              <p className="font-semibold">No store selected</p>
              <p className="text-xs text-amber-700 mt-0.5">
                <button onClick={() => router.push('/stores')} className="underline">Pick a store</button>
                {' '}to see what's available near you and add items to your cart.
              </p>
            </div>
          </div>
        )}

        {/* Store banner */}
        {store && (
          <div className="bg-[#1A7A6E]/10 border border-[#1A7A6E]/30 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#1A7A6E]">{store.name}</p>
              <p className="text-xs text-[#1A7A6E]/70">{store.address}</p>
              {store.ward && <p className="text-xs text-[#1A7A6E]/60">Ward {store.ward}</p>}
            </div>
            <button
              onClick={() => router.push('/stores')}
              className="text-xs text-[#1A7A6E] border border-[#1A7A6E]/40 px-2.5 py-1 rounded-lg font-medium"
            >
              Change
            </button>
          </div>
        )}

        {/* Tabs: At Store / Full Catalog */}
        {store && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('store')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'store'
                  ? 'bg-[#1A7A6E] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              At {store.name.split(' ')[0]} ({storeInventory.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#1A7A6E] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Full Catalog ({HC_PRODUCTS.length})
            </button>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products (e.g. mango, kale, frozen…)"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A7A6E] mb-3"
        />

        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === key
                  ? 'bg-[#1A7A6E] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {activeTab === 'store' && store ? ` in stock at ${store.name.split(' ')[0]}` : ' in catalog'}
          {search && ` matching "${search}"`}
        </p>

        {/* Product list */}
        <div className="space-y-2">
          {filtered.length === 0 && unavailableFiltered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No products match your search.</div>
          ) : (
            filtered.map(product => {
              const storeItem = getStoreItem(product.name)
              const displayPrice = storeItem?.price ?? product.price
              const inCart = isInCart(product.name)
              const qty = cartQty(product.name)
              const nutrition = getNutrition(product.name)
              const isExpanded = expandedItem === product.name

              return (
                <ProductCard
                  key={product.name}
                  product={{ ...product, price: displayPrice }}
                  inCart={inCart}
                  qty={qty}
                  nutrition={nutrition}
                  isExpanded={isExpanded}
                  available={true}
                  onExpand={() => setExpandedItem(isExpanded ? null : product.name)}
                  onAdd={() => handleAddToCart({ name: product.name, price: displayPrice, unit: product.unit })}
                  onQty={(d) => handleQty(product.name, d)}
                />
              )
            })
          )}
        </div>

        {/* Not carried at this store */}
        {activeTab === 'store' && unavailableFiltered.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="text-xs text-gray-400 font-medium whitespace-nowrap">Not carried at this store</p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="space-y-2">
              {unavailableFiltered.map(product => (
                <ProductCard
                  key={product.name}
                  product={product}
                  inCart={false}
                  qty={0}
                  nutrition={getNutrition(product.name)}
                  isExpanded={expandedItem === product.name}
                  available={false}
                  reported={reportedMissing.has(product.name)}
                  onExpand={() => setExpandedItem(expandedItem === product.name ? null : product.name)}
                  onAdd={() => {}}
                  onQty={() => {}}
                  onReportMissing={() => reportMissing(product.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Request any item not in catalog */}
        {store && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Don't see what you need?</p>
            <p className="text-xs text-gray-400 mb-3">
              Tell the store owner what you'd like them to stock — your request goes directly to their demand dashboard.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={requestInput}
                onChange={e => setRequestInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitRequestedItem() }}
                placeholder="e.g. plantains, masa harina, scotch bonnet…"
                className="flex-1 bg-[#F5F0E8] rounded-lg px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={submitRequestedItem}
                disabled={!requestInput.trim()}
                className="px-3 py-2 bg-[#1A7A6E] text-white rounded-lg text-sm font-semibold disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {requestedItems.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {requestedItems.map(item => (
                  <span key={item} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full capitalize">
                    ✓ {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p>Prices from DCCK Healthy Corners Fall 2024 catalog</p>
          <p>Nutrition: USDA FoodData Central estimates</p>
          <p className="italic">Not affiliated with DCCK, USDA, or DC SNAP</p>
        </div>
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#F5F0E8] via-[#F5F0E8]">
          <div className="max-w-lg mx-auto flex gap-2">
            <button
              onClick={openCart}
              className="flex-1 bg-[#1A7A6E] text-white rounded-xl py-3.5 flex items-center justify-between px-4 shadow-lg"
            >
              <span className="font-semibold">🛒 View Cart ({cartCount} items)</span>
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
            </button>
            <button
              onClick={() => {
                if (store) {
                  router.push(`/chat?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}&storeAddress=${encodeURIComponent(store.address)}`)
                } else {
                  router.push('/')
                }
              }}
              className="bg-[#C07A00] text-white rounded-xl px-4 py-3.5 text-sm font-bold shadow-lg"
            >
              Plan Meals →
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <p className="font-bold text-[#1A7A6E] text-lg">🛒 My Cart</p>
              <button onClick={() => setShowCart(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Your cart is empty.</p>
              ) : (
                cart.map(item => (
                  <div key={item.name} className="flex items-center gap-3 bg-[#F5F0E8] rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#2C2C2C] truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">${item.unitPrice.toFixed(2)} / {item.unit}</p>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { const u = updateQty(item.name, item.qty - 1); setCart([...u]) }}
                        className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 font-bold text-base flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        onClick={() => { const u = updateQty(item.name, item.qty + 1); setCart([...u]) }}
                        className="w-7 h-7 rounded-full bg-[#1A7A6E] text-white font-bold text-base flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-bold text-[#2C2C2C] w-14 text-right shrink-0">
                      ${(item.unitPrice * item.qty).toFixed(2)}
                    </p>
                    <button
                      onClick={() => { const u = removeFromCart(item.name); setCart([...u]) }}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-[#2C2C2C]">Total</span>
                  <span className="text-xl font-bold text-[#1A7A6E]">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false)
                    if (store) {
                      router.push(`/chat?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}&storeAddress=${encodeURIComponent(store.address)}`)
                    } else {
                      router.push('/')
                    }
                  }}
                  className="w-full bg-[#1A7A6E] text-white font-bold rounded-xl py-3.5"
                >
                  Continue to Meal Planner →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

// ─── Product Card ────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: { name: string; category: string; price: number; unit: string; grade: string }
  inCart: boolean
  qty: number
  nutrition: ReturnType<typeof getNutrition>
  isExpanded: boolean
  available: boolean
  reported?: boolean
  onExpand: () => void
  onAdd: () => void
  onQty: (delta: number) => void
  onReportMissing?: () => void
}

function ProductCard({
  product, inCart, qty, nutrition, isExpanded, available, reported,
  onExpand, onAdd, onQty, onReportMissing,
}: ProductCardProps) {
  const catEmoji = product.category === 'fruit' ? '🍎' : product.category === 'vegetable' ? '🥦' : '❄️'
  const gradeClass = GRADE_COLORS[product.grade] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${available ? 'border-gray-100' : 'border-gray-100 opacity-70'}`}>
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-xl shrink-0">{catEmoji}</span>

        <button onClick={onExpand} className="flex-1 min-w-0 text-left">
          <p className={`font-semibold text-sm leading-snug ${available ? 'text-[#2C2C2C]' : 'text-gray-400'}`}>
            {product.name}
          </p>
          <p className="text-xs text-gray-400 capitalize">{product.category}</p>
        </button>

        <div className="shrink-0 flex flex-col items-end gap-1 mr-2">
          <p className={`text-sm font-bold ${available ? 'text-[#1A7A6E]' : 'text-gray-400'}`}>
            ${product.price.toFixed(2)}
            <span className="font-normal text-gray-400 text-xs"> / {product.unit}</span>
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${gradeClass}`}>
            {product.grade}
          </span>
        </div>

        {/* Add to cart / qty controls / report missing */}
        {available ? (
          inCart ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onQty(-1)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold text-base flex items-center justify-center"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-bold text-[#1A7A6E]">{qty}</span>
              <button
                onClick={() => onQty(1)}
                className="w-7 h-7 rounded-full bg-[#1A7A6E] text-white font-bold text-base flex items-center justify-center"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="shrink-0 bg-[#1A7A6E] text-white text-xs font-bold px-3 py-2 rounded-xl"
            >
              + Add
            </button>
          )
        ) : (
          <button
            onClick={onReportMissing}
            disabled={reported}
            className={`shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-all ${
              reported
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-700'
            }`}
          >
            {reported ? '✓ Reported' : 'Report Missing'}
          </button>
        )}
      </div>

      {/* Expanded nutrition */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {nutrition ? (
            <>
              <p className="text-xs font-semibold text-gray-400 mt-3 mb-2 uppercase tracking-wide">
                Nutrition per {product.unit} · USDA estimates
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: 'Cal',     value: Math.round(nutrition.calories),           unit: 'kcal' },
                  { label: 'Protein', value: nutrition.protein_g.toFixed(1),            unit: 'g' },
                  { label: 'Carbs',   value: nutrition.carbs_g.toFixed(1),              unit: 'g' },
                  { label: 'Fiber',   value: nutrition.fiber_g.toFixed(1),              unit: 'g' },
                  { label: 'Vit C',   value: Math.round(nutrition.vitamin_c_mg),        unit: 'mg' },
                ].map(n => (
                  <div key={n.label} className="bg-[#F5F0E8] rounded-lg py-2 text-center">
                    <p className="text-xs font-bold text-[#1A7A6E]">{n.value}</p>
                    <p className="text-[9px] text-gray-400">{n.unit}</p>
                    <p className="text-[9px] text-gray-500">{n.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-3">Nutrition info unavailable.</p>
          )}
          <div className="mt-3 flex gap-1.5 flex-wrap">
            <span className="text-xs bg-[#1A7A6E]/10 text-[#1A7A6E] px-2.5 py-1 rounded-full">SNAP Eligible</span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">HC Certified</span>
            {product.grade === 'A' && (
              <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">Top Nutrition Pick</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
