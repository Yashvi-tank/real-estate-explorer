import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { api } from '../services/api'
import { priceToColor, formatPrice, formatNumber } from './colorScale'

function MapResizer() {
  const map = useMap()

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])

  return null
}

export default function ChoroplethMap({ selectedCode, onCommuneClick }) {
  const [geojson, setGeojson] = useState(null)
  const [error, setError] = useState(null)

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
      fillColor: priceToColor(properties.avg_price_per_sqm),
      weight: isSelected ? 4 : 1,
      opacity: 1,
      color: isSelected ? '#2563eb' : '#374151',
      fillOpacity: isSelected ? 0.9 : 0.72,
    }
  }

  const onEachFeature = (feature, layer) => {
    const p = feature.properties

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
          fillOpacity: 0.9,
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