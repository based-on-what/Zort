import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import Callback from './Callback'

const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_REDIRECT_URI}&response_type=token&scope=playlist-read-private%20playlist-read-collaborative`

function App() {
  const [token, setToken] = useState(localStorage.getItem('spotifyToken') || '')
  const [playlists, setPlaylists] = useState([])
  const [sortBy, setSortBy] = useState('tracks')

  const fetchPlaylists = async () => {
    try {
      let allPlaylists = []
      let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50'
      
      while (nextUrl) {
        const { data } = await axios.get(nextUrl, {
          headers: { Authorization: `Bearer ${token}` }
        })
        allPlaylists = [...allPlaylists, ...data.items]
        nextUrl = data.next
      }

      setPlaylists(allPlaylists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        tracks: playlist.tracks.total,
        owner: playlist.owner.display_name,
        duration: 0 // Implementar luego con fetch de tracks
      })))
    } catch (error) {
      console.error('Error fetching playlists:', error)
    }
  }

  const sortedPlaylists = [...playlists].sort((a, b) => {
    return sortBy === 'tracks' ? b.tracks - a.tracks : b.duration - a.duration
  })

  return (
    <Router>
      <Routes>
        <Route path="/callback" element={<Callback setToken={setToken} />} />
        
        <Route path="/" element={
          token ? (
            <div className="container">
              <button onClick={() => {
                localStorage.removeItem('spotifyToken')
                setToken('')
              }}>Logout</button>

              <div className="sort-controls">
                <button onClick={() => setSortBy('tracks')}>
                  Ordenar por cantidad de canciones
                </button>
                <button disabled>Ordenar por duración (próximamente)</button>
              </div>

              <div className="playlist-grid">
                {sortedPlaylists.map(playlist => (
                  <div key={playlist.id} className="playlist-card">
                    <h3>{playlist.name}</h3>
                    <p>Creada por: {playlist.owner}</p>
                    <p>Canciones: {playlist.tracks}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <a href={SPOTIFY_AUTH_URL} className="login-button">
              Iniciar sesión con Spotify
            </a>
          )
        } />
      </Routes>
    </Router>
  )
}

export default App