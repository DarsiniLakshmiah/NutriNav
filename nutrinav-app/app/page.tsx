'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [manualZip, setManualZip] = useState('')

  const requestLocation = () => {
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        router.push(`/stores?lat=${latitude}&lng=${longitude}`)
      },
      () => {
        setLocating(false)
        setError('Location denied. Enter your zip code below.')
      }
    )
  }

  const handleManualZip = () => {
    const zipCoords: Record<string, [number, number]> = {
      '20019': [38.893, -76.941],
      '20020': [38.862, -76.987],
      '20032': [38.843, -77.002],
      '20001': [38.912, -77.020],
      '20002': [38.900, -76.995],
    }
    const coords = zipCoords[manualZip.trim()]
    if (coords) {
      router.push(`/stores?lat=${coords[0]}&lng=${coords[1]}`)
    } else {
      router.push(`/stores?lat=38.8921&lng=-76.9567`)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('nutrinav_location')
      if (saved) {
        const { lat, lng } = JSON.parse(saved)
        router.push(`/stores?lat=${lat}&lng=${lng}`)
      }
    }
  }, [router])

  return (
    <main className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-[#1A7A6E] flex items-center justify-center mx-auto mb-4 text-4xl">
            🥦
          </div>
          <h1 className="text-3xl font-bold text-[#1A7A6E] mb-2">NutriNav</h1>
          <p className="text-[#2C2C2C] text-base leading-relaxed">
            Healthy, affordable meals from your nearest Healthy Corners corner store.
            Powered by AI. Works in any language.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <p className="text-sm text-gray-500 mb-4">
            Share your location to find stores near you
          </p>
          <button
            onClick={requestLocation}
            disabled={locating}
            className="w-full py-4 bg-[#1A7A6E] text-white font-bold rounded-xl text-lg mb-3 disabled:opacity-60"
          >
            {locating ? 'Finding your location…' : '📍 Use My Location'}
          </button>

          {error && (
            <div className="mt-3">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Zip code (e.g. 20019)"
                  value={manualZip}
                  onChange={e => setManualZip(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualZip()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={5}
                />
                <button
                  onClick={handleManualZip}
                  className="px-4 py-2 bg-[#C07A00] text-white rounded-lg text-sm font-semibold"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <a href="/dashboard" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs font-semibold text-[#2C2C2C]">Store Owner</p>
            <p className="text-xs text-gray-500">Demand Dashboard</p>
          </a>
          <a href="/gap-map" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">🗺️</div>
            <p className="text-xs font-semibold text-[#2C2C2C]">DCCK Planning</p>
            <p className="text-xs text-gray-500">Gap Analysis Map</p>
          </a>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p>🔒 Your location is never stored</p>
          <p>Supports English, Spanish, Amharic, French, Vietnamese + 95 more</p>
        </div>
      </div>
    </main>
  )
}
