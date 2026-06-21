import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatPrice, formatNumber } from '../map/colorScale'

export default function DetailPanel({ communeCode, onAddToCompare }) {
  const [commune, setCommune] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!communeCode) {
      setCommune(null)
      return
    }

    setLoading(true)

    api.getCommune(communeCode)
      .then(setCommune)
      .finally(() => setLoading(false))
  }, [communeCode])

  if (!communeCode) {
    return (
      <div className="p-4 text-sm text-gray-400">
        Click a commune on the map to see market details.
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-300">Loading commune details...</div>
  }

  if (!commune) {
    return <div className="p-4 text-sm text-red-300">No commune data found.</div>
  }

  const stats = [
    ['Average price/m²', `${formatPrice(commune.avg_price_per_sqm)} / m²`],
    ['Median price/m²', `${formatPrice(commune.median_price_per_sqm)} / m²`],
    ['Average sale price', formatPrice(commune.avg_price)],
    ['Median sale price', formatPrice(commune.median_price)],
    ['Average surface', commune.avg_surface ? `${Math.round(commune.avg_surface)} m²` : 'N/A'],
    ['Transactions', formatNumber(commune.transaction_count)],
  ]

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">{commune.name}</h2>
        <p className="text-xs text-gray-400">INSEE code: {commune.insee_code}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-gray-700/70 rounded-lg p-3">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAddToCompare(commune.insee_code)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg"
      >
        Add to compare
      </button>
    </div>
  )
}