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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleCommuneClick = (code) => {
    setSelectedCode(code)
    setSidebarOpen(true)
    setMode('Explore')

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
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col md:flex-row overflow-hidden">

      {/* ── Mobile top bar (phone only) ── */}
      <div className="flex md:hidden items-center justify-between px-4 py-2 bg-gray-900 border-b border-white/[0.07] shrink-0">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest leading-none mb-0.5">Val-de-Marne</p>
          <h1 className="text-sm font-bold text-gray-100">Real Estate Explorer</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-xs font-semibold bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {sidebarOpen ? '← Map' : 'Data →'}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <aside className={`
        ${sidebarOpen ? 'flex' : 'hidden'} md:flex
        w-full md:w-80 md:h-full shrink-0
        bg-gray-900 border-b md:border-b-0 md:border-r border-white/[0.07]
        flex-col overflow-hidden
      `}>
        {/* Header — desktop only (mobile has the top bar) */}
        <div className="hidden md:block px-4 pt-4 pb-3 border-b border-white/[0.07]">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Val-de-Marne</p>
          <h1 className="text-base font-bold text-gray-100">Real Estate Explorer</h1>
        </div>

        <div className="p-3 border-b border-white/[0.07]">
          <SearchBar
            onSelectCommune={(code) => {
              setSelectedCode(code)
              setMode('Explore')
              setSidebarOpen(true)
            }}
          />
        </div>

        <div className="grid grid-cols-3 border-b border-white/[0.07]">
          {MODES.map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`py-3 text-xs font-semibold transition-colors ${
                mode === item
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
                setSidebarOpen(true)
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

        <div className="p-4 border-t border-white/[0.07] shrink-0">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Average price per m²</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400">Cheap</span>
            <div
              className="h-1.5 flex-1 rounded-full"
              style={{
                background: 'linear-gradient(to right, rgb(40, 200, 80), rgb(220, 160, 80), rgb(255, 50, 80))',
              }}
            />
            <span className="text-xs text-red-400">Expensive</span>
          </div>
        </div>
      </aside>

      {/* ── Map — always visible on desktop, visible on mobile when sidebar is closed ── */}
      <main className={`
        ${sidebarOpen ? 'hidden' : 'flex'} md:flex
        flex-1 min-h-0 min-w-0
      `}>
        <ChoroplethMap
          selectedCode={selectedCode}
          onCommuneClick={handleCommuneClick}
        />
      </main>
    </div>
  )
}