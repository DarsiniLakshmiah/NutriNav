import { NextRequest } from 'next/server'
import { chatWithGroq, buildSystemPrompt } from '@/lib/groq'
import { chatWithOllama } from '@/lib/ollama'
import { findMissingIngredients, getRequestedIngredients } from '@/lib/synthetic-data'

export async function POST(req: NextRequest) {
  const { messages, storeId, storeName, storeAddress, inventory } = await req.json()

  let reply = ''
  try {
    reply = await chatWithGroq(messages, storeName, storeAddress, inventory)
  } catch {
    try {
      const systemPrompt = buildSystemPrompt(storeName, storeAddress, inventory)
      reply = await chatWithOllama(messages, systemPrompt)
    } catch {
      reply = "I'm currently offline. Here's a sample meal plan for a family of 4 on $20:\n\n🛒 Shopping List:\n• Chicken Thighs × 2 lbs — $6.98\n• Brown Rice × 1 bag — $1.49\n• Canned Black Beans × 2 — $1.78\n• Collard Greens × 1 bunch — $1.29\n• Onions × 1 lb — $0.69\nTotal: $12.23\n\n🍳 Recipe: Chicken & Rice Bowl\n1. Season chicken thighs and bake at 400°F for 35 mins\n2. Cook rice per package instructions\n3. Heat beans with cumin and garlic\n4. Sauté collard greens with onion\n5. Serve over rice — feeds 4!"
    }
  }

  const requestedIngredients = getRequestedIngredients(reply)
  const missingIngredients = findMissingIngredients(requestedIngredients, inventory)

  if (missingIngredients.length > 0 && storeId) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/log-unmet-demand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          products: missingIngredients,
          source: 'ai_gap',
        }),
      })
    } catch {
      // Non-critical — don't fail the chat request
    }
  }

  return Response.json({ reply, missingIngredients })
}
