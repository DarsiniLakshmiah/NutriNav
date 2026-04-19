'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ChatBubble from '@/components/ChatBubble'
import { MicButton } from '@/components/MicButton'
import DisclaimerModal from '@/components/DisclaimerModal'
import { CartItem } from '@/lib/cart'
import { getCart, saveCart, addToCart as addToCartStore, removeFromCart as removeFromCartStore } from '@/lib/cart'
import { speak } from '@/lib/tts'
import { InventoryItem } from '@/lib/synthetic-data'
import { sumNutrition } from '@/lib/nutrition'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeId = searchParams.get('storeId') ?? ''
  const storeName = searchParams.get('storeName') ?? 'Your Nearest Store'
  const storeAddress = searchParams.get('storeAddress') ?? ''

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm NutriNav 🌿\n\nI'll help you plan healthy, affordable meals using what's in stock at ${storeName}.\n\nTell me:\n• Your weekly SNAP budget\n• How many people you're feeding\n• Any dietary preferences or restrictions\n\nYou can type or hold the mic to speak in any language!` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [pendingTaps, setPendingTaps] = useState<string[]>([])
  const [requestInput, setRequestInput] = useState('')
  const [requestedItems, setRequestedItems] = useState<string[]>([])
  const [disclaimer, setDisclaimer] = useState(false)
  const [detectedLang, setDetectedLang] = useState('en')
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [showCart, setShowCart] = useState(false)

  // Persistent cart backed by sessionStorage — shared with HC App catalog
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)

  const cartItemNames = new Set(cartItems.map(i => i.name))
  const cartCount = cartItems.length
  const cartTotal = cartItems.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const cartNutrition = sumNutrition(cartItems.map(i => ({ name: i.name, qty: i.qty })))

  // Load cart from sessionStorage on mount (picks up items added in HC App)
  useEffect(() => {
    setCartItems(getCart())
  }, [])

  const addToCart = (item: CartItem) => {
    const updated = addToCartStore(item)
    setCartItems([...updated])
  }

  const removeFromCart = (name: string) => {
    const updated = removeFromCartStore(name)
    setCartItems([...updated])
  }

  useEffect(() => {
    const accepted = sessionStorage.getItem('disclaimer_accepted')
    if (!accepted) setDisclaimer(true)
  }, [])

  useEffect(() => {
    if (storeId) {
      fetch(`/api/inventory?storeId=${storeId}`)
        .then(r => r.json())
        .then(setInventory)
    }
  }, [storeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string, lang = detectedLang) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    setMissingItems([])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, storeId, storeName, storeAddress, inventory }),
      })
      const { reply, missingIngredients } = await res.json()
      const aiMsg: Message = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, aiMsg])
      if (missingIngredients?.length) setMissingItems(missingIngredients)
      if (ttsEnabled) speak(reply, lang)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleTranscript = (text: string, lang: string) => {
    setDetectedLang(lang)
    sendMessage(text, lang)
  }

  const tapMissingItem = async (item: string) => {
    if (pendingTaps.includes(item)) return
    setPendingTaps(prev => [...prev, item])
    await fetch('/api/log-unmet-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, products: [item], source: 'user_tap' }),
    })
  }

  const submitRequestedItem = async () => {
    const item = requestInput.trim()
    if (!item || requestedItems.includes(item.toLowerCase())) return
    setRequestedItems(prev => [...prev, item.toLowerCase()])
    setRequestInput('')
    await fetch('/api/log-unmet-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, products: [item], source: 'user_tap' }),
    })
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {disclaimer && (
        <DisclaimerModal onAccept={() => { sessionStorage.setItem('disclaimer_accepted', '1'); setDisclaimer(false) }} />
      )}

      {/* Header */}
      <div className="bg-[#1A7A6E] text-white px-4 pt-6 pb-4 safe-top">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="text-white/80 text-xl">←</button>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{storeName}</p>
            <p className="text-xs text-white/70 truncate">{storeAddress}</p>
          </div>
          <button
            onClick={() => setTtsEnabled(v => !v)}
            className={`text-sm px-2 py-1 rounded-lg ${ttsEnabled ? 'bg-white text-[#1A7A6E]' : 'bg-white/20'}`}
            title="Toggle voice readback"
          >
            🔊
          </button>
        </div>
        <div className="max-w-lg mx-auto mt-2">
          <p className="text-xs text-white/60">
            {inventory.length} items in stock · {inventory.filter(i => i.grade === 'A').length} Grade A
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            cartItemNames={cartItemNames}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
          />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 text-gray-400 text-sm animate-pulse">
              NutriNav is thinking…
            </div>
          </div>
        )}

        {/* AI-detected missing items */}
        {missingItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
            <p className="text-xs font-semibold text-amber-800 mb-2">Items the AI needed but this store doesn't carry:</p>
            <div className="flex flex-wrap gap-2">
              {missingItems.map(item => (
                <button
                  key={item}
                  onClick={() => tapMissingItem(item)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    pendingTaps.includes(item)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-amber-700 border-amber-300'
                  }`}
                >
                  {pendingTaps.includes(item) ? '✓ ' : '+ '}{item}
                </button>
              ))}
            </div>
            {pendingTaps.length > 0 && (
              <p className="text-xs text-amber-600 mt-2">Reported to the store owner.</p>
            )}
          </div>
        )}

        {/* Persistent missing item request — always visible after first message */}
        {messages.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Want something this store doesn't have?
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={requestInput}
                onChange={e => setRequestInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitRequestedItem() }}
                placeholder="e.g. plantains, masa harina, scotch bonnet…"
                className="flex-1 bg-[#F5F0E8] rounded-lg px-3 py-2 text-xs outline-none"
              />
              <button
                onClick={submitRequestedItem}
                disabled={!requestInput.trim()}
                className="px-3 py-2 bg-[#1A7A6E] text-white rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                Report
              </button>
            </div>
            {requestedItems.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1.5">Reported to store owner:</p>
                <div className="flex flex-wrap gap-1.5">
                  {requestedItems.map(item => (
                    <span
                      key={item}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full capitalize"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Cart drawer */}
      {showCart && cartCount > 0 && (
        <div className="bg-white border-t border-[#1A7A6E]/30 px-4 pt-3 pb-2 max-w-lg mx-auto w-full">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-sm text-[#1A7A6E]">🛒 My Cart ({cartCount} items)</p>
            <button onClick={() => setShowCart(false)} className="text-gray-400 text-lg leading-none">×</button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => removeFromCart(item.name)}
                    className="text-gray-300 hover:text-red-400 text-base leading-none shrink-0"
                    title="Remove"
                  >
                    ×
                  </button>
                  <span className="text-[#2C2C2C] truncate">{item.name} × {item.qty}</span>
                </div>
                <span className="font-medium text-[#2C2C2C] shrink-0 ml-2">${(item.unitPrice * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Nutrition totals */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">Cart Nutrition (total)</p>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { label: 'Cal', value: Math.round(cartNutrition.calories) },
                { label: 'Protein', value: `${cartNutrition.protein_g.toFixed(0)}g` },
                { label: 'Carbs', value: `${cartNutrition.carbs_g.toFixed(0)}g` },
                { label: 'Fiber', value: `${cartNutrition.fiber_g.toFixed(0)}g` },
              ].map(n => (
                <div key={n.label} className="bg-[#F5F0E8] rounded-lg py-1">
                  <p className="text-xs font-bold text-[#1A7A6E]">{n.value}</p>
                  <p className="text-[10px] text-gray-400">{n.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <span className="text-sm font-bold text-[#2C2C2C]">Total</span>
            <span className="font-bold text-[#1A7A6E]">${cartTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Floating cart button */}
      {cartCount > 0 && !showCart && (
        <div className="px-4 pb-2 max-w-lg mx-auto w-full">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-[#1A7A6E] text-white rounded-xl py-2.5 flex items-center justify-between px-4 shadow-md"
          >
            <span className="font-semibold">🛒 View Cart ({cartCount} items)</span>
            <span className="font-bold">${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Type your budget, family size, preferences…"
            disabled={loading}
            className="flex-1 bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm outline-none resize-none disabled:opacity-50"
          />
          <MicButton onTranscript={handleTranscript} />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-[#1A7A6E] text-white rounded-full flex items-center justify-center text-lg disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <ChatContent />
    </Suspense>
  )
}
