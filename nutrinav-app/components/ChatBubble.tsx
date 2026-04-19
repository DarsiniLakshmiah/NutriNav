'use client'

import ShoppingList, { CartItem } from './ShoppingList'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  cartItemNames?: Set<string>
  onAddToCart?: (item: CartItem) => void
  onRemoveFromCart?: (name: string) => void
}

function hasShoppingList(text: string): boolean {
  return /🛒|Shopping List:/i.test(text) && /^[•\-\*]\s+.+[×x].+\$/m.test(text)
}

export default function ChatBubble({ role, content, cartItemNames, onAddToCart, onRemoveFromCart }: ChatBubbleProps) {
  const isUser = role === 'user'

  if (!isUser && hasShoppingList(content) && cartItemNames && onAddToCart && onRemoveFromCart) {
    return (
      <div className="flex justify-start mb-4">
        <div className="w-8 h-8 rounded-full bg-[#1A7A6E] flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 mt-1">
          N
        </div>
        <div className="max-w-[88%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3">
          <ShoppingList
            text={content}
            cartItemNames={cartItemNames}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#1A7A6E] flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 mt-1">
          N
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#1A7A6E] text-white rounded-br-sm'
            : 'bg-white text-[#2C2C2C] border border-gray-200 rounded-bl-sm shadow-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
