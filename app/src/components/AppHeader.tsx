import { memo } from 'react'

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2 13.4 13.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

type AppHeaderProps = {
  searchOpen: boolean
  onToggleSearch: () => void
}

export const AppHeader = memo(function AppHeader({ searchOpen, onToggleSearch }: AppHeaderProps) {
  return (
    <div id="hdr">
      <div className="hdr-center">
        <div className="hdr-title-row">
          <div className="hdr-title">
            <svg className="hdr-title-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1.5 9.5 6.5 14.5 8 9.5 9.5 8 14.5 6.5 9.5 1.5 8 6.5 6.5 8 1.5Z" fill="currentColor" />
            </svg>
            <span>Music Starfield</span>
            <svg className="hdr-title-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1.5 9.5 6.5 14.5 8 9.5 9.5 8 14.5 6.5 9.5 1.5 8 6.5 6.5 8 1.5Z" fill="currentColor" />
            </svg>
          </div>
          <button
            className={`hdr-search-btn${searchOpen ? ' open' : ''}`}
            type="button"
            aria-label="Open search"
            onClick={onToggleSearch}
          >
            <SearchIcon />
          </button>
        </div>
        <div className="hdr-sub">A stellar cartography of music genres &amp; radio transmissions</div>
      </div>
    </div>
  )
})
