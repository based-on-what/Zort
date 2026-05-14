import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import axios from 'axios'
import Callback from './Callback'
import Loader from './components/Loader'
import Header from './components/Header'
import Pagination from './components/Pagination'
import { formatDuration } from './utils/duration'
import { generateCodeVerifier, generateCodeChallenge } from './utils/pkce'
import './App.css'

const REDIRECT_URI = 'https://zort-rho.vercel.app/callback'

const SCOPES = [
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ')

const SPOTIFY_AUTH_BASE = `https://accounts.spotify.com/authorize?client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`

const ITEMS_PER_PAGE = 20

function App() {
  const [token, setToken] = useState(localStorage.getItem('spotifyToken') || '')
  const [playlists, setPlaylists] = useState([])
  const [sortBy, setSortBy] = useState('tracks')
  const [sortAscending, setSortAscending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [user, setUser] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [durations, setDurations] = useState({})
  const [durationsFetchStarted, setDurationsFetchStarted] = useState(false)
  const [durationsProgress, setDurationsProgress] = useState({ loaded: 0, total: 0 })
  const durationsStartedRef = useRef(false)

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(data.display_name)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }, [token])

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true)
      let allPlaylists = []
      let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50'

      while (nextUrl) {
        const { data } = await axios.get(nextUrl, {
          headers: { Authorization: `Bearer ${token}` }
        })
        allPlaylists = [...allPlaylists, ...data.items]
        nextUrl = data.next
      }

      const seen = new Map()
      allPlaylists.forEach(p => { if (!seen.has(p.id)) seen.set(p.id, p) })

      setPlaylists(Array.from(seen.values()).map(p => ({
        id: p.id,
        name: p.name,
        tracks: p.tracks.total,
        owner: p.owner.display_name,
        image: p.images?.[0]?.url ?? 'https://via.placeholder.com/150',
        spotifyUrl: p.external_urls?.spotify ?? '#',
        snapshotId: p.snapshot_id
      })))
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchUserProfile()
      fetchPlaylists()
      setCurrentPage(0)
    }
  }, [token, fetchUserProfile, fetchPlaylists])

  const fetchDurationsProgressively = useCallback(async () => {
    const total = playlists.length
    setDurationsProgress({ loaded: 0, total })

    for (let i = 0; i < playlists.length; i++) {
      const pl = playlists[i]
      const cacheKey = `dur_${pl.id}_${pl.snapshotId}`

      const cached = localStorage.getItem(cacheKey)
      if (cached !== null) {
        setDurations(prev => ({ ...prev, [pl.id]: Number(cached) }))
        setDurationsProgress({ loaded: i + 1, total })
        continue
      }

      let totalMs = 0
      let url = `https://api.spotify.com/v1/playlists/${pl.id}/tracks?fields=items(track(duration_ms)),next&limit=100`

      while (url) {
        let res = null
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            res = await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` },
              validateStatus: s => s < 500
            })
            if (res.status === 429) {
              const wait = Number(res.headers['retry-after'] ?? 5) * 1000
              await new Promise(r => setTimeout(r, wait))
              res = null
              continue
            }
            break
          } catch { break }
        }
        if (!res || res.status !== 200) break
        for (const item of res.data.items ?? []) {
          if (item?.track?.duration_ms) totalMs += item.track.duration_ms
        }
        url = res.data.next
      }

      localStorage.setItem(cacheKey, String(totalMs))
      setDurations(prev => ({ ...prev, [pl.id]: totalMs }))
      setDurationsProgress({ loaded: i + 1, total })

      if (i < playlists.length - 1) {
        await new Promise(r => setTimeout(r, 400))
      }
    }
  }, [playlists, token])

  const handleDurationSort = () => {
    setSortBy('duration')
    setCurrentPage(0)
    if (!durationsStartedRef.current) {
      durationsStartedRef.current = true
      setDurationsFetchStarted(true)
      fetchDurationsProgressively()
    }
  }

  const sortedPlaylists = useMemo(() => {
    return [...playlists].sort((a, b) => {
      if (sortBy === 'tracks') {
        return sortAscending ? a.tracks - b.tracks : b.tracks - a.tracks
      }
      const aDur = durations[a.id] ?? 0
      const bDur = durations[b.id] ?? 0
      return sortAscending ? aDur - bDur : bDur - aDur
    })
  }, [playlists, sortBy, sortAscending, durations])

  const filteredPlaylists = useMemo(() =>
    sortedPlaylists.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sortedPlaylists, searchQuery]
  )

  const totalPages = Math.ceil(filteredPlaylists.length / ITEMS_PER_PAGE)
  const displayedPlaylists = filteredPlaylists.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  )

  const toggleSortOrder = useCallback(() => {
    setSortAscending(prev => !prev)
    setCurrentPage(0)
  }, [])

  const durationsLoading = durationsFetchStarted && durationsProgress.loaded < durationsProgress.total

  const handleLogin = async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    localStorage.setItem('pkce_verifier', verifier)
    window.location.href = `${SPOTIFY_AUTH_BASE}&code_challenge=${challenge}&code_challenge_method=S256`
  }

  const handleLogout = () => {
    localStorage.removeItem('spotifyToken')
    durationsStartedRef.current = false
    setToken('')
    setPlaylists([])
    setUser('')
    setDurations({})
    setDurationsFetchStarted(false)
    setDurationsProgress({ loaded: 0, total: 0 })
    setSortBy('tracks')
    setCurrentPage(0)
    setSearchQuery('')
  }

  return (
    <Router>
      <Routes>
        <Route path="/callback" element={<Callback setToken={setToken} />} />

        <Route path="/" element={
          <>
            <Header token={token} user={user} />
            <div className="container">
              {token ? (
                <>
                  <button className="logout-button" onClick={handleLogout}>
                    Logout
                  </button>

                  <div className="sort-controls">
                    <button onClick={() => {
                      setSortBy('tracks')
                      setCurrentPage(0)
                    }}>
                      Sort by track count
                    </button>
                    <button onClick={handleDurationSort}>
                      Sort by duration
                      {durationsLoading && ` (${durationsProgress.loaded}/${durationsProgress.total})`}
                    </button>
                    <button onClick={toggleSortOrder}>
                      Toggle order ({sortAscending ? 'Ascending' : 'Descending'})
                    </button>
                  </div>

                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search playlist..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(0)
                      }}
                    />
                  </div>

                  <p className="current-order">
                    <strong>Current order:</strong>{' '}
                    {sortBy === 'tracks' ? 'Track count' : 'Duration'}{' '}
                    — {sortAscending ? 'Ascending' : 'Descending'}
                    {durationsLoading && (
                      <span className="duration-progress">
                        {' '}— Loading durations: {durationsProgress.loaded}/{durationsProgress.total}
                      </span>
                    )}
                  </p>

                  {loading ? (
                    <Loader />
                  ) : (
                    <>
                      <div className="playlist-grid">
                        {displayedPlaylists.map(playlist => (
                          <a
                            key={playlist.id}
                            href={playlist.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="playlist-card"
                          >
                            <img src={playlist.image} alt={playlist.name} />
                            <h3>{playlist.name}</h3>
                            {sortBy === 'tracks' && (
                              <p>Tracks: {playlist.tracks}</p>
                            )}
                            {sortBy === 'duration' && (
                              <p>
                                {durations[playlist.id] != null
                                  ? formatDuration(durations[playlist.id]).formatted
                                  : '...'}
                              </p>
                            )}
                          </a>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <Pagination
                          totalPages={totalPages}
                          currentPage={currentPage}
                          onPageChange={setCurrentPage}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <button onClick={handleLogin} className="login-button">
                  Log in with Spotify
                </button>
              )}
            </div>
          </>
        } />
      </Routes>
    </Router>
  )
}

export default App
