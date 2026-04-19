export interface InventoryItem {
  storeId: string
  name: string
  category: string
  price: number
  unit: string
  grade: string
  inStock: boolean
}

// Real Healthy Corners product catalog — Fall 2024 prices from DCCK
// Source: Healthy Corners OSSE presentation, Fall 2024 price list
const HC_PRODUCTS: Omit<InventoryItem, 'storeId' | 'inStock'>[] = [
  // Fruits
  { name: 'Apple',                    category: 'fruit',     price: 0.50, unit: 'ea',    grade: 'A' },
  { name: 'Applesauce',               category: 'fruit',     price: 0.50, unit: 'ea',    grade: 'A' },
  { name: 'Apple Slices (fresh cut)', category: 'fruit',     price: 2.50, unit: 'ea',    grade: 'A' },
  { name: 'Banana',                   category: 'fruit',     price: 0.50, unit: 'ea',    grade: 'A' },
  { name: 'Grapes (fresh cut)',        category: 'fruit',     price: 3.00, unit: 'ea',    grade: 'A' },
  { name: 'Lemon',                    category: 'fruit',     price: 0.50, unit: 'ea',    grade: 'A' },
  { name: 'Lime',                     category: 'fruit',     price: 0.50, unit: 'ea',    grade: 'A' },
  { name: 'Mango (fresh cut)',         category: 'fruit',     price: 2.50, unit: 'ea',    grade: 'A' },
  { name: 'Mango (whole)',             category: 'fruit',     price: 2.00, unit: 'ea',    grade: 'A' },
  { name: 'Mixed Fruit (fresh cut)',   category: 'fruit',     price: 3.50, unit: 'ea',    grade: 'A' },
  { name: 'Orange',                   category: 'fruit',     price: 1.00, unit: 'ea',    grade: 'A' },
  { name: 'Pear',                     category: 'fruit',     price: 0.75, unit: 'ea',    grade: 'A' },
  { name: 'Pineapple (fresh cut)',     category: 'fruit',     price: 2.50, unit: 'ea',    grade: 'A' },
  { name: 'Pineapple (whole)',         category: 'fruit',     price: 2.50, unit: 'ea',    grade: 'A' },
  { name: 'Strawberry',               category: 'fruit',     price: 4.00, unit: '1 lb',  grade: 'A' },
  { name: 'Trail Mix',                category: 'fruit',     price: 4.00, unit: 'ea',    grade: 'B' },
  // Vegetables
  { name: 'Avocado',                  category: 'vegetable', price: 1.50, unit: 'ea',    grade: 'A' },
  { name: 'Broccoli Crown',           category: 'vegetable', price: 1.50, unit: 'ea',    grade: 'A' },
  { name: 'Green Cabbage',            category: 'vegetable', price: 1.75, unit: 'ea',    grade: 'A' },
  { name: 'Baby Carrots',             category: 'vegetable', price: 1.50, unit: 'bag',   grade: 'A' },
  { name: 'Collards',                 category: 'vegetable', price: 1.50, unit: 'ea',    grade: 'A' },
  { name: 'Cucumber (seedless)',       category: 'vegetable', price: 1.00, unit: 'ea',    grade: 'A' },
  { name: 'Garlic (loose)',            category: 'vegetable', price: 1.00, unit: 'ea',    grade: 'A' },
  { name: 'Garlic (sleeve)',           category: 'vegetable', price: 1.00, unit: 'ea',    grade: 'A' },
  { name: 'Ginger',                   category: 'vegetable', price: 2.00, unit: 'bag',   grade: 'A' },
  { name: 'Kale',                     category: 'vegetable', price: 1.50, unit: 'ea',    grade: 'A' },
  { name: 'Lettuce (Bowery)',          category: 'vegetable', price: 2.50, unit: 'ea',    grade: 'A' },
  { name: 'Iceberg Lettuce',          category: 'vegetable', price: 2.50, unit: 'ea',    grade: 'A' },
  { name: 'Mushrooms',                category: 'vegetable', price: 3.00, unit: 'ea',    grade: 'A' },
  { name: 'Onion',                    category: 'vegetable', price: 0.75, unit: 'ea',    grade: 'A' },
  { name: 'Peppers',                  category: 'vegetable', price: 1.25, unit: 'ea',    grade: 'A' },
  { name: 'Jalapeño Pepper',          category: 'vegetable', price: 0.50, unit: 'ea',    grade: 'A' },
  { name: 'Peppers & Onions (cut)',    category: 'vegetable', price: 3.50, unit: 'ea',    grade: 'A' },
  { name: 'Idaho Potato',             category: 'vegetable', price: 0.75, unit: 'ea',    grade: 'A' },
  { name: 'Sweet Potato (Yam)',       category: 'vegetable', price: 0.50, unit: 'ea',    grade: 'A' },
  { name: 'Salad Meal Kit',           category: 'vegetable', price: 4.00, unit: 'ea',    grade: 'A' },
  { name: 'Honeynut Squash',          category: 'vegetable', price: 1.50, unit: 'ea',    grade: 'A' },
  { name: 'Cherry Tomatoes',          category: 'vegetable', price: 3.00, unit: 'ea',    grade: 'A' },
  { name: 'Tomato',                   category: 'vegetable', price: 1.00, unit: 'ea',    grade: 'A' },
  // Frozen
  { name: 'Frozen Berry Blend',       category: 'frozen',    price: 3.05, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Blueberries',       category: 'frozen',    price: 3.05, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Broccoli Florets',  category: 'frozen',    price: 1.45, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Broccoli Blend',    category: 'frozen',    price: 1.80, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Collard Greens',    category: 'frozen',    price: 1.85, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Corn',              category: 'frozen',    price: 1.70, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Corn (mini cobs)',  category: 'frozen',    price: 2.40, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Green Beans',       category: 'frozen',    price: 1.55, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Mango (cubed)',     category: 'frozen',    price: 3.40, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Peaches (sliced)',  category: 'frozen',    price: 3.35, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Peas',              category: 'frozen',    price: 2.05, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Pepper Stir Fry',   category: 'frozen',    price: 2.55, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Pineapple Chunks',  category: 'frozen',    price: 3.15, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Spinach',           category: 'frozen',    price: 1.50, unit: 'bag',   grade: 'A' },
  { name: 'Frozen Strawberries',      category: 'frozen',    price: 3.45, unit: 'bag',   grade: 'A' },
]

function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return function () {
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0
    return (h >>> 0) / 0xffffffff
  }
}

// Each store stocks a random 12–18 items from the real HC catalog
export function generateStoreInventory(storeId: string): InventoryItem[] {
  const rand = seededRandom(storeId)
  const shuffled = [...HC_PRODUCTS].sort(() => rand() - 0.5)
  const count = 12 + Math.floor(rand() * 7)
  return shuffled.slice(0, count).map(p => ({
    ...p,
    storeId,
    inStock: true,
  }))
}

// Extract items from shopping list format: "• Item × qty — $price"
export function getRequestedIngredients(aiResponse: string): string[] {
  const lines = aiResponse.split('\n')
  const ingredients: string[] = []
  for (const line of lines) {
    const match = line.match(/^[•\-\*]\s+(.+?)\s*[×x×—]/)
    if (match) ingredients.push(match[1].trim())
  }
  return ingredients
}

export function findMissingIngredients(
  requested: string[],
  inventory: InventoryItem[]
): string[] {
  const inventoryNames = inventory.map(i => i.name.toLowerCase())
  return requested.filter(
    req => !inventoryNames.some(
      inv => inv.includes(req.toLowerCase()) || req.toLowerCase().includes(inv)
    )
  )
}
