'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DemandAlert from '@/components/DemandAlert'
import storesData from '@/data/healthy-corners-stores.json'

interface DemandCount {
  store_id: string
  product: string
  count_7d: number
  count_30d: number
  alert: 'red' | 'yellow' | 'green'
}

const DEMO_DATA: DemandCount[] = [
  { store_id: 'HC342', product: 'Plantains',             count_7d: 14, count_30d: 28, alert: 'red'    },
  { store_id: 'HC342', product: 'Scotch Bonnet Peppers', count_7d: 11, count_30d: 24, alert: 'red'    },
  { store_id: 'HC342', product: 'Masa Harina',           count_7d: 7,  count_30d: 18, alert: 'yellow' },
  { store_id: 'HC342', product: 'Yuca',                  count_7d: 5,  count_30d: 12, alert: 'yellow' },
  { store_id: 'HC002', product: 'Tomatillos',           count_7d: 3,  count_30d: 7,  alert: 'green' },
]

function DashboardContent() {
  const searchParams = useSearchParams()
  const [storeId, setStoreId] = useState(searchParams.get('storeId') ?? 'HC002')
  const [counts, setCounts] = useState<DemandCount[]>(DEMO_DATA)
  const [loading, setLoading] = useState(false)

  const selectedStore = storesData.find(s => s.id === storeId)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/demand-counts?storeId=${storeId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCounts(data)
        else setCounts(DEMO_DATA.map(d => ({ ...d, store_id: storeId })))
      })
      .catch(() => setCounts(DEMO_DATA.map(d => ({ ...d, store_id: storeId }))))
      .finally(() => setLoading(false))
  }, [storeId])

  const red = counts.filter(c => c.alert === 'red')
  const yellow = counts.filter(c => c.alert === 'yellow')
  const green = counts.filter(c => c.alert === 'green')

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#1A7A6E]">Demand Dashboard</h1>
          <p className="text-sm text-gray-500">Items residents needed but couldn&apos;t find</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <label className="text-xs text-gray-500 block mb-1">Your Store</label>
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#2C2C2C]"
          >
            {storesData.filter(s => s.ward >= 7).map(s => (
              <option key={s.id} value={s.id}>{s.name} — Ward {s.ward}</option>
            ))}
          </select>
          {selectedStore && (
            <p className="text-xs text-gray-400 mt-1">{selectedStore.address}</p>
          )}
        </div>

        <a
          href={`/dashboard/inventory?storeId=${storeId}`}
          className="flex items-center justify-between bg-white rounded-xl p-3 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div>
            <p className="font-semibold text-sm text-[#2C2C2C]">📦 Manage Inventory</p>
            <p className="text-xs text-gray-500">Toggle items in/out of stock — residents see it live</p>
          </div>
          <span className="text-[#1A7A6E] text-lg">→</span>
        </a>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
          Based on items residents requested but couldn&apos;t find (last 30 days). Both AI-detected gaps and resident taps shown.
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading demand data…</div>
        ) : (
          <>
            {red.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold text-red-700 mb-2">🔴 High Demand — Stock Now</h2>
                <div className="space-y-2">{red.map(item => <DemandAlert key={item.product} item={item} />)}</div>
              </div>
            )}
            {yellow.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold text-yellow-700 mb-2">🟡 Growing Need — Consider Stocking</h2>
                <div className="space-y-2">{yellow.map(item => <DemandAlert key={item.product} item={item} />)}</div>
              </div>
            )}
            {green.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold text-green-700 mb-2">🟢 Low Demand</h2>
                <div className="space-y-2">{green.map(item => <DemandAlert key={item.product} item={item} />)}</div>
              </div>
            )}
            {counts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No unmet demand recorded yet for this store.
              </div>
            )}
          </>
        )}

        <div className="text-xs text-gray-400 mt-6 text-center">
          <p>Synthetic demo data — for planning purposes only</p>
          <p className="mt-1">AI-detected gaps + resident-reported missing items</p>
        </div>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  )
}
