# NutriNav

**AI-powered bilingual meal planning assistant for DC corner store residents**

> George Hacks × UN Reboot the Earth Hackathon — Track 2: GW Global Food Institute  
> MIT License · Open Source · Built on free APIs · Deployable in 5 minutes

---

## The Problem We're Solving

**75,000 residents** in Washington DC's Wards 7 and 8 live in federally designated food deserts. They receive SNAP benefits — but knowing how to spend $20 to feed a family of four, in your language, using what's actually on the shelf at your nearest corner store, is a problem no existing tool solves.

DC Central Kitchen (DCCK) already runs **Healthy Corners** — a program delivering fresh produce to 75+ corner stores across Wards 7 and 8. The supply exists. The stores exist. The SNAP dollars exist.

**The gap:** Nothing connects a resident's real need to that existing supply.

- A Spanish-speaking mother doesn't know which nearby corner store has collard greens today
- A store owner stocking shelves doesn't know residents want plantains — because no one asks twice
- DCCK leadership can't see which neighborhoods have zero walking-distance store access

NutriNav solves all three with one open-source application — no new infrastructure, no delivery network, no warehouse. Pure software sitting on top of what DCCK already built.

---

## Why NutriNav Is Different

| Existing Program | What It Does | What It Misses |
|---|---|---|
| DCCK Healthy Corners | Delivers produce to 75+ corner stores | Residents don't know what's stocked or how to cook it |
| HC Shopper App | Store owner inventory management | Not resident-facing; no AI, no meal planning |
| DC SNAP / WIC | Purchasing power for families | No guidance on what to buy or how to stretch it |
| USDA MyPlate | General nutrition education | Not localized to specific store inventory or budgets |
| Google Maps | Store locations and directions | No inventory, no meal planning, no SNAP context |
| Food bank apps | Connects people to pantries | Different system — doesn't serve retail corner stores |

NutriNav is the **first tool that connects a resident's real-time need to actual available inventory** at their nearest Healthy Corners store — with AI, voice, and multilingual support built in.

---

## Live Demo Flow (3 minutes)

> **Setup:** Chrome browser, phone-sized window (375px), Groq API key set

**Step 1 — Location**
- Open app → tap "Use My Location" or type any DC address
- App shows 3 nearest Healthy Corners stores, color-coded by walking distance
- Tap a store → directions open in Google Maps with real transit routes

**Step 2 — AI Meal Planning**
- Press and hold the mic button
- Say: *"I have $20 for my family of 4 this week"*
- Watch: Groq Whisper transcribes → Llama 3.3 builds a shopping list from that store's actual inventory → total $18.74
- Press mic again: *"¿Puedes darme una receta para el pollo?"*
- AI responds in Spanish with step-by-step recipe — language detected automatically

**Step 3 — Add to Cart**
- Tap any item in the AI's shopping list → added to shared cart
- Switch to HC Catalog tab → browse all 54 HC products with nutrition info
- Add items directly with + / − quantity controls

**Step 4 — Missing Items**
- Tap "Report Missing" on any item the store doesn't carry
- Or type any item in the free-text "Don't see what you need?" input

**Step 5 — Store Owner Dashboard**
- Switch to Store Owner view → see demand dashboard
- Plantains: 🔴 20 residents needed this — not in stock
- Store owner can add plantains to inventory in two taps → live for residents immediately

**Step 6 — DCCK Gap Map**
- Open Gap Analysis Map → red/amber circles show census tracts with no HC store within walking distance
- Circles sized by population — biggest circles = most underserved residents
- Priority list ranks tracts by distance, population, SNAP household percentage

---

## Features

### For Residents
- **Find your nearest store** — GPS or free-text address search (OpenStreetMap Nominatim, no API key)
- **AI meal planner** — tells you what to buy at that specific store, within your budget, with recipes
- **Any language** — Groq Whisper detects the spoken language, Llama 3.3 responds in kind (99+ languages)
- **Voice in, voice out** — hold mic to speak, hear the response read back via Web Speech API
- **HC Product Catalog** — all 54 DCCK products with USDA nutrition data, filterable by category
- **Shared cart** — add items from AI suggestions and from catalog into one cart
- **Report missing items** — one tap to signal what you needed but couldn't find

### For Store Owners
- **Demand dashboard** — see what residents asked for but couldn't get (7-day and 30-day windows)
- **Two demand signals:** AI-detected gaps and resident-reported gaps, labeled separately
- **Inventory manager** — toggle items in/out of stock, update prices, add from HC catalog or custom
- **Real-time** — changes go live for residents immediately

### For DCCK Leadership
- **Gap Analysis Map** — Leaflet map with census tract circles sized by population, colored by severity
- **Priority list** — ranked by distance to nearest store, population, SNAP household %
- **Scales from synthetic to real** — starts with Census/USDA baseline, automatically replaces with real session data as users grow (no code changes needed)

---

## Technical Implementation

### Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | Full-stack in one repo — API routes + React, no separate server |
| Database | Supabase (PostgreSQL) | Open source, free tier, real-time, row-level security |
| AI Chat | Groq → Llama 3.3 70B | Free tier, 128k context window, fastest inference available |
| Voice STT | Groq → Whisper large-v3 | Auto language detection — no language parameter needed |
| Voice TTS | Web Speech API | Browser-native, zero cost, 50+ languages |
| Maps | Leaflet + OpenStreetMap | Fully open source, no billing |
| Geocoding | Nominatim (OSM) | Free address → coordinates, no API key |
| Census lookup | US Census Geocoder | Free coordinates → census tract, no API key |
| Navigation | Google Maps URL scheme | Opens real transit/walking routes, no API key |
| Nutrition | USDA FoodData Central | Embedded — authoritative, no runtime calls needed |
| Styling | Tailwind CSS | Mobile-first, 320px minimum width |

### Architecture

```
User enters location (GPS or address)
        │
        ├──► Nominatim geocoding (address → lat/lng)
        ▼
  /api/stores ──► Haversine sort ──► Nearest stores displayed
        │
        ├──► FIRE-AND-FORGET: /api/log-session
        │         ├── Census Geocoder → tract GEOID
        │         └── Supabase INSERT tract_sessions (no PII stored)
        ▼
User selects store → /api/inventory
        │
        ├── Supabase inventory table (if store owner has set real data)
        └── Fallback: deterministic synthetic inventory from HC catalog
        │
        ▼
  /api/chat ──► Groq Llama 3.3 70B
        ├── System prompt injects: store name, inventory, user budget
        ├── Full conversation history sent every turn (128k context)
        ├── AI builds shopping list from in-stock items only
        └── Diffs requested vs. available → missing ingredients detected
                │
                └──► /api/log-unmet-demand → Supabase unmet_demand_events
                                                    │
                                                    ▼
                                        /api/demand-counts
                                                    │
                                                    ▼
                                        Store owner dashboard
```

### Data Pipeline: Synthetic → Real

The Gap Analysis Map starts with a synthetic baseline and automatically improves as users grow:

```
Every user session:
  POST /api/log-session
    ├── Census Geocoder: lat/lng → census tract GEOID (no precise location stored)
    └── Supabase: tract_geoid | ward | nearest_store_miles | session_date

GET /api/gap-data (gap map reads this):
    ├── Aggregate tract_sessions by tract_geoid
    ├── Tracts with ≥5 real sessions → use real avg distance, show "✓ N sessions" badge
    └── Tracts with <5 sessions → fill from Census/USDA synthetic baseline
```

| User scale | Gap map data |
|---|---|
| 0 (today) | 100% Census ACS + USDA Food Access Atlas baseline |
| 100 users | Synthetic + green "✓ sessions" badges on active tracts |
| 1,000 users | Real data dominates; synthetic fills only unvisited tracts |
| 10,000+ users | Fully real — DCCK has a live picture of underserved DC |

### Privacy By Design

| Data | Stored | Where | Retention |
|---|---|---|---|
| GPS coordinates | Never | — | — |
| Census tract (derived from GPS) | Yes | Supabase `tract_sessions` | Indefinitely (anonymous) |
| Chat messages | Never | React session state only | Cleared on tab close |
| Missing item requests (product name only) | Yes | Supabase | Indefinitely |
| Cart contents | Session | `sessionStorage` | Cleared on tab close |

No accounts. No email. No phone number. No user ID. Anonymous Supabase sessions.

---

## Accessibility & Design

- **Mobile-first** — designed at 375px, tested at 320px (oldest smartphones in use)
- **Touch targets** — minimum 44×44px throughout (WCAG 2.1 AA)
- **Color contrast** — minimum 4.5:1 ratio on all text
- **Voice input** — MediaRecorder → Groq Whisper with Web Speech API fallback
- **Voice output** — Web Speech API TTS reads AI responses in the user's detected language
- **Color-coded distance tiers** on store cards (green/yellow/red) with text labels — not color alone
- **Offline fallback** — if Groq fails → local Ollama → pre-cached sample meal plan

---

## Scaling & Continued Development

NutriNav is designed to improve automatically as it grows — no manual intervention needed.

### The Demand Flywheel
```
Residents report missing items
        ↓
Store owners see demand dashboard
        ↓
Owners stock the requested items
        ↓
Residents find what they need
        ↓
Fewer missing item reports → gap closed
```

### Development Roadmap

**Phase 1 — Prototype (complete)**
- AI chat, voice, multilingual support
- Synthetic inventory baseline
- Real demand logging from day one
- Session logging pipeline to Supabase

**Phase 2 — Store Owner Adoption**
- DCCK introduces inventory dashboard to partner stores
- Real inventory replaces synthetic store-by-store
- Demand dashboard creates measurable restocking decisions

**Phase 3 — Data Flywheel**
- Session volume → gap map becomes fully real
- Unmet demand signal → owners stock community-requested items
- DCCK uses map to prioritize new store partnerships

**Phase 4 — Deep Integration**
- DCCK API access to HC Shopper App → real-time inventory sync
- SNAP EBT integration (requires USDA partnership)
- Expand beyond DC to other DCCK-style programs nationally

---

## Repository Structure

```
NutriNav/
├── README.md                          ← This file
├── LICENSE                            ← MIT
└── nutrinav-app/
    ├── app/
    │   ├── page.tsx                   ← Home: location entry
    │   ├── stores/page.tsx            ← Store finder + session logging
    │   ├── chat/page.tsx              ← AI meal planner + cart
    │   ├── hc-app/page.tsx            ← HC product catalog + Add to Cart
    │   ├── dashboard/page.tsx         ← Store owner demand dashboard
    │   ├── dashboard/inventory/       ← Inventory management
    │   └── gap-map/page.tsx           ← DCCK gap analysis map
    ├── app/api/
    │   ├── chat/route.ts              ← Groq LLM endpoint
    │   ├── transcribe/route.ts        ← Groq Whisper STT
    │   ├── stores/route.ts            ← Nearest stores
    │   ├── inventory/route.ts         ← Store inventory
    │   ├── log-session/route.ts       ← Anonymous session logging
    │   ├── log-unmet-demand/route.ts  ← Missing item reporting
    │   ├── demand-counts/route.ts     ← Demand aggregation
    │   └── gap-data/route.ts          ← Real + synthetic gap blend
    ├── components/                    ← StoreCard, StoreMap, ChatBubble,
    │                                     ShoppingList, MicButton, DemandAlert
    ├── lib/
    │   ├── cart.ts                    ← Shared sessionStorage cart
    │   ├── census.ts                  ← Census Geocoder client
    │   ├── groq.ts                    ← Groq API client
    │   ├── haversine.ts               ← Distance calculation
    │   ├── nutrition.ts               ← USDA nutrition database
    │   ├── synthetic-data.ts          ← HC catalog + inventory generator
    │   └── supabase.ts                ← DB client
    └── data/
        ├── healthy-corners-stores.json  ← 50+ real DC store locations
        └── food-desert-tracts.json      ← Census tract gap baseline
```

---

## Setup & Usage

### Prerequisites
- Node.js 18+
- Free [Supabase](https://supabase.com) project (takes 2 minutes)
- Free [Groq API key](https://console.groq.com) (instant signup)

### Install

```bash
git clone <repo-url>
cd NutriNav/nutrinav-app
npm install
```

### Configure

Create `nutrinav-app/.env.local`:

```env
# Groq (free at console.groq.com)
GROQ_API_KEY=your_groq_api_key

# Supabase (free at supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Create Supabase tables

Run once in **Supabase → SQL Editor**:

```sql
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL, name text NOT NULL, category text,
  price numeric(6,2), unit text, grade text CHECK (grade IN ('A','B','C','D')),
  in_stock boolean DEFAULT true
);

CREATE TABLE unmet_demand_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL, product text NOT NULL,
  source text CHECK (source IN ('ai_gap','user_tap')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE store_demand_counts (
  store_id text, product text, count_7d int DEFAULT 0,
  count_30d int DEFAULT 0, alert text CHECK (alert IN ('red','yellow','green')),
  updated_at timestamptz DEFAULT now(), PRIMARY KEY (store_id, product)
);

CREATE TABLE tract_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tract_geoid text NOT NULL, ward int,
  nearest_store_miles numeric(5,3), nearest_store_id text,
  session_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON tract_sessions (tract_geoid);
CREATE INDEX ON tract_sessions (session_date);
```

### Run

```bash
npm run dev
# Open http://localhost:3000
```

### Deploy

```bash
npm install -g vercel
vercel --prod
# Add environment variables in Vercel dashboard
```

---

## External APIs (All Free)

| API | Used for | Key required |
|---|---|---|
| Groq — Llama 3.3 70B | Meal planning, multilingual chat | Yes (free) |
| Groq — Whisper large-v3 | Voice transcription, language detection | Yes (same key) |
| Web Speech API | TTS readback (browser-native) | No |
| Nominatim / OSM | Address → coordinates | No |
| US Census Bureau Geocoder | Coordinates → census tract | No |
| Google Maps URL scheme | Real transit + walking navigation | No |
| OpenStreetMap tiles | Map background | No |
| USDA FoodData Central | Nutrition values (embedded) | No |
| Supabase | Database + real-time | Yes (free) |

**Total monthly cost at prototype scale: $0**

---

## Synthetic Data Disclosure

We are transparent about every place synthetic data appears:

| Data | Status | Replacement path |
|---|---|---|
| Store inventory | Synthetic (deterministic seed) | Store owners toggle real stock via dashboard |
| Census tract gaps | Synthetic baseline (USDA + Census ACS) | Auto-replaced by real session logs as users grow |
| Store locations | **Real** — DC Open Data / DCCK | Already real |
| USDA nutrition values | **Real** — FoodData Central | Already real |
| Demand events | **Real** — from first user tap | Already real |

All synthetic data is labeled in the UI. The gap map always shows:  
*"Synthetic data based on Census ACS + USDA Atlas — for planning purposes only"* until replaced by real session data.

---

## Open Source & Collaboration

NutriNav is MIT licensed and built entirely on open-source and free-tier tools. We invite:

- **DCCK** to provide an API key to the HC Shopper App inventory → replaces synthetic data overnight
- **DC DHCD / OCA** to contribute ward boundary data for improved gap mapping
- **Community developers** to add languages, dietary profiles, or new city datasets
- **Researchers** to use the anonymized `tract_sessions` table for food access studies

Contributing: open an issue or pull request. No contributor license agreement required.

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

*NutriNav is an independent open-source tool. Not affiliated with DC Central Kitchen, USDA, or DC SNAP.*
