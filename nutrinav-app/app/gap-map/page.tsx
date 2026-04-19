'use client'

import { useEffect, useRef, useState } from 'react'
import storesData from '@/data/healthy-corners-stores.json'
import tractData from '@/data/food-desert-tracts.json'
import { haversineDistance } from '@/lib/haversine'

interface TractSummary {
  tract: string
  ward: number
  population: number
  lat: number
  lng: number
  nearestStoreMiles: number
  isDesert: boolean
  priority: 'critical' | 'high' | 'moderate'
}

function computeGaps(): TractSummary[] {
  return tractData.map(tract => {
    const nearest = Math.min(
      ...storesData.map(s => haversineDistance(tract.lat, tract.lng, s.lat, s.lng))
    )
    const priority: 'critical' | 'high' | 'moderate' =
      nearest > 1.5 ? 'critical' : nearest > 1.0 ? 'high' : 'moderate'
    return {
      tract: tract.tract,
      ward: tract.ward,
      population: tract.population,
      lat: tract.lat,
      lng: tract.lng,
      nearestStoreMiles: nearest,
      isDesert: tract.isDesert,
      priority,
    }
  }).filter(t => t.nearestStoreMiles > 0.5).sort((a, b) => b.nearestStoreMiles - a.nearestStoreMiles)
}

export default function GapMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [gaps] = useState<TractSummary[]>(computeGaps)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapLoaded) return
    setMapLoaded(true)

    import('leaflet').then(L => {
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([38.886, -76.990], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      storesData.forEach(store => {
        L.circleMarker([store.lat, store.lng], { radius: 5, color: '#1E7A3A', fillColor: '#1E7A3A', fillOpacity: 0.7 })
          .addTo(map)
          .bindPopup(`<b>${store.name}</b>`)
      })

      gaps.forEach(gap => {
        const color = gap.priority === 'critical' ? '#C0392B' : gap.priority === 'high' ? '#C07A00' : '#1A7A6E'
        const radius = Math.min(30, gap.population / 150)
        L.circle([gap.lat, gap.lng], {
          radius: radius * 80,
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 1,
        })
          .addTo(map)
          .bindPopup(`
            <b>Ward ${gap.ward} — Census Tract ${gap.tract.slice(-6)}</b><br>
            Est. population: ${gap.population.toLocaleString()}<br>
            Nearest store: ${gap.nearestStoreMiles.toFixed(2)} miles<br>
            Priority: ${gap.priority.toUpperCase()}
          `)
      })
    })
  }, [gaps, mapLoaded])

  const critical = gaps.filter(g => g.priority === 'critical')
  const high = gaps.filter(g => g.priority === 'high')

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-6">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#1A7A6E] mb-1">Gap Analysis Map</h1>
        <p className="text-sm text-gray-500 mb-4">Underserved areas for DCCK store expansion planning</p>

        <div className="h-72 rounded-2xl overflow-hidden shadow-sm mb-4 bg-gray-200">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div className="flex gap-3 text-xs mb-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block opacity-60" /> Critical (&gt;1.5 mi)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block opacity-60" /> High (&gt;1 mi)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#1E7A3A] inline-block" /> HC Store</span>
        </div>

        {critical.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-red-700 mb-2">🔴 Critical Priority — No Store Within 1.5 Miles</h2>
            <div className="space-y-2">
              {critical.map(g => (
                <div key={g.tract} className="bg-red-50 border border-red-300 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-[#2C2C2C]">Ward {g.ward} — Tract {g.tract.slice(-6)}</p>
                      <p className="text-xs text-gray-500">~{g.population.toLocaleString()} residents</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-700 text-sm">{g.nearestStoreMiles.toFixed(1)} mi</p>
                      <p className="text-xs text-gray-400">to nearest HC</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {high.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-yellow-700 mb-2">🟡 High Priority</h2>
            <div className="space-y-2">
              {high.map(g => (
                <div key={g.tract} className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-[#2C2C2C]">Ward {g.ward} — Tract {g.tract.slice(-6)}</p>
                      <p className="text-xs text-gray-500">~{g.population.toLocaleString()} residents</p>
                    </div>
                    <p className="font-bold text-yellow-700 text-sm">{g.nearestStoreMiles.toFixed(1)} mi</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4 text-center">
          Synthetic data based on Census ACS + USDA Atlas — for planning purposes only
        </p>
      </div>
    </main>
  )
}
