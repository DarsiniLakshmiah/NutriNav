export interface Store {
  id: string
  name: string
  address: string
  zipcode?: string
  lat: number
  lng: number
  ward: number
  anc?: string
  snap_match?: boolean
  wic?: boolean
  distance?: number
  tier?: 'green' | 'yellow' | 'red'
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export function getTier(distanceMiles: number): 'green' | 'yellow' | 'red' {
  if (distanceMiles <= 0.25) return 'green'
  if (distanceMiles <= 1.0) return 'yellow'
  return 'red'
}

export function getNearbyStores(userLat: number, userLng: number, stores: Store[]): Store[] {
  return stores
    .map(store => ({
      ...store,
      distance: haversineDistance(userLat, userLng, store.lat, store.lng),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .map(store => ({
      ...store,
      tier: getTier(store.distance ?? 999),
    }))
}
