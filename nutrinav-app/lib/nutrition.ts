// Nutritional values per unit for all Healthy Corners catalog items
// Source: USDA FoodData Central approximate values per typical serving/unit

export interface NutritionInfo {
  calories: number
  protein_g: number
  carbs_g: number
  fiber_g: number
  vitamin_c_mg: number
}

const NUTRITION_DB: Record<string, NutritionInfo> = {
  // ── Fruits ──────────────────────────────────────────────
  'apple':                   { calories: 95,  protein_g: 0.5, carbs_g: 25,  fiber_g: 4.4, vitamin_c_mg: 8.4  },
  'applesauce':              { calories: 50,  protein_g: 0.2, carbs_g: 14,  fiber_g: 0.5, vitamin_c_mg: 1.0  },
  'apple slices':            { calories: 57,  protein_g: 0.3, carbs_g: 15,  fiber_g: 2.6, vitamin_c_mg: 5.0  },
  'banana':                  { calories: 105, protein_g: 1.3, carbs_g: 27,  fiber_g: 3.1, vitamin_c_mg: 10.3 },
  'grapes':                  { calories: 104, protein_g: 1.1, carbs_g: 27,  fiber_g: 1.4, vitamin_c_mg: 16.3 },
  'lemon':                   { calories: 17,  protein_g: 0.6, carbs_g: 5.4, fiber_g: 1.6, vitamin_c_mg: 30.7 },
  'lime':                    { calories: 20,  protein_g: 0.5, carbs_g: 7.1, fiber_g: 1.9, vitamin_c_mg: 19.5 },
  'mango':                   { calories: 202, protein_g: 2.8, carbs_g: 50,  fiber_g: 5.4, vitamin_c_mg: 122  },
  'mixed fruit':             { calories: 80,  protein_g: 0.8, carbs_g: 21,  fiber_g: 2.0, vitamin_c_mg: 25.0 },
  'orange':                  { calories: 62,  protein_g: 1.2, carbs_g: 15,  fiber_g: 3.1, vitamin_c_mg: 69.7 },
  'pear':                    { calories: 101, protein_g: 0.7, carbs_g: 27,  fiber_g: 5.5, vitamin_c_mg: 7.7  },
  'pineapple':               { calories: 82,  protein_g: 0.9, carbs_g: 22,  fiber_g: 2.3, vitamin_c_mg: 78.9 },
  'strawberry':              { calories: 145, protein_g: 3.0, carbs_g: 35,  fiber_g: 9.0, vitamin_c_mg: 254  },
  'trail mix':               { calories: 693, protein_g: 20,  carbs_g: 60,  fiber_g: 7.0, vitamin_c_mg: 1.2  },
  // ── Vegetables ──────────────────────────────────────────
  'avocado':                 { calories: 320, protein_g: 4.0, carbs_g: 17,  fiber_g: 13.5,vitamin_c_mg: 20.1 },
  'broccoli':                { calories: 119, protein_g: 9.9, carbs_g: 23,  fiber_g: 8.7, vitamin_c_mg: 270  },
  'green cabbage':           { calories: 88,  protein_g: 4.6, carbs_g: 21,  fiber_g: 8.7, vitamin_c_mg: 165  },
  'cabbage':                 { calories: 88,  protein_g: 4.6, carbs_g: 21,  fiber_g: 8.7, vitamin_c_mg: 165  },
  'baby carrots':            { calories: 100, protein_g: 2.0, carbs_g: 23,  fiber_g: 6.0, vitamin_c_mg: 9.6  },
  'carrots':                 { calories: 100, protein_g: 2.0, carbs_g: 23,  fiber_g: 6.0, vitamin_c_mg: 9.6  },
  'collards':                { calories: 108, protein_g: 9.0, carbs_g: 20,  fiber_g: 14,  vitamin_c_mg: 234  },
  'collard greens':          { calories: 108, protein_g: 9.0, carbs_g: 20,  fiber_g: 14,  vitamin_c_mg: 234  },
  'cucumber':                { calories: 16,  protein_g: 0.7, carbs_g: 3.8, fiber_g: 0.5, vitamin_c_mg: 5.1  },
  'garlic':                  { calories: 40,  protein_g: 1.8, carbs_g: 9.0, fiber_g: 0.6, vitamin_c_mg: 7.0  },
  'ginger':                  { calories: 80,  protein_g: 1.8, carbs_g: 18,  fiber_g: 2.0, vitamin_c_mg: 5.0  },
  'kale':                    { calories: 136, protein_g: 11,  carbs_g: 28,  fiber_g: 5.4, vitamin_c_mg: 482  },
  'lettuce':                 { calories: 10,  protein_g: 0.9, carbs_g: 1.6, fiber_g: 1.2, vitamin_c_mg: 9.0  },
  'mushrooms':               { calories: 60,  protein_g: 8.6, carbs_g: 9.1, fiber_g: 2.9, vitamin_c_mg: 4.5  },
  'onion':                   { calories: 64,  protein_g: 1.8, carbs_g: 15,  fiber_g: 2.7, vitamin_c_mg: 11.8 },
  'peppers':                 { calories: 31,  protein_g: 1.0, carbs_g: 7.5, fiber_g: 2.5, vitamin_c_mg: 152  },
  'jalapeño':                { calories: 5,   protein_g: 0.2, carbs_g: 1.1, fiber_g: 0.5, vitamin_c_mg: 16.6 },
  'potato':                  { calories: 163, protein_g: 4.3, carbs_g: 37,  fiber_g: 3.8, vitamin_c_mg: 19.7 },
  'sweet potato':            { calories: 112, protein_g: 2.0, carbs_g: 26,  fiber_g: 3.9, vitamin_c_mg: 22.3 },
  'salad meal kit':          { calories: 120, protein_g: 3.0, carbs_g: 12,  fiber_g: 3.0, vitamin_c_mg: 25.0 },
  'honeynut squash':         { calories: 55,  protein_g: 1.4, carbs_g: 14,  fiber_g: 1.5, vitamin_c_mg: 18.0 },
  'cherry tomatoes':         { calories: 54,  protein_g: 2.6, carbs_g: 12,  fiber_g: 3.6, vitamin_c_mg: 55.0 },
  'tomato':                  { calories: 22,  protein_g: 1.1, carbs_g: 4.8, fiber_g: 1.5, vitamin_c_mg: 17.0 },
  // ── Frozen ──────────────────────────────────────────────
  'frozen berry blend':      { calories: 150, protein_g: 1.5, carbs_g: 37,  fiber_g: 6.0, vitamin_c_mg: 20.0 },
  'frozen blueberries':      { calories: 193, protein_g: 2.5, carbs_g: 47,  fiber_g: 7.5, vitamin_c_mg: 28.0 },
  'frozen broccoli florets': { calories: 96,  protein_g: 8.5, carbs_g: 18,  fiber_g: 6.1, vitamin_c_mg: 165  },
  'frozen broccoli blend':   { calories: 80,  protein_g: 5.0, carbs_g: 14,  fiber_g: 4.0, vitamin_c_mg: 80.0 },
  'frozen collard greens':   { calories: 85,  protein_g: 7.0, carbs_g: 14,  fiber_g: 10,  vitamin_c_mg: 140  },
  'frozen corn':             { calories: 255, protein_g: 8.2, carbs_g: 59,  fiber_g: 7.5, vitamin_c_mg: 12.0 },
  'frozen corn mini cobs':   { calories: 120, protein_g: 4.0, carbs_g: 28,  fiber_g: 3.5, vitamin_c_mg: 7.0  },
  'frozen green beans':      { calories: 96,  protein_g: 5.6, carbs_g: 22,  fiber_g: 9.2, vitamin_c_mg: 36.0 },
  'frozen mango':            { calories: 238, protein_g: 2.0, carbs_g: 60,  fiber_g: 6.0, vitamin_c_mg: 90.0 },
  'frozen peaches':          { calories: 136, protein_g: 2.5, carbs_g: 34,  fiber_g: 5.0, vitamin_c_mg: 14.0 },
  'frozen peas':             { calories: 238, protein_g: 16,  carbs_g: 42,  fiber_g: 15,  vitamin_c_mg: 58.0 },
  'frozen pepper stir fry':  { calories: 80,  protein_g: 2.5, carbs_g: 18,  fiber_g: 4.0, vitamin_c_mg: 120  },
  'frozen pineapple chunks': { calories: 150, protein_g: 1.5, carbs_g: 39,  fiber_g: 4.5, vitamin_c_mg: 55.0 },
  'frozen spinach':          { calories: 65,  protein_g: 8.6, carbs_g: 10,  fiber_g: 7.2, vitamin_c_mg: 56.0 },
  'frozen strawberries':     { calories: 109, protein_g: 1.0, carbs_g: 28,  fiber_g: 4.0, vitamin_c_mg: 105  },
}

export function getNutrition(itemName: string): NutritionInfo | null {
  const key = itemName.toLowerCase()
    .replace(/\(.*?\)/g, '')   // strip parentheses
    .replace(/fresh cut|whole|cubed|sliced|florets|head|sleeve|loose|seedless/g, '')
    .trim()

  // Exact match first
  if (NUTRITION_DB[key]) return NUTRITION_DB[key]

  // Partial match — find first key that the item name contains
  for (const [dbKey, val] of Object.entries(NUTRITION_DB)) {
    if (key.includes(dbKey) || dbKey.includes(key)) return val
  }

  return null
}

export function sumNutrition(items: Array<{ name: string; qty: number }>): NutritionInfo {
  return items.reduce(
    (total, item) => {
      const n = getNutrition(item.name)
      if (!n) return total
      return {
        calories:     total.calories     + n.calories     * item.qty,
        protein_g:    total.protein_g    + n.protein_g    * item.qty,
        carbs_g:      total.carbs_g      + n.carbs_g      * item.qty,
        fiber_g:      total.fiber_g      + n.fiber_g      * item.qty,
        vitamin_c_mg: total.vitamin_c_mg + n.vitamin_c_mg * item.qty,
      }
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fiber_g: 0, vitamin_c_mg: 0 }
  )
}
