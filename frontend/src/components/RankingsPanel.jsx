import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatPrice } from '../map/colorScale'

export default function RankingsPanel({ onSelectCommune }) {
  const [mostExpensive, setMostExpensive] = useState([])
  const [mostAffordable, setMostAffordable] = useState([])

  useEffect(() => {
    api.getRankings('avg_price_per_sqm', 'desc', 5).then(setMostExpensive)
    api.getRankings('avg_price_per_sqm', 'asc', 5).then(setMostAffordable)
  }, [])

  const RankingList = ({ title, items }) => (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-gray-400 font-bold">
        {title}
      </h3>

      {items.map((commune, index) => (
        <button
          key={commune.insee_code}
          onClick={() => onSelectCommune(commune.insee_code)}
          className="w-full flex items-center justify-between bg-gray-700/70 hover:bg-gray-700 rounded-lg px-3 py-2 text-left"
        >
          <div>
            <p className="text-sm text-white">
              {index + 1}. {commune.name}
            </p>
            <p className="text-xs text-gray-400">
              {commune.transaction_count} transactions
            </p>
          </div>

          <p className="text-sm font-semibold text-white">
            {formatPrice(commune.avg_price_per_sqm)}/m²
          </p>
        </button>
      ))}
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-white">Market rankings</h2>

      <RankingList title="Most expensive" items={mostExpensive} />
      <RankingList title="Most affordable" items={mostAffordable} />
    </div>
  )
}