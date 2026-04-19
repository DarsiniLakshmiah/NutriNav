// Shared cart backed by sessionStorage so HC App and Chat both read/write the same cart.

export interface CartItem {
  name: string
  qty: number
  unitPrice: number
  unit: string
  inCart: boolean
}

const KEY = 'nutrinav_cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(KEY, JSON.stringify(items))
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart()
  const idx = cart.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase())
  if (idx >= 0) {
    cart[idx].qty += item.qty
    cart[idx].inCart = true
  } else {
    cart.push({ ...item, inCart: true })
  }
  saveCart(cart)
  return cart
}

export function updateQty(name: string, qty: number): CartItem[] {
  const cart = getCart()
  const idx = cart.findIndex(i => i.name.toLowerCase() === name.toLowerCase())
  if (idx >= 0) {
    if (qty <= 0) {
      cart.splice(idx, 1)
    } else {
      cart[idx].qty = qty
    }
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(name: string): CartItem[] {
  const cart = getCart().filter(i => i.name.toLowerCase() !== name.toLowerCase())
  saveCart(cart)
  return cart
}

export function clearCart(): void {
  saveCart([])
}
