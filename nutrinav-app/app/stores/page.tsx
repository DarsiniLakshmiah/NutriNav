'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import StoreCard from '@/components/StoreCard'
import { Store } from '@/lib/haversine'

const StoreMap = dynamic(() => import('@/components/StoreMap'), { ssr: false })

function StoresContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lat = parseFloat(searchParams.get('lat') ?? '38.8921')
  const lng = parseFloat(searchParams.get('lng') ?? '-76.9567')

  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

  useEffect(() => {
    fetch(`/api/stores?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then((data: Store[]) => {
        setStores(data)
        setLoading(false)
        // Fire-and-forget anonymous session log — never awaited, never blocks UI
        if (data.length > 0) {
          const nearest = data[0]
          fetch('/api/log-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat,
              lng,
              nearestStoreMiles: nearest.distance ?? null,
              nearestStoreId:    nearest.id,
            }),
          }).catch(() => {/* silent — logging must never break the app */})
        }
      })
  }, [lat, lng])

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store)
    sessionStorage.setItem('nutrinav_store', JSON.stringify(store))
    router.push(`/chat?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}&storeAddress=${encodeURIComponent(store.address)}`)
  }

  // Nominatim geocoding to change location
  const handleAddressSearch = async () => {
    const q = addressInput.trim()
    if (!q) return
    setGeocoding(true)
    setGeocodeError('')
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Washington DC')}&format=json&limit=1&countrycodes=us`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'NutriNav/1.0 (hackathon)' }
      })
      const data = await res.json()
      if (data.length > 0) {
        const { lat: newLat, lon: newLng } = data[0]
        setShowLocationSearch(false)
        setAddressInput('')
        router.push(`/stores?lat=${newLat}&lng=${newLng}`)
      } else {
        setGeocodeError('Address not found. Try a different DC address.')
      }
    } catch {
      setGeocodeError('Could not look up address. Please try again.')
    } finally {
      setGeocoding(false)
    }
  }

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setShowLocationSearch(false)
        router.push(`/stores?lat=${latitude}&lng=${longitude}`)
      },
      () => setGeocodeError('Location denied. Enter an address instead.')
    )
  }

  const nearest = stores[0]
  const isDesert = nearest && (nearest.distance ?? 0) > 1

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.push('/')} className="text-[#1A7A6E] text-xl">←</button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A7A6E]">Nearby Stores</h1>
            <p className="text-xs text-gray-500">Tap a store to plan your meals</p>
          </div>
          <button
            onClick={() => setShowLocationSearch(v => !v)}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-lg text-xs font-medium"
            title="Change location"
          >
            📍 Change
          </button>
          <button
            onClick={() => setShowMap(v => !v)}
            className="px-3 py-1.5 bg-white border border-[#1A7A6E] text-[#1A7A6E] rounded-lg text-sm font-medium"
          >
            {showMap ? 'List' : '🗺 Map'}
          </button>
        </div>

        {/* Change location panel */}
        {showLocationSearch && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
            <p className="text-sm font-semibold text-[#2C2C2C] mb-3">Search from a different location</p>
            <p className="text-xs text-gray-400 mb-3">
              Not at home? Shopping near work or school? Enter any DC address.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={addressInput}
                onChange={e => setAddressInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
                placeholder="e.g. 2400 MLK Jr Ave SE, Ward 8"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A7A6E]"
              />
              <button
                onClick={handleAddressSearch}
                disabled={geocoding || !addressInput.trim()}
                className="px-4 py-2 bg-[#1A7A6E] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {geocoding ? '…' : 'Go'}
              </button>
            </div>
            {geocodeError && <p className="text-xs text-red-500 mb-2">{geocodeError}</p>}
            <button
              onClick={useMyLocation}
              className="w-full text-sm text-[#1A7A6E] font-medium py-2 border border-[#1A7A6E]/30 rounded-lg"
            >
              📍 Use my current GPS location
            </button>
          </div>
        )}

        {isDesert && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-3 mb-4 text-sm text-red-700">
            ⚠️ The nearest store is {nearest.distance?.toFixed(1)} miles away. This area may be a food access gap.
          </div>
        )}

        <div className="mb-4 flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> ≤ 0.25 mi walkable</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> ≤ 1 mi moderate</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &gt; 1 mi far</span>
        </div>

        {showMap && (
          <div className="h-64 rounded-2xl overflow-hidden mb-4 shadow-sm">
            <StoreMap stores={stores} userLat={lat} userLng={lng} selectedStore={selectedStore} onSelectStore={handleSelectStore} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Finding nearby stores…</div>
        ) : (
          <div className="space-y-3">
            {stores.slice(0, 20).map(store => (
              <StoreCard
                key={store.id}
                store={store}
                selected={selectedStore?.id === store.id}
                onClick={handleSelectStore}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function StoresPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <StoresContent />
    </Suspense>
  )
}
