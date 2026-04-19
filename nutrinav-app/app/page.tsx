'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [manualZip, setManualZip] = useState('')
  const [addressInput, setAddressInput] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

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
        setError('Location denied. Enter your address or zip code below.')
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
      '20003': [38.882, -76.994],
      '20011': [38.948, -77.021],
      '20017': [38.938, -76.990],
    }
    const coords = zipCoords[manualZip.trim()]
    if (coords) {
      router.push(`/stores?lat=${coords[0]}&lng=${coords[1]}`)
    } else {
      router.push(`/stores?lat=38.8921&lng=-76.9567`)
    }
  }

  // Nominatim (OpenStreetMap) geocoding — free, no API key
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
        const { lat, lon } = data[0]
        router.push(`/stores?lat=${lat}&lng=${lon}`)
      } else {
        setGeocodeError('Address not found. Try a DC zip code or street name.')
      }
    } catch {
      setGeocodeError('Could not look up address. Try a zip code instead.')
    } finally {
      setGeocoding(false)
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

          {/* GPS button */}
          <button
            onClick={requestLocation}
            disabled={locating}
            className="w-full py-4 bg-[#1A7A6E] text-white font-bold rounded-xl text-lg mb-4 disabled:opacity-60"
          >
            {locating ? 'Finding your location…' : '📍 Use My Location'}
          </button>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          {/* Divider */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or search manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Address search — always visible */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 font-medium block mb-1.5 text-left">
              Enter any DC address or neighborhood
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 2400 Martin Luther King Jr Ave SE"
                value={addressInput}
                onChange={e => setAddressInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
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
            {geocodeError && <p className="text-xs text-red-500 mt-1">{geocodeError}</p>}
          </div>

          {/* Zip code fallback */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5 text-left">
              Or enter a DC zip code
            </label>
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
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <a href="/hc-app" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">🥦</div>
            <p className="text-xs font-semibold text-[#2C2C2C]">HC Products</p>
            <p className="text-xs text-gray-500">Full Catalog</p>
          </a>
          <a href="/dashboard" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs font-semibold text-[#2C2C2C]">Store Owner</p>
            <p className="text-xs text-gray-500">Dashboard</p>
          </a>
          <a href="/gap-map" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">🗺️</div>
            <p className="text-xs font-semibold text-[#2C2C2C]">DCCK Map</p>
            <p className="text-xs text-gray-500">Gap Analysis</p>
          </a>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p>🔒 Your location is never stored</p>
          <p>Supports English, Spanish, Amharic, French, Vietnamese + 95 more</p>
          <p className="italic">Not affiliated with DCCK, USDA, or DC SNAP</p>
        </div>
      </div>
    </main>
  )
}
