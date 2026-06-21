import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

function normalizeSearch(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function fuzzyMatch(query, text) {
  if (!query) return true

  let queryIndex = 0

  for (let i = 0; i < text.length; i++) {
    if (text[i] === query[queryIndex]) {
      queryIndex++
    }

    if (queryIndex === query.length) {
      return true
    }
  }

  return false
}

function normalizeCommune(raw) {
  const properties = raw.properties || raw

  return {
    insee_code:
      properties.insee_code ||
      properties.commune_insee_code ||
      properties.code ||
      properties.id ||
      '',
    name:
      properties.name ||
      properties.commune_name ||
      properties.nom_commune ||
      properties.Commune ||
      '',
    avg_price_per_sqm:
      properties.avg_price_per_sqm ||
      properties.median_price_per_sqm ||
      null,
    transaction_count: properties.transaction_count || null,
    raw: properties,
  }
}

export default function SearchBar({ onSelectCommune }) {
  const [communes, setCommunes] = useState([])
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    async function loadCommunes() {
      try {
        setLoading(true)
        setLoadError(null)

        let items = []

        const list = await api.getCommunes()

        if (Array.isArray(list) && list.length > 0) {
          items = list.map(normalizeCommune)
        }

        if (!items.length) {
          const geojson = await api.getGeoJSON()

          items = geojson.features.map((feature) =>
            normalizeCommune(feature.properties)
          )
        }

        items = items
          .filter((item) => item.insee_code && item.name)
          .sort((a, b) => a.name.localeCompare(b.name))

        setCommunes(items)
      } catch (error) {
        console.error('Search failed to load communes:', error)
        setLoadError('Search unavailable')
      } finally {
        setLoading(false)
      }
    }

    loadCommunes()
  }, [])

  const results = useMemo(() => {
    const cleanQuery = normalizeSearch(query)

    if (!cleanQuery) return []

    return communes
      .map((commune) => {
        const cleanName = normalizeSearch(commune.name)
        const cleanCode = normalizeSearch(commune.insee_code)
        const cleanFullObject = normalizeSearch(JSON.stringify(commune.raw || commune))

        let score = 999

        if (cleanName.startsWith(cleanQuery)) {
          score = 1
        } else if (cleanName.includes(cleanQuery)) {
          score = 2
        } else if (cleanCode.includes(cleanQuery)) {
          score = 3
        } else if (cleanFullObject.includes(cleanQuery)) {
          score = 4
        } else if (fuzzyMatch(cleanQuery, cleanName)) {
          score = 5
        }

        return { ...commune, score }
      })
      .filter((commune) => commune.score < 999)
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
      .slice(0, 8)
  }, [query, communes])

  const handleSelect = (commune) => {
    setQuery(commune.name)
    setIsOpen(false)
    setActiveIndex(0)
    onSelectCommune(commune.insee_code)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (!results.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % results.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) =>
        current === 0 ? results.length - 1 : current - 1
      )
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      handleSelect(results[activeIndex])
    }
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 150)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search commune, e.g. Choisy, Créteil, Vincennes"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />

      {isOpen && query.trim() && (
        <div className="absolute z-[9999] mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-400">
              Loading communes...
            </div>
          )}

          {!loading && loadError && (
            <div className="px-3 py-2 text-sm text-red-300">
              {loadError}
            </div>
          )}

          {!loading && !loadError && results.length > 0 && (
            results.map((commune, index) => (
              <button
                key={commune.insee_code}
                type="button"
                onMouseDown={() => handleSelect(commune)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  index === activeIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-200 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium">{commune.name}</div>
                <div className="text-xs opacity-75">
                  INSEE {commune.insee_code}
                  {commune.avg_price_per_sqm
                    ? ` · ${Math.round(commune.avg_price_per_sqm)} €/m²`
                    : ''}
                </div>
              </button>
            ))
          )}

          {!loading && !loadError && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">
              No matching commune found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}