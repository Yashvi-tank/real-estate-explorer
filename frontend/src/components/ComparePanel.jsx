import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatPrice, formatNumber } from '../map/colorScale'

export default function ComparePanel({ leftCode, rightCode, onClear }) {
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!leftCode || !rightCode) {
      setComparison(null)
      return
    }

    setLoading(true)

    api.compare(leftCode, rightCode)
      .then(setComparison)
      .finally(() => setLoading(false))
  }, [leftCode, rightCode])

  if (!leftCode && !rightCode) {
    return (
      <div className="p-4 text-sm text-gray-400">
        Select two communes to compare them. You can click a commune and use “Add to compare”.
      </div>
    )
  }

  if (leftCode && !rightCode) {
    return (
      <div className="p-4 text-sm text-gray-300">
        First commune selected: <span className="text-white font-semibold">{leftCode}</span>
        <br />
        Select one more commune.
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-300">Loading comparison...</div>
  }

  if (!comparison) {
    return null
  }

  const left = comparison.left
  const right = comparison.right

  const Row = ({ label, leftValue, rightValue }) => (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-700">
      <div className="text-sm text-white text-right">{leftValue}</div>
      <div className="text-xs text-gray-400 text-center">{label}</div>
      <div className="text-sm text-white">{rightValue}</div>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Compare</h2>
        <button onClick={onClear} className="text-xs text-gray-400 hover:text-white">
          Clear
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <h3 className="text-sm font-bold text-white">{left.name}</h3>
        <div />
        <h3 className="text-sm font-bold text-white">{right.name}</h3>
      </div>

      <Row
        label="Avg €/m²"
        leftValue={`${formatPrice(left.avg_price_per_sqm)}/m²`}
        rightValue={`${formatPrice(right.avg_price_per_sqm)}/m²`}
      />

      <Row
        label="Median €/m²"
        leftValue={`${formatPrice(left.median_price_per_sqm)}/m²`}
        rightValue={`${formatPrice(right.median_price_per_sqm)}/m²`}
      />

      <Row
        label="Avg price"
        leftValue={formatPrice(left.avg_price)}
        rightValue={formatPrice(right.avg_price)}
      />

      <Row
        label="Surface"
        leftValue={`${Math.round(left.avg_surface)} m²`}
        rightValue={`${Math.round(right.avg_surface)} m²`}
      />

      <Row
        label="Transactions"
        leftValue={formatNumber(left.transaction_count)}
        rightValue={formatNumber(right.transaction_count)}
      />

      <div className="bg-blue-900/60 border border-blue-700 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-300">More affordable commune</p>
        <p className="text-white font-bold">
          {comparison.more_affordable === left.insee_code ? left.name : right.name}
        </p>
        <p className="text-xs text-gray-300">
          {comparison.price_difference_pct}% price difference per m²
        </p>
      </div>
    </div>
  )
}