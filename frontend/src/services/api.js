const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`)
  }

  return response.json()
}

export const api = {
  getCommunes() {
    return request('/communes')
  },

  getGeoJSON() {
    return request('/communes/geojson')
  },

  getCommune(inseeCode) {
    return request(`/communes/${inseeCode}`)
  },

  getRankings(metric = 'avg_price_per_sqm', order = 'desc', limit = 5) {
    return request(`/rankings?metric=${metric}&order=${order}&limit=${limit}`)
  },

  compare(left, right) {
    return request(`/compare?left=${left}&right=${right}`)
  },
}