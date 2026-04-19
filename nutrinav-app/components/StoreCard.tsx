'use client'

import { Store } from '@/lib/haversine'

const tierColors = {
  green:  { bg: 'bg-green-50',  border: 'border-green-500',  dot: 'bg-green-500',  label: 'Walkable' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-400', dot: 'bg-yellow-500', label: 'Moderate' },
  red:    { bg: 'bg-red-50',    border: 'border-red-400',    dot: 'bg-red-500',    label: 'Far' },
}

interface StoreCardProps {
  store: Store
  selected?: boolean
  onClick: (store: Store) => void
}

function openDirections(store: Store, mode: 'transit' | 'walking') {
  const dest = encodeURIComponent(`${store.name}, ${store.address}`)
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${mode}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function StoreCard({ store, selected, onClick }: StoreCardProps) {
  const tier = store.tier ?? 'red'
  const colors = tierColors[tier]
  const dist = store.distance?.toFixed(2) ?? '?'
  const isFar = tier === 'red'

  return (
    <div className={`rounded-xl border-2 transition-all ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-[#1A7A6E] ring-offset-1' : 'hover:shadow-md'}`}>
      {/* Main tap area → go to chat */}
      <button
        onClick={() => onClick(store)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start gap-3">
          <span className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${colors.dot}`} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#2C2C2C] leading-snug">{store.name}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{store.address}</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {store.snap_match && (
                <span className="text-xs bg-[#1A7A6E] text-white px-2 py-0.5 rounded-full font-medium">
                  SNAP Match
                </span>
              )}
              {store.wic && (
                <span className="text-xs bg-[#C07A00] text-white px-2 py-0.5 rounded-full font-medium">
                  WIC
                </span>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Ward {store.ward}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-sm font-bold text-[#2C2C2C]">{dist} mi</p>
            <p className={`text-xs font-medium mt-0.5 ${
              tier === 'green' ? 'text-green-700' : tier === 'yellow' ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {colors.label}
            </p>
          </div>
        </div>
      </button>

      {/* Directions row */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={e => { e.stopPropagation(); openDirections(store, 'transit') }}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-white border border-blue-300 text-blue-700 rounded-lg py-1.5 hover:bg-blue-50 transition-colors"
        >
          🚌 Transit Directions
        </button>
        <button
          onClick={e => { e.stopPropagation(); openDirections(store, 'walking') }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-white border rounded-lg py-1.5 transition-colors ${
            isFar
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-green-300 text-green-700 hover:bg-green-50'
          }`}
          title={isFar ? 'Over 1 mile — transit recommended' : 'Walking directions'}
        >
          🚶 Walk{isFar ? ' (far)' : ''}
        </button>
      </div>
    </div>
  )
}
