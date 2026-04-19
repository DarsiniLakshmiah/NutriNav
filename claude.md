# NutriNav — CLAUDE.md
> AI-powered bilingual meal planning assistant for DC corner store residents
> George Hacks × UN Reboot the Earth Hackathon — Track 2: GW Global Food Institute

---

## What This Project Is

NutriNav is a **conversational AI meal planner** that helps SNAP-eligible DC residents eat healthier within their budget by connecting them to real inventory at their nearest Healthy Corners corner store.

A resident opens the app, shares their location, tells the AI their SNAP budget + family size + cultural food preferences (by voice or text, in English or Spanish), and gets back a realistic shopping list built from what's actually stocked at the closest Healthy Corners store — with step-by-step recipes.

This is **pure software**. No delivery, no supply chain, no warehouse.

---

## What DCCK Already Has (Do NOT Rebuild)

DCCK (DC Central Kitchen) already operates the **Healthy Corners** program:
- Delivers fresh produce + pantry staples to 75+ DC corner stores Mon–Fri
- Runs the **HC Shopper App** for store owners (inventory management)
- Has store locations, product catalogs, and pricing data
- Has relationships with corner store owners across DC wards 7 & 8

NutriNav sits **on top of** this infrastructure. We are not replacing it. We connect the resident's need to DCCK's existing supply.

---

## The 4 Core Features

### 1. Location Finder
- Detect user GPS location via browser Geolocation API
- Calculate distance to all 75 Healthy Corners stores using Haversine formula
- Show nearest stores sorted by distance with color-coded tiers:
  - 🟢 Green: ≤ 0.25 miles (walkable)
  - 🟡 Yellow: 0.25–1 mile (moderate)
  - 🔴 Red: > 1 mile (USDA urban food desert threshold)
- Show Leaflet.js map with store pins (OpenStreetMap tiles, free)
- Flag if no store within 1 mile → show "food access gap" notice (aligns with USDA threshold)

### 2. Conversational Meal Planner (AI Chat + Voice)
- Multilingual chat: text input supported in 99+ languages (Groq Whisper auto-detects spoken language, Llama 3.3 responds in the same language)
- Full voice support (speech-in + speech-out): English, Spanish
- Text chat only (speech-in works, TTS readback depends on device having that voice installed): Amharic, French, Haitian Creole, Vietnamese, and most major world languages
- Priority languages for DC Ward 7 & 8 communities: English, Spanish (Salvadoran/Guatemalan diaspora), Amharic (DC has the largest Ethiopian diaspora in the US), French/Haitian Creole, Vietnamese
- User inputs: SNAP weekly budget, family size, dietary restrictions, cultural food preferences
- AI outputs: shopping list from real store inventory + recipes with step-by-step instructions
- Voice mode: hold mic → Groq Whisper transcribes → LLM responds → Web Speech API reads response aloud
- Powered by **Groq API** → Llama 3.3 70B (free tier, very fast)
- Fallback: **Ollama** → Llama 3.1 8B (local, offline)
- Medical disclaimer shown on first load

### 3. Store Owner Demand Signal Dashboard
The signal that matters is not what the AI recommended — it's what users asked for that the store **couldn't provide**. Two sources feed this:

**Source A — Missing Ingredient Events (automatic)**
- When a user asks for a specific dish or ingredient (e.g. "I want to make jerk chicken", "do you have plantains?"), the AI builds a shopping list from the store's inventory
- Any ingredient the user needed that was not in the store's inventory is logged as an **unmet demand event**
- These are captured by diffing the user's requested ingredients against the store inventory before the AI responds

**Source B — User "Missing Item" Taps (manual)**
- After receiving their shopping list, the resident sees a one-tap prompt: "Anything missing from this list?"
- They tap items they wanted but couldn't get — no typing required
- Each tap logs an unmet demand event for that product at that store

**Dashboard for store owner:**
- Two-column view: what users asked for vs. what the store had
- The gap between them = stocking recommendations
- Color-coded by unmet demand count (7-day and 30-day windows):
  - 🔴 > 20 unmet requests → "Stock This — High Unmet Demand"
  - 🟡 8–20 unmet requests → "Consider Stocking — Growing Need"
  - 🟢 < 8 unmet requests → "No action needed"
- Store owner sees only their own store's data
- No ML, no personas — gap count with thresholds

### 4. Gap Analysis Map (DCCK Expansion Intelligence)
- Pull DC census tract population data (Census ACS, free API)
- Use USDA Food Access Research Atlas to identify food desert tracts
- Generate synthetic user location pings proportional to population
- Flag synthetic users who are > 1 mile from any Healthy Corners store
- Cluster unserved pings → show heatmap on Leaflet.js map
- Ranked priority areas list (ward + tract + estimated unserved population)
- Labeled: "Synthetic data — for planning purposes only"
- This is for DCCK leadership, not residents

---

## Tech Stack

### Frontend
- **Next.js 14** (React framework, App Router)
- **Tailwind CSS** (styling)
- **Leaflet.js + react-leaflet** (maps, OpenStreetMap tiles — free)
- **Web Speech API** (built into browser — SpeechSynthesis for TTS, SpeechRecognition for offline STT)
- **MediaRecorder API** (audio capture for Groq Whisper)

### Backend
- **Next.js API Routes** (serverless, no separate Express needed)
- **Supabase** (open source PostgreSQL — real-time DB, auth, free tier at supabase.com)
  - Replaces Firebase entirely — one platform for database + auth + real-time subscriptions

### AI / ML
- **Groq API** → Llama 3.3 70B (meal planning LLM, free tier)
- **Groq API** → Whisper large-v3 (voice transcription, auto language detection)
- **Ollama** → Llama 3.1 8B (offline LLM fallback, runs locally)
- **XGBoost classifier** (nutrition grading A–D, grades USDA data — does NOT generate it)
- Web Speech API SpeechRecognition (offline STT fallback if Groq unavailable)

### Data Sources (All Free)
- **Open Food Facts API** — barcode → product name, nutrition facts
- **USDA FoodData Central API** — canonical nutrition values (free key)
- **Census ACS API** — tract-level population + household income
- **USDA Food Access Research Atlas** — food desert designations by census tract
- **Healthy Corners product list** — synthetic inventory based on DCCK's published HC product catalog

---

## Color Tokens (Match the JSX Mockup)

```js
const colors = {
  teal:  '#1A7A6E',   // primary brand
  gold:  '#C07A00',   // accent / warning
  red:   '#C0392B',   // alert / urgent
  green: '#1E7A3A',   // success / nearby
  bg:    '#F5F0E8',   // warm off-white background
  text:  '#2C2C2C',   // primary text
}
```

---

## Project File Structure

```
nutrinav/
├── CLAUDE.md                          ← this file
├── .env.local                         ← API keys (never commit)
├── package.json
├── next.config.js
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       ← entry point (LocationScreen)
│   ├── stores/page.tsx                ← StoresScreen
│   ├── chat/page.tsx                  ← ChatScreen (meal planner)
│   ├── dashboard/page.tsx             ← Store owner demand dashboard
│   └── gap-map/page.tsx               ← DCCK gap analysis map
│
├── components/
│   ├── LocationPermission.tsx
│   ├── StoreCard.tsx
│   ├── StoreMap.tsx                   ← Leaflet map
│   ├── ChatBubble.tsx
│   ├── MicButton.tsx                  ← press-hold voice input
│   ├── DemandAlert.tsx
│   └── GapHeatmap.tsx
│
├── lib/
│   ├── haversine.ts                   ← distance calculation
│   ├── groq.ts                        ← Groq API client (LLM + Whisper)
│   ├── ollama.ts                      ← offline LLM fallback
│   ├── supabase.ts                    ← Supabase client (db + auth + realtime)
│   ├── nutrition.ts                   ← USDA + Open Food Facts lookup
│   ├── xgboost-grade.ts               ← nutrition grade A–D
│   └── synthetic-data.ts              ← generate test inventory + user pings
│
├── data/
│   ├── healthy-corners-stores.json    ← all 75 store lat/lng + address
│   ├── synthetic-inventory.json       ← per-store product list + prices
│   ├── dc-census-tracts.json          ← tract population data
│   └── food-desert-tracts.json        ← USDA atlas food desert flags
│
└── api/
    ├── chat/route.ts                  ← POST /api/chat → Groq LLM
    ├── transcribe/route.ts            ← POST /api/transcribe → Groq Whisper
    ├── stores/route.ts                ← GET /api/stores?lat=&lng=
    ├── inventory/route.ts             ← GET /api/inventory?storeId=
    └── log-unmet-demand/route.ts      ← POST /api/log-unmet-demand (Supabase insert)
```

---

## Environment Variables (.env.local)

```env
# Groq (free at console.groq.com)
GROQ_API_KEY=your_groq_api_key_here

# USDA FoodData Central (free at fdc.nal.usda.gov/api-guide)
USDA_API_KEY=your_usda_key_here

# Supabase (free at supabase.com — create project, grab keys from Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key   # server-side only, never expose to browser

# Ollama (runs locally, no key needed)
OLLAMA_BASE_URL=http://localhost:11434

# Census API (free at api.census.gov/data/key_signup.html)
CENSUS_API_KEY=your_census_key_here
```

---

## Setup Instructions

```bash
# 1. Create project
npx create-next-app@latest nutrinav --typescript --tailwind --app
cd nutrinav

# 2. Install dependencies
npm install @supabase/supabase-js groq-sdk react-leaflet leaflet
npm install @types/leaflet --save-dev

# 3. Set up Supabase
#    → Go to supabase.com → New project (takes ~2 min to spin up)
#    → Settings → API → copy URL + anon key + service role key into .env.local
#    → SQL Editor → run the schema below to create tables

# 4. Install Ollama for offline fallback
# Mac: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.1:8b

# 5. Copy .env.local and fill in all keys

# 6. Run dev server
npm run dev
```

---

## Build Order (Hackathon Timeline)

### Hour 0–1: Data Foundation
- [ ] Create `data/healthy-corners-stores.json` with all 75 store lat/lng
- [ ] Run `lib/synthetic-data.ts` to generate inventory for each store (8–15 products, DCCK catalog items)
- [ ] Verify Haversine function works against known DC distances

### Hour 1–2: Location + Store Finder
- [ ] `app/page.tsx` — browser geolocation permission prompt
- [ ] `app/stores/page.tsx` — sorted store list with distance color tiers
- [ ] `components/StoreMap.tsx` — Leaflet map with store pins
- [ ] Test: walk through LocationScreen → StoresScreen flow

### Hour 2–4: Meal Planner Chat (Core Feature)
- [ ] `api/chat/route.ts` — POST to Groq Llama 3.3 70B with system prompt
- [ ] System prompt (see below) — bilingual, budget-aware, inventory-grounded
- [ ] `app/chat/page.tsx` — chat UI with text input
- [ ] `components/ChatBubble.tsx` — user vs AI message styles
- [ ] Test: "I have $20 for 4 people, what should I buy at [store]?"

### Hour 4–5: Voice Pipeline
- [ ] `components/MicButton.tsx` — press-hold MediaRecorder
- [ ] `api/transcribe/route.ts` — send audio blob to Groq Whisper
- [ ] Wire transcription result back to chat input
- [ ] Add Web Speech API TTS to read AI response aloud
- [ ] Test: speak in English, then Spanish — verify language detection + bilingual response

### Hour 5–6: Demand Dashboard
- [ ] `api/log-unmet-demand/route.ts` — insert unmet demand events into Supabase `unmet_demand_events` table
- [ ] In `api/chat/route.ts`: after building the shopping list, diff requested ingredients against store inventory → POST any gaps to `/api/log-unmet-demand` with `source: 'ai_gap'`
- [ ] In `app/chat/page.tsx`: after shopping list renders, show "Anything missing?" prompt with tappable product chips → POST taps with `source: 'user_tap'`
- [ ] `app/dashboard/page.tsx` — two-column view: requested vs. stocked, with gap alerts
- [ ] Test: ask for plantains (not in synthetic inventory) → verify red alert appears in dashboard

### Hour 6–7: Gap Map
- [ ] Load `data/dc-census-tracts.json` + `data/food-desert-tracts.json`
- [ ] Generate synthetic user pings in food desert tracts
- [ ] Calculate distance from each ping to nearest HC store
- [ ] Flag pings > 1 mile as unserved
- [ ] `app/gap-map/page.tsx` — Leaflet heatmap + ranked priority list

### Hour 7–8: Polish + Demo Prep
- [ ] Medical disclaimer modal on first chat load
- [ ] "Synthetic data" footer labels everywhere synthetic data appears
- [ ] Offline fallback: if Groq fails → Ollama → graceful error message
- [ ] Demo script walkthrough (see Demo Script section below)
- [ ] Deploy to Vercel: `vercel --prod`

---

## Conversation Context Memory

The AI maintains full conversational context within a session. This is not a special feature — it works by passing the entire message history to Groq on every request. The model sees everything said so far and can refer back to it naturally.

**What this means in practice:**
- User says "I have $20 for 4 people" → later says "make it cheaper" → AI remembers the $20 and 4 people without being asked again
- User mentions "no pork" → AI applies that restriction to every recipe for the rest of the session
- User asks "what about breakfast?" → AI knows which store they're at and what budget they have from earlier in the thread
- Conversation feels natural — no need to repeat context

**How it works (frontend state → API):**

```typescript
// app/chat/page.tsx
const [messages, setMessages] = useState<Message[]>([
  { role: 'assistant', content: 'Hi! I\'m NutriNav...' }
])

const sendMessage = async (userText: string) => {
  const updatedMessages = [...messages, { role: 'user', content: userText }]
  setMessages(updatedMessages)  // show user bubble immediately

  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: updatedMessages,  // ← full history sent every time
      storeId: selectedStore.id,
      inventory: storeInventory,
    })
  })
  const { reply } = await res.json()
  setMessages(prev => [...prev, { role: 'assistant', content: reply }])
}
```

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, storeId, inventory } = await req.json()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: buildSystemPrompt(inventory) },  // store context injected here
      ...messages,   // ← full conversation history from frontend
    ],
    max_tokens: 800,
  })

  return Response.json({ reply: completion.choices[0].message.content })
}
```

**Key points:**
- Message history lives in React `useState` — never written to Supabase (privacy)
- History resets when the user closes/refreshes the app (session-scoped, intentional)
- Groq's Llama 3.3 70B has a 128k token context window — a full meal planning session (20–30 exchanges) uses roughly 3–5k tokens, well within limits
- Store inventory is re-injected via the system prompt on every call so the AI always has current stock context

## Groq LLM System Prompt

```
You are NutriNav, a multilingual meal planning assistant for Washington DC residents. You support any language the user speaks.

Your job:
1. Help users plan healthy, affordable meals using SNAP benefits
2. Only suggest products that are in the provided store inventory list
3. Always include quantities, prices, and total cost
4. Keep total cost within the user's stated budget
5. Provide simple step-by-step recipes using the suggested ingredients
6. Respond in the SAME LANGUAGE the user is writing/speaking in
7. Be warm, encouraging, and culturally respectful

Rules you must follow:
- NEVER invent nutrition facts. If asked about nutrition, use only values from the inventory data provided.
- NEVER give medical or dietary advice. If the user mentions a medical condition, say:
  "For medical dietary needs, please speak with your healthcare provider. I can help with general healthy eating ideas."
- NEVER recommend products not in the store's inventory
- ALWAYS show the total cost of your shopping list
- If budget is very tight ($5 or less), acknowledge it honestly and suggest the best you can do
- If the user asks about food assistance programs, mention DC SNAP, WIC, and Healthy Corners

Context you will receive per request:
- Store name + address
- Store inventory (product name, price, nutrition grade A–D)
- User's SNAP budget
- User's household size
- User's dietary flags (if any)
- User's cultural food preferences (if shared)

Format your shopping list as:
🛒 Shopping List:
• [Product] × [qty] — $[price]
Total: $[total]

🍳 Recipe: [Name]
[numbered steps]
```

---

## Voice Pipeline Code

```typescript
// components/MicButton.tsx
import { useRef, useState } from 'react'

export function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    audioChunks.current = []
    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data)
    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice.webm')

      try {
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
        const { text } = await res.json()
        onTranscript(text)
      } catch {
        // Fallback to Web Speech API
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.onresult = (e: any) => onTranscript(e.results[0][0].transcript)
        recognition.start()
      }
    }
    mediaRecorder.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      className={`rounded-full p-4 ${recording ? 'bg-red-500 animate-pulse' : 'bg-teal-700'}`}
    >
      🎤
    </button>
  )
}
```

```typescript
// app/api/transcribe/route.ts
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: Request) {
  const formData = await req.formData()
  const audioFile = formData.get('audio') as File

  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-large-v3',
    // No language param — auto-detects English, Spanish, etc.
    response_format: 'verbose_json',
  })

  return Response.json({
    text: transcription.text,
    language: transcription.language
  })
}
```

```typescript
// lib/tts.ts — Text-to-Speech (Web Speech API, no API key needed)
// Whisper returns ISO 639-1 codes ('en', 'es', 'am', 'fr', 'vi', etc.)
// Web Speech API uses BCP-47 tags ('en-US', 'es-US', 'am-ET', 'fr-FR', 'vi-VN')
const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-US',
  am: 'am-ET',   // Amharic
  fr: 'fr-FR',
  ht: 'fr-HT',   // Haitian Creole — falls back to French voice
  vi: 'vi-VN',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ar: 'ar-SA',
  pt: 'pt-BR',
}

export function speak(text: string, detectedLang = 'en') {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANG_MAP[detectedLang] ?? detectedLang
  utterance.rate = 0.9
  utterance.pitch = 1.0
  // If no voice available for this language, browser silently skips — no error thrown
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
```

---

## Haversine Distance Function

```typescript
// lib/haversine.ts
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8  // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export function getNearbyStores(userLat: number, userLng: number, stores: Store[]) {
  return stores
    .map(store => ({
      ...store,
      distance: haversineDistance(userLat, userLng, store.lat, store.lng)
    }))
    .sort((a, b) => a.distance - b.distance)
}
```

---

## Synthetic Data Strategy

```typescript
// lib/synthetic-data.ts
// Run once to generate data/synthetic-inventory.json
// Based on DCCK's published Healthy Corners product catalog

const HC_PRODUCTS = [
  { name: 'Bananas',           category: 'produce',  price: 0.49, unit: 'lb',            grade: 'A' },
  { name: 'Apples',            category: 'produce',  price: 0.79, unit: 'lb',            grade: 'A' },
  { name: 'Collard Greens',    category: 'produce',  price: 1.29, unit: 'bunch',         grade: 'A' },
  { name: 'Sweet Potatoes',    category: 'produce',  price: 0.99, unit: 'lb',            grade: 'A' },
  { name: 'Canned Black Beans',category: 'canned',   price: 0.89, unit: 'can',           grade: 'B' },
  { name: 'Brown Rice',        category: 'grains',   price: 1.49, unit: '2lb bag',       grade: 'B' },
  { name: 'Whole Grain Bread', category: 'grains',   price: 2.99, unit: 'loaf',          grade: 'B' },
  { name: 'Eggs (dozen)',      category: 'dairy',    price: 2.49, unit: 'dozen',         grade: 'A' },
  { name: 'Low-fat Milk',      category: 'dairy',    price: 1.99, unit: 'half-gallon',   grade: 'A' },
  { name: 'Canned Tuna',       category: 'protein',  price: 1.19, unit: 'can',           grade: 'B' },
  { name: 'Chicken Thighs',    category: 'protein',  price: 3.49, unit: 'lb',            grade: 'A' },
  { name: 'Peanut Butter',     category: 'protein',  price: 2.49, unit: 'jar',           grade: 'B' },
  { name: 'Frozen Broccoli',   category: 'frozen',   price: 1.49, unit: 'bag',           grade: 'A' },
  { name: 'Oatmeal',           category: 'grains',   price: 2.29, unit: 'container',     grade: 'A' },
]

// Each store stocks a random 8–12 items with ±15% price variation
export function generateStoreInventory(storeId: string) {
  const shuffled = [...HC_PRODUCTS].sort(() => 0.5 - Math.random())
  const count = 8 + Math.floor(Math.random() * 5)
  return shuffled.slice(0, count).map(p => ({
    ...p,
    storeId,
    price: +(p.price * (0.85 + Math.random() * 0.3)).toFixed(2),
    inStock: true,
  }))
}
```

---

## Supabase Database Schema

Run this in the Supabase SQL Editor to create all tables:

```sql
-- Stores table
create table stores (
  id          text primary key,
  name        text not null,
  address     text not null,
  lat         double precision not null,
  lng         double precision not null,
  ward        int
);

-- Inventory table (one row per product per store)
create table inventory (
  id          uuid primary key default gen_random_uuid(),
  store_id    text references stores(id),
  name        text not null,
  category    text,
  price       numeric(6,2),
  unit        text,
  grade       text check (grade in ('A','B','C','D')),
  in_stock    boolean default true
);

-- Unmet demand events (privacy-safe — no user ID, no location)
create table unmet_demand_events (
  id          uuid primary key default gen_random_uuid(),
  store_id    text references stores(id),
  product     text not null,          -- item requested but not in inventory
  source      text check (source in ('ai_gap', 'user_tap')),
              -- ai_gap  = AI detected item was needed but not stocked
              -- user_tap = resident tapped "missing" on their shopping list
  created_at  timestamptz default now()
);

-- Materialized demand counts per store per product (refreshed by a cron or trigger)
create table store_demand_counts (
  store_id    text references stores(id),
  product     text,
  count_7d    int default 0,
  count_30d   int default 0,
  alert       text check (alert in ('red','yellow','green')),
  updated_at  timestamptz default now(),
  primary key (store_id, product)
);

-- Row-level security: store owners can only read their own store's demand data
alter table store_demand_counts enable row level security;
create policy "owner sees own store" on store_demand_counts
  for select using (store_id = auth.jwt() ->> 'store_id');
```

**Supabase client setup:**

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Browser-safe client (uses anon key, respects RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side client (uses service role key — bypasses RLS, API routes only)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Logging an unmet demand event:**

```typescript
// app/api/log-unmet-demand/route.ts
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const { storeId, product, source } = await req.json()

  const { error } = await supabaseAdmin
    .from('unmet_demand_events')
    .insert({ store_id: storeId, product, source })

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ ok: true })
}
```

**Reading demand counts for the dashboard (with real-time subscription):**

```typescript
// app/dashboard/page.tsx
import { supabase } from '@/lib/supabase'

// One-time fetch
const { data } = await supabase
  .from('store_demand_counts')
  .select('*')
  .eq('store_id', storeId)
  .order('count_30d', { ascending: false })

// Real-time: dashboard updates live as new events come in
supabase
  .channel('demand-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'unmet_demand_events',
    filter: `store_id=eq.${storeId}`
  }, () => refetchCounts())
  .subscribe()
```

---

## Guardrails

### Nutrition Data Guardrails
- **NEVER** use LLM to generate or estimate nutrition facts
- USDA FoodData Central is the sole source of nutrition values
- Open Food Facts API for barcode → product identification
- XGBoost classifier only **grades** existing USDA values (A–D) — it does not create them
- If a product has no USDA data → display "Nutrition info unavailable" — do not interpolate

### Health & Medical Guardrails
- Medical disclaimer shown on first chat open (modal, must acknowledge before chatting)
- If user mentions: diabetes, hypertension, pregnancy, allergies, kidney disease → deflect
- Deflection phrase: *"For medical dietary needs, please speak with your healthcare provider or a registered dietitian."*
- AI does not give personalized medical nutrition therapy (MNT)
- AI gives general healthy eating guidance only (USDA MyPlate level)

### Location & Privacy Guardrails
- GPS coordinates used only for store distance calculation — never stored
- No user tracking, no location history in database
- Gap analysis uses **synthetic** pings only — zero real user location data
- Gap map footer: *"Synthetic data based on Census ACS + USDA Atlas — for planning purposes only"*
- Supabase Auth is anonymous for residents (no email/phone required — use Supabase anonymous sign-in)

### AI Output Guardrails
- LLM must only recommend products present in the store's inventory payload sent in the prompt
- Shopping list total must stay within user's stated budget
- If budget < $5: *"That's a tight budget. Here's the most nutritious option I can suggest:"*
- LLM cannot recommend supplements, medications, or diet products
- LLM response cap: 500 tokens for chat, 800 tokens for full meal plan
- Rate limit: 10 LLM calls per user per hour (Groq free tier: 14,400/day total)

### SNAP / Benefit Program Guardrails
- Never state specific SNAP benefit amounts (these change — refer to dc.gov/snap)
- Never imply NutriNav is officially affiliated with USDA, DC SNAP, or DCCK
- Footer disclaimer: *"NutriNav is an independent tool. Not affiliated with DCCK, USDA, or DC SNAP."*

### Equity & Language Guardrails
- UI must render correctly at 320px width (oldest smartphones in use)
- Minimum touch target: 44×44px (WCAG 2.1 AA)
- All text minimum contrast ratio 4.5:1
- Text chat supported in 99+ languages — Groq Whisper auto-detects, Llama 3.3 responds in kind
- Full voice (speech-in + TTS readback): English and Spanish guaranteed across all browsers
- All other languages: voice input works via Whisper; TTS readback works if the user's device has that language voice installed (most modern Android/iOS devices have Amharic, French, Vietnamese, etc.)
- Do NOT gate or block any language — let Whisper detect and Llama respond; TTS will either work or silently skip
- Never assume cultural food preferences — always ask the user explicitly

### Demand Dashboard Guardrails
- Store owner sees only their own store's data — no cross-store comparison
- Alerts are product-level only — not linked to any individual user
- Signal source is unmet demand only — what users needed but couldn't get. Never log what the AI already recommended from existing inventory (that's circular)
- Both signal sources labeled separately so owner can see: AI-detected gaps vs. user-reported gaps
- Threshold logic is deterministic: >20 unmet = red, 8–20 = yellow, <8 = green
- No ML — simple gap count with thresholds
- Dashboard clearly labeled: *"Based on items residents requested but couldn't find (last 30 days)"*

### Offline / Fallback Guardrails
- If Groq API fails → try Ollama (localhost:11434)
- If Ollama not running → show pre-cached sample meal plan with clear "offline" label
- If geolocation denied → show manual address/zip code entry field
- If Supabase write fails → queue event in memory, retry on next interaction (do not persist to localStorage)
- If Groq Whisper fails → fall back to Web Speech API SpeechRecognition

---

## What We Are NOT Building (Scope Limits)

- ❌ No delivery or logistics (DCCK already does this Mon–Fri)
- ❌ No payment processing or e-commerce
- ❌ No SNAP EBT integration (requires government partnership — out of scope)
- ❌ No real-time inventory sync with HC Shopper App (use synthetic data for prototype)
- ❌ No Amharic support at launch (noted as future work)
- ❌ No barcode scanning in resident view (products loaded per store from synthetic catalog)
- ❌ No personalized nutrition plans for medical conditions (MNT requires a dietitian)
- ❌ No tax PDF generation (CornerConnect feature — not NutriNav)

---

## Demo Script (8-minute hackathon demo)

**Setup:** Chrome browser, phone-sized window (375px), location permission pre-granted

**[0:00–1:00] Problem Frame**
*"75,000 DC residents in Wards 7 & 8 rely on SNAP benefits but struggle to find affordable, nutritious food within walking distance. DCCK's Healthy Corners puts produce in corner stores — but residents still don't know what's there, what they can afford, or how to cook it."*

**[1:00–2:30] Location → Nearest Store**
- Open app → location detected → show 3 nearest stores
- Tap first store (green, 0.18 miles)
- *"Here's your nearest Healthy Corners — less than a 5-minute walk."*

**[2:30–5:00] Voice Meal Planning**
- Tap chat tab → press and hold mic button
- Say: *"I have $20 for my family of 4 this week"*
- Show: Whisper transcribes → Llama 3.3 generates shopping list with store prices → total $18.74
- *"Watch — it only recommends things actually in stock at that corner store."*
- Press mic again: *"¿Puedes darme una receta para el pollo?"*
- Show: AI responds in Spanish with recipe steps
- *"Groq Whisper detected Spanish automatically — the AI responds in the user's language."*

**[5:00–6:30] Store Owner Dashboard**
- Switch to Dashboard tab
- Show: Plantains 🔴 20 residents needed this — not in stock, Scotch Bonnet Peppers 🔴 14 residents needed this — not in stock, Masa Harina 🟡 9 residents needed this — not in stock
- *"This isn't what the AI recommended — it's what residents actually asked for and couldn't get. The store never stocked plantains. Now the owner knows 20 people needed them this week."*
- Point to the source column: *"Half came from the AI detecting the gap, half from residents tapping 'missing' on their shopping list. One tap — no typing."*

**[6:30–7:30] Gap Map**
- Switch to Gap Map tab
- Show: red heatmap clusters in Ward 7 with no nearby store
- *"These are census-tract-level population centers with no Healthy Corners store within a mile. DCCK can use this to prioritize their next store partnerships."*

**[7:30–8:00] Close**
*"NutriNav connects a resident's need to DCCK's existing supply — no new infrastructure, no delivery, no warehouse. Just software. Built on Groq, Next.js, and Supabase — fully open source, zero proprietary lock-in."*

---

## Deployment

```bash
# Vercel (recommended — free tier)
npm install -g vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# GROQ_API_KEY
# USDA_API_KEY
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# CENSUS_API_KEY

# Note: Ollama runs locally only — not deployed to Vercel
# For production offline fallback: use pre-cached meal plan JSON in /data/
```

---

## Hackathon Alignment Checklist

- [x] Track 2: GW Global Food Institute — "The Corner Store of the Future"
- [x] Builds on existing DCCK / Healthy Corners infrastructure (doesn't duplicate it)
- [x] Addresses SNAP-eligible residents in food-insecure DC wards 7 & 8
- [x] Culturally responsive (99+ languages via Whisper + Llama, preference-aware, no assumptions)
- [x] Generates actionable demand signal for store owners (no guesswork restocking)
- [x] Identifies underserved areas for DCCK expansion planning (gap map)
- [x] All APIs free — Groq, USDA, Census ACS, Open Food Facts, OpenStreetMap
- [x] Deployable to Vercel in under 1 hour
- [x] No proprietary data required — synthetic data for prototype
- [x] Privacy by design — no user location stored, anonymous Supabase auth
- [x] Fully open source stack — Next.js, Supabase (PostgreSQL), Groq, Leaflet, no proprietary lock-in

---