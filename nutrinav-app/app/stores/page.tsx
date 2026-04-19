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

  useEffect(() => {
    fetch(`/api/stores?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(data => { setStores(data); setLoading(false) })
  }, [lat, lng])

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store)
    sessionStorage.setItem('nutrinav_store', JSON.stringify(store))
    router.push(`/chat?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}&storeAddress=${encodeURIComponent(store.address)}`)
  }

  const nearest = stores[0]
  const isDesert = nearest && (nearest.distance ?? 0) > 1

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.push('/')} className="text-[#1A7A6E] text-xl">←</button>
          <div>
            <h1 className="text-xl font-bold text-[#1A7A6E]">Nearby Stores</h1>
            <p className="text-xs text-gray-500">Tap a store to plan your meals</p>
          </div>
          <button
            onClick={() => setShowMap(v => !v)}
            className="ml-auto px-3 py-1.5 bg-white border border-[#1A7A6E] text-[#1A7A6E] rounded-lg text-sm font-medium"
          >
            {showMap ? 'List' : '🗺 Map'}
          </button>
        </div>

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
