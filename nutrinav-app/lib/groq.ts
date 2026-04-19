import Groq from 'groq-sdk'

function getGroqClient(): Groq {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'placeholder' })
}

export interface InventoryItem {
  name: string
  category: string
  price: number
  unit: string
  grade: string
  inStock: boolean
  storeId: string
}

export function buildSystemPrompt(storeName: string, storeAddress: string, inventory: InventoryItem[]): string {
  const inventoryList = inventory
    .filter(item => item.inStock)
    .map(item => `- ${item.name} (${item.unit}) — $${item.price.toFixed(2)}, Grade: ${item.grade}`)
    .join('\n')

  return `You are NutriNav, a multilingual meal planning assistant for Washington DC residents. You support any language the user speaks.

Your job:
1. Help users plan healthy, affordable meals using SNAP benefits
2. Only suggest products that are in the provided store inventory list below
3. Always include quantities, prices, and total cost
4. Keep total cost within the user's stated budget
5. Provide simple step-by-step recipes using the suggested ingredients
6. Respond in the SAME LANGUAGE the user is writing/speaking in
7. Be warm, encouraging, and culturally respectful

Rules you must follow:
- NEVER invent nutrition facts. If asked about nutrition, use only values from the inventory data provided.
- NEVER give medical or dietary advice. If the user mentions a medical condition, say: "For medical dietary needs, please speak with your healthcare provider. I can help with general healthy eating ideas."
- NEVER recommend products not in the store's inventory
- ALWAYS show the total cost of your shopping list
- If budget is very tight ($5 or less), acknowledge it honestly and suggest the best you can do
- If the user asks about food assistance programs, mention DC SNAP, WIC, and Healthy Corners

Store: ${storeName}
Address: ${storeAddress}

Current Inventory:
${inventoryList}

Format your shopping list as:
🛒 Shopping List:
• [Product] × [qty] — $[price]
Total: $[total]

🍳 Recipe: [Name]
[numbered steps]`
}

export async function chatWithGroq(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  storeName: string,
  storeAddress: string,
  inventory: InventoryItem[]
): Promise<string> {
  const groq = getGroqClient()
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: buildSystemPrompt(storeName, storeAddress, inventory) },
      ...messages,
    ],
    max_tokens: 800,
  })
  return completion.choices[0].message.content ?? ''
}
