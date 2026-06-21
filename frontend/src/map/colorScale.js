export function getPriceRange(geojson) {
  if (!geojson?.features?.length) {
    return { min: 3000, max: 9000 }
  }

  const prices = geojson.features
    .map((feature) => Number(feature.properties.avg_price_per_sqm))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (!prices.length) {
    return { min: 3000, max: 9000 }
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}

function interpolateColor(start, end, ratio) {
  const r = Math.round(start[0] + (end[0] - start[0]) * ratio)
  const g = Math.round(start[1] + (end[1] - start[1]) * ratio)
  const b = Math.round(start[2] + (end[2] - start[2]) * ratio)

  return `rgb(${r}, ${g}, ${b})`
}

export function priceToColor(price, minPrice, maxPrice) {
  if (!price) return '#9ca3af'

  const safeMin = Number(minPrice)
  const safeMax = Number(maxPrice)
  const value = Number(price)

  if (!Number.isFinite(value) || safeMax === safeMin) {
    return '#9ca3af'
  }

  const ratio = Math.min(
    Math.max((value - safeMin) / (safeMax - safeMin), 0),
    1
  )

  const green = [34, 197, 94]
  const yellow = [234, 179, 8]
  const red = [239, 68, 68]

  if (ratio < 0.5) {
    return interpolateColor(green, yellow, ratio * 2)
  }

  return interpolateColor(yellow, red, (ratio - 0.5) * 2)
}

export function formatPrice(value) {
  if (value === null || value === undefined) return 'N/A'

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function formatNumber(value) {
  if (value === null || value === undefined) return 'N/A'

  return new Intl.NumberFormat('fr-FR').format(Number(value))
}