'use client'

import { useEffect, useRef } from 'react'
import { Store } from '@/lib/haversine'

interface StoreMapProps {
  stores: Store[]
  userLat?: number
  userLng?: number
  selectedStore?: Store | null
  onSelectStore?: (store: Store) => void
}

export default function StoreMap({ stores, userLat, userLng, selectedStore, onSelectStore }: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef</* eslint-disable @typescript-eslint/no-explicit-any */ any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (mapInstanceRef.current) return

    import('leaflet').then(L => {
      // Fix default marker icon path issue with Next.js
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const centerLat = userLat ?? 38.8921
      const centerLng = userLng ?? -76.9567

      const map = L.map(mapRef.current!).setView([centerLat, centerLng], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      if (userLat && userLng) {
        L.circleMarker([userLat, userLng], { radius: 8, color: '#1A7A6E', fillColor: '#1A7A6E', fillOpacity: 0.9 })
          .addTo(map)
          .bindPopup('You are here')
      }

      const tierColors: Record<string, string> = { green: '#1E7A3A', yellow: '#C07A00', red: '#C0392B' }

      stores.forEach(store => {
        const color = tierColors[store.tier ?? 'red']
        const dest = encodeURIComponent(`${store.name}, ${store.address}`)
        const transitUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=transit`
        const walkUrl    = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`
        const popupHtml = `
          <div style="min-width:160px">
            <b style="font-size:13px">${store.name}</b>
            <br><span style="font-size:11px;color:#666">${store.address}</span>
            <br><span style="font-size:11px;color:#666">Ward ${store.ward ?? '—'} · ${store.distance?.toFixed(2) ?? '?'} mi</span>
            <div style="margin-top:8px;display:flex;gap:6px">
              <a href="${transitUrl}" target="_blank" rel="noopener noreferrer"
                style="flex:1;text-align:center;font-size:11px;font-weight:600;padding:5px 8px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">
                🚌 Transit
              </a>
              <a href="${walkUrl}" target="_blank" rel="noopener noreferrer"
                style="flex:1;text-align:center;font-size:11px;font-weight:600;padding:5px 8px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none">
                🚶 Walk
              </a>
            </div>
          </div>`

        const marker = L.circleMarker([store.lat, store.lng], {
          radius: 7,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 220 })

        if (onSelectStore) {
          marker.on('click', () => onSelectStore(store))
        }
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStore) return
    import('leaflet').then(L => {
      mapInstanceRef.current.setView([selectedStore.lat, selectedStore.lng], 15)
    })
  }, [selectedStore])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full rounded-xl" />
    </>
  )
}
