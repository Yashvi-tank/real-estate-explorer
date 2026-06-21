import { useState } from 'react'
import ChoroplethMap from './map/ChoroplethMap'
import DetailPanel from './components/DetailPanel'
import RankingsPanel from './components/RankingsPanel'
import ComparePanel from './components/ComparePanel'
import SearchBar from './components/SearchBar'

const MODES = ['Explore', 'Rankings', 'Compare']

export default function App() {
  const [mode, setMode] = useState('Explore')
  const [selectedCode, setSelectedCode] = useState(null)
  const [compareLeft, setCompareLeft] = useState(null)
  const [compareRight, setCompareRight] = useState(null)

  const handleCommuneClick = (code) => {
    setSelectedCode(code)

    if (mode === 'Compare') {
      if (!compareLeft) {
        setCompareLeft(code)
      } else if (!compareRight && code !== compareLeft) {
        setCompareRight(code)
      }
    }
  }

  const handleAddToCompare = (code) => {
    setMode('Compare')

    if (!compareLeft) {
      setCompareLeft(code)
    } else if (!compareRight && code !== compareLeft) {
      setCompareRight(code)
    }
  }

  const handleClearCompare = () => {
    setCompareLeft(null)
    setCompareRight(null)
  }

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex overflow-hidden">
      <aside className="w-80 bg-gray-900 border-r border-white/[0.07] flex flex-col">
  <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
    <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Val-de-Marne</p>
    <h1 className="text-base font-bold text-gray-100">Real Estate Explorer</h1>
  </div>
        <div className="p-3 border-b border-gray-700">
  <SearchBar
    onSelectCommune={(code) => {
      setSelectedCode(code)
      setMode('Explore')
    }}
  />
</div>

        <div className="grid grid-cols-3 border-b border-gray-700">
          {MODES.map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`py-3 text-xs font-semibold ${
                mode === item
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === 'Explore' && (
            <DetailPanel
              communeCode={selectedCode}
              onAddToCompare={handleAddToCompare}
            />
          )}

          {mode === 'Rankings' && (
            <RankingsPanel
              onSelectCommune={(code) => {
                setSelectedCode(code)
                setMode('Explore')
              }}
            />
          )}

          {mode === 'Compare' && (
            <ComparePanel
              leftCode={compareLeft}
              rightCode={compareRight}
              onClear={handleClearCompare}
            />
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Average price per m²</p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-green-300">Cheap</span>
            <div
              className="h-2 flex-1 rounded-full"
              style={{
                background:
                  'linear-gradient(to right, rgb(40, 200, 80), rgb(220, 160, 80), rgb(255, 50, 80))',
              }}
            />
            <span className="text-xs text-red-300">Expensive</span>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <ChoroplethMap
          selectedCode={selectedCode}
          onCommuneClick={handleCommuneClick}
        />
      </main>
    </div>
  )
}