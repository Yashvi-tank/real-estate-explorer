import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatPrice, formatNumber } from '../map/colorScale'

export default function DetailPanel({ communeCode, onAddToCompare }) {
  const [commune, setCommune] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!communeCode) { setCommune(null); return }
    setLoading(true)
    api.getCommune(communeCode).then(setCommune).finally(() => setLoading(false))
  }, [communeCode])

  if (!communeCode) return (
    <div className="p-4 text-sm text-gray-500">
      Click a commune on the map to see market details.
    </div>
  )
  if (loading) return <div className="p-4 text-sm text-gray-400">Loading...</div>
  if (!commune) return <div className="p-4 text-sm text-red-400">No data found.</div>

  const stats = [
    ['Avg price/m²', `${formatPrice(commune.avg_price_per_sqm)} / m²`],
    ['Median/m²', `${formatPrice(commune.median_price_per_sqm)} / m²`],
    ['Avg sale price', formatPrice(commune.avg_price)],
    ['Median sale', formatPrice(commune.median_price)],
    ['Avg surface', commune.avg_surface ? `${Math.round(commune.avg_surface)} m²` : 'N/A'],
    ['Transactions', formatNumber(commune.transaction_count)],
  ]

  return (
    <div className="p-3 space-y-3">
      {/* Commune header card */}
      <div className="rounded-xl p-3 border border-blue-500/20"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)' }}>
        <p className="text-xs text-blue-300 uppercase tracking-widest mb-0.5">Selected commune</p>
        <h2 className="text-base font-bold text-white leading-tight">{commune.name}</h2>
        <p className="text-xs text-blue-400 mt-0.5">INSEE: {commune.insee_code}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(([label, value]) => (
          <div key={label}
            className="bg-gray-800/80 border border-white/5 rounded-lg p-2.5 hover:border-white/10 transition-colors duration-150">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-100 leading-tight">{value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAddToCompare(commune.insee_code)}
        className="w-full bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white text-xs font-semibold py-2.5 rounded-lg tracking-wide transition-colors duration-150"
      >
        + Add to Compare
      </button>
    </div>
  )
}