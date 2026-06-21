import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { api } from '../services/api'
import { priceToColor, getPriceRange, formatPrice, formatNumber } from './colorScale'

function MapResizer() {
  const map = useMap()

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])

  return null
}

function SelectedCommuneZoom({ selectedCode, layerRefs }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedCode) return

    const zoomToLayer = () => {
      const layer = layerRefs.current[selectedCode]

      if (!layer) return

      map.flyToBounds(layer.getBounds(), {
        padding: [40, 40],
        maxZoom: 13,
        duration: 0.8,
      })
    }

    // Small delay because GeoJSON layers may need a moment after render
    setTimeout(zoomToLayer, 100)
  }, [selectedCode, map, layerRefs])

  return null
}

export default function ChoroplethMap({ selectedCode, onCommuneClick }) {
  const [geojson, setGeojson] = useState(null)
  const [error, setError] = useState(null)
  const layerRefs = useRef({})

  const priceRange = getPriceRange(geojson)

  useEffect(() => {
    api.getGeoJSON()
      .then(setGeojson)
      .catch((err) => {
        console.error(err)
        setError('Failed to load map data')
      })
  }, [])

  const style = (feature) => {
    const properties = feature.properties
    const isSelected = selectedCode === properties.insee_code

    return {
      fillColor: priceToColor(
        properties.avg_price_per_sqm,
        priceRange.min,
        priceRange.max
      ),
      weight: isSelected ? 4 : 1.3,
      opacity: 1,
      color: isSelected ? '#2563eb' : '#1f2937',
      fillOpacity: isSelected ? 0.88 : 0.68,
    }
  }

  const onEachFeature = (feature, layer) => {
    const p = feature.properties

    layerRefs.current[p.insee_code] = layer

    layer.bindTooltip(
      `
        <strong>${p.name}</strong><br/>
        Avg price: ${formatPrice(p.avg_price_per_sqm)} / m²<br/>
        Transactions: ${formatNumber(p.transaction_count)}
      `,
      { sticky: true }
    )

    layer.on({
      mouseover: (event) => {
        event.target.setStyle({
          weight: 3,
          color: '#111827',
          fillOpacity: 0.85,
        })
      },
      mouseout: (event) => {
        event.target.setStyle(style(feature))
      },
      click: () => {
        onCommuneClick(p.insee_code)
      },
    })
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-red-300">
        {error}
      </div>
    )
  }

  if (!geojson) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-gray-300">
        Loading map...
      </div>
    )
  }

  return (
    <MapContainer
      center={[48.78, 2.45]}
      zoom={11}
      minZoom={10}
      maxZoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <MapResizer />
      <SelectedCommuneZoom selectedCode={selectedCode} layerRefs={layerRefs} />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON
        key={selectedCode || 'map'}
        data={geojson}
        style={style}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  )
}