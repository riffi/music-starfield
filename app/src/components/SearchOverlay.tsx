export type SearchResult = {
  id: string
  type: 'node' | 'station'
  group: 'Styles' | 'Stations'
  title: string
  subtitle: string
  pathIds: string[]
  score?: number
}

type SearchOverlayProps = {
  open: boolean
  query: string
  active: boolean
  results: SearchResult[]
  onQueryChange: (value: string) => void
  onHoverResult: (result: SearchResult | null) => void
  onSelectResult: (result: SearchResult) => void
}

export function SearchOverlay({
  open,
  query,
  active,
  results,
  onQueryChange,
  onHoverResult,
  onSelectResult,
}: SearchOverlayProps) {
  const grouped = {
    Styles: results.filter((result) => result.group === 'Styles'),
    Stations: results.filter((result) => result.group === 'Stations'),
  }

  if (!open) return null

  return (
    <div className={`search-shell${active ? ' active' : ''}`}>
      <div className="search-panel">
        <div className="search-panel-scan" aria-hidden="true" />
        <label className="search-input-wrap">
          <span className="search-kicker">Nav Scan</span>
          <input
            className="search-input"
            type="text"
            value={query}
            placeholder="Locate style, station, or mood"
            aria-label="Search styles and stations"
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={() => onHoverResult(null)}
          />
        </label>
        {active ? (
          <div className="search-results" onMouseLeave={() => onHoverResult(null)}>
            {results.length ? (
              <>
                {(['Styles', 'Stations'] as const).map((group) =>
                  grouped[group].length ? (
                    <div key={group} className="search-group">
                      <div className="search-group-title">{group}</div>
                      {grouped[group].map((result) => (
                        <button
                          key={result.id}
                          className={`search-result search-result-${result.type}`}
                          type="button"
                          onMouseEnter={() => onHoverResult(result)}
                          onFocus={() => onHoverResult(result)}
                          onClick={() => onSelectResult(result)}
                        >
                          <span className="search-result-title">{result.title}</span>
                          <span className="search-result-subtitle">{result.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  ) : null,
                )}
              </>
            ) : (
              <div className="search-empty">No signal lock. Try a broader term.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
