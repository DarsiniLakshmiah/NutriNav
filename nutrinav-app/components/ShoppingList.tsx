'use client'

import { getNutrition } from '@/lib/nutrition'
import { CartItem } from '@/lib/cart'

export type { CartItem }

interface ShoppingListProps {
  text: string
  cartItemNames: Set<string>
  onAddToCart: (item: CartItem) => void
  onRemoveFromCart: (name: string) => void
}

function parseShoppingList(text: string): CartItem[] {
  const lines = text.split('\n')
  const items: CartItem[] = []

  for (const line of lines) {
    const match = line.match(/^[•\-\*]\s+(.+?)\s+[×x]\s+(\d+(?:\.\d+)?)\s+[—-]+\s+\$(\d+(?:\.\d+)?)/)
    if (match) {
      const rawName = match[1].trim()
      const qty = parseFloat(match[2])
      const totalPrice = parseFloat(match[3])

      const unitMatch = rawName.match(/^(.+?)\s+\(([^)]+)\)$/)
      const name = unitMatch ? unitMatch[1].trim() : rawName
      const unit = unitMatch ? unitMatch[2] : 'ea'
      const unitPrice = qty > 0 ? totalPrice / qty : totalPrice

      items.push({ name, qty, unitPrice, unit, inCart: false })
    }
  }
  return items
}

function extractTotal(text: string): number | null {
  const match = text.match(/Total:\s+\$(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

function extractNonListText(text: string): { before: string; after: string } {
  const listStart = text.search(/🛒|Shopping List:/)
  const lines = text.split('\n')
  const listEnd = lines.findIndex(l => l.startsWith('Total:'))
  const afterLines = listEnd >= 0 ? lines.slice(listEnd + 1).join('\n').trim() : ''
  const before = listStart > 0 ? text.slice(0, listStart).trim() : ''
  return { before, after: afterLines }
}

export default function ShoppingList({ text, cartItemNames, onAddToCart, onRemoveFromCart }: ShoppingListProps) {
  const items = parseShoppingList(text)
  const total = extractTotal(text)
  const { before, after } = extractNonListText(text)

  const toggle = (item: CartItem) => {
    if (cartItemNames.has(item.name)) {
      onRemoveFromCart(item.name)
    } else {
      onAddToCart({ ...item, inCart: true })
    }
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {before && <p className="text-sm leading-relaxed whitespace-pre-wrap">{before}</p>}

      <div className="bg-[#F5F0E8] rounded-xl p-3 border border-[#1A7A6E]/20">
        <p className="text-xs font-bold text-[#1A7A6E] uppercase tracking-wide mb-2">🛒 Shopping List</p>

        <div className="space-y-2">
          {items.map((item, i) => {
            const inCart = cartItemNames.has(item.name)
            const nutrition = getNutrition(item.name)

            return (
              <button
                key={i}
                onClick={() => toggle(item)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl border-2 transition-all text-left ${
                  inCart
                    ? 'bg-[#1A7A6E] border-[#1A7A6E] text-white'
                    : 'bg-white border-gray-200 text-[#2C2C2C] hover:border-[#1A7A6E]/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  inCart ? 'bg-white border-white' : 'border-gray-300'
                }`}>
                  {inCart && (
                    <svg className="w-3 h-3 text-[#1A7A6E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{item.name}</p>
                  <p className={`text-xs ${inCart ? 'text-white/70' : 'text-gray-400'}`}>
                    {item.qty} {item.unit}
                  </p>
                  {nutrition && (
                    <div className={`flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-xs ${inCart ? 'text-white/80' : 'text-gray-500'}`}>
                      <span>{Math.round(nutrition.calories * item.qty)} cal</span>
                      <span>·</span>
                      <span>{(nutrition.protein_g * item.qty).toFixed(1)}g protein</span>
                      <span>·</span>
                      <span>{(nutrition.fiber_g * item.qty).toFixed(1)}g fiber</span>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">${(item.unitPrice * item.qty).toFixed(2)}</p>
                  <p className={`text-xs ${inCart ? 'text-white/70' : 'text-gray-400'}`}>
                    ${item.unitPrice.toFixed(2)} each
                  </p>
                  <p className={`text-xs mt-0.5 font-medium ${inCart ? 'text-white' : 'text-[#1A7A6E]'}`}>
                    {inCart ? '✓ In cart' : '+ Add'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">List total</p>
            <p className="font-bold text-[#2C2C2C]">${total?.toFixed(2) ?? '—'}</p>
          </div>
          <p className="text-xs text-gray-400">Tap items to add to cart →</p>
        </div>
      </div>

      {after && <p className="text-sm leading-relaxed whitespace-pre-wrap">{after}</p>}
    </div>
  )
}
