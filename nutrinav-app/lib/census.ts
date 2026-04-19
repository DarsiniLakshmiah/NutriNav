// Free Census Bureau Geocoder — converts lat/lng to census tract GEOID.
// No API key required. Source: https://geocoding.geo.census.gov
// Typical response: ~300–800ms. Always call fire-and-forget; never block UX on this.

export interface TractInfo {
  geoid: string        // e.g. "11001008200" (state+county+tract)
  tract: string        // e.g. "008200"
  county: string       // e.g. "001"
  state: string        // e.g. "11" (DC = FIPS 11)
  ward?: number        // DC ward — derived from geoid prefix lookup
}

// DC ward boundaries by approximate tract prefix (rough but good enough for logging)
function wardFromTract(geoid: string): number | undefined {
  const tractNum = parseInt(geoid.slice(5), 10)
  if (tractNum >= 1 && tractNum <= 2299)   return 1
  if (tractNum >= 2300 && tractNum <= 3799) return 2
  if (tractNum >= 3800 && tractNum <= 4999) return 3
  if (tractNum >= 5000 && tractNum <= 6199) return 4
  if (tractNum >= 6200 && tractNum <= 7299) return 5
  if (tractNum >= 7300 && tractNum <= 7699) return 6
  if (tractNum >= 7700 && tractNum <= 8499) return 7
  if (tractNum >= 8500 && tractNum <= 11000) return 8
  return undefined
}

export async function getTractFromCoords(lat: number, lng: number): Promise<TractInfo | null> {
  try {
    const url =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Districts&format=json`

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null

    const data = await res.json()
    const tracts = data?.result?.geographies?.['Census Tracts']
    if (!tracts || tracts.length === 0) return null

    const t = tracts[0]
    const geoid: string = t.GEOID ?? `${t.STATE}${t.COUNTY}${t.TRACT}`
    return {
      geoid,
      tract: t.TRACT,
      county: t.COUNTY,
      state: t.STATE,
      ward: wardFromTract(geoid),
    }
  } catch {
    return null
  }
}
