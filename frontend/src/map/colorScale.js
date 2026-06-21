const MIN_PRICE = 3000
const MAX_PRICE = 9000

export function priceToColor(price) {
  if (!price) return '#9ca3af'

  const ratio = Math.min(
    Math.max((Number(price) - MIN_PRICE) / (MAX_PRICE - MIN_PRICE), 0),
    1
  )

  const r = Math.round(40 + ratio * 215)
  const g = Math.round(200 - ratio * 150)
  const b = 80

  return `rgb(${r}, ${g}, ${b})`
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