import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import axios from 'axios'
import Callback from './Callback'
import Loader from './components/Loader'
import Header from './components/Header'
import Pagination from './components/Pagination'
import './App.css'

// Función para determinar la URI de redirección
const getRedirectUri = () => {
  // Verifica si estamos en desarrollo o producción
  const isDevelopment = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return isDevelopment
    ? 'http://localhost:5173/callback'
    : 'https://zort-rho.vercel.app/callback';
};

// Construir la URL de autorización usando la URI correcta y forzando el diálogo
const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(getRedirectUri())}&response_type=token&scope=playlist-read-private%20playlist-read-collaborative&show_dialog=true`;

function App() {
  const [token, setToken] = useState(localStorage.getItem('spotifyToken') || '')
  const [playlists, setPlaylists] = useState([])
  const [sortBy, setSortBy] = useState('tracks')
  const [sortAscending, setSortAscending] = useState(false) // false: descendente, true: ascendente
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 20
  const [user, setUser] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUserProfile = async () => {
    try {
      const { data } = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(data.display_name)
    } catch (error) {
      console.error("Error obteniendo perfil de usuario:", error)
    }
  }

  const fetchPlaylists = async () => {
    try {
      console.log("Iniciando fetch de playlists...")
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

      console.log("Se obtuvieron", allPlaylists.length, "playlists")

      // Eliminar duplicados al momento de procesar los datos
      const uniquePlaylistsMap = new Map();
      allPlaylists.forEach(playlist => {
        if (!uniquePlaylistsMap.has(playlist.id)) {
          uniquePlaylistsMap.set(playlist.id, playlist);
        }
      });

      const uniquePlaylists = Array.from(uniquePlaylistsMap.values());

      setPlaylists(uniquePlaylists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        tracks: playlist.tracks.total,
        owner: playlist.owner.display_name,
        duration: 0,
        image: playlist.images && playlist.images.length > 0 ? playlist.images[0].url : 'https://via.placeholder.com/150',
        spotifyUrl: playlist.external_urls?.spotify || '#'
      })));
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      console.log("Token detectado, llamando a fetchUserProfile y fetchPlaylists")
      fetchUserProfile()
      fetchPlaylists()
      setCurrentPage(0) // Reinicia la paginación al cargar nuevas playlists
    }
  }, [token])

  // Función para eliminar duplicados manteniendo el orden
  const removeDuplicates = (playlists) => {
    const seen = new Set();
    return playlists.filter(playlist => {
      const duplicate = seen.has(playlist.id);
      seen.add(playlist.id);
      return !duplicate;
    });
  };

  // Modificar el ordenamiento y filtrado para incluir la eliminación de duplicados
  const sortedAndUniquePlaylist = removeDuplicates([...playlists]).sort((a, b) => {
    if (sortBy === 'tracks') {
      return sortAscending ? a.tracks - b.tracks : b.tracks - a.tracks;
    } else {
      return sortAscending ? a.duration - b.duration : b.duration - a.duration;
    }
  });

  // Aplicar el filtro de búsqueda después de eliminar duplicados
  const filteredPlaylists = sortedAndUniquePlaylist.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular la paginación con la lista sin duplicados
  const totalPages = Math.ceil(filteredPlaylists.length / itemsPerPage);
  const displayedPlaylists = filteredPlaylists.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Agregar un log para debugging
  useEffect(() => {
    const totalUnique = new Set(playlists.map(p => p.id)).size;
    console.log(`Total playlists: ${playlists.length}, Unique playlists: ${totalUnique}`);
  }, [playlists]);

  const toggleSortOrder = () => {
    setSortAscending(prev => !prev)
    setCurrentPage(0)
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
                  <button className="logout-button" onClick={() => {
                    localStorage.removeItem('spotifyToken')
                    setToken('')
                  }}>Logout</button>

                  <div className="sort-controls">
                    <button onClick={() => {
                      setSortBy('tracks')
                      setCurrentPage(0)
                    }}>
                      Ordenar por cantidad de canciones
                    </button>
                    <button disabled>
                      Ordenar por duración (próximamente)
                    </button>
                    <button onClick={toggleSortOrder}>
                      Cambiar orden ({sortAscending ? 'Ascendente' : 'Descendente'})
                    </button>
                  </div>

                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Buscar playlist..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(0)
                      }}
                    />
                  </div>

                  <p className="current-order">
                    <strong>Orden actual:</strong> {sortBy === 'tracks' ? 'Cantidad de canciones' : 'Duración'} - {sortAscending ? 'Ascendente' : 'Descendente'}
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
                            <img
                              src={playlist.image}
                              alt={playlist.name}
                            />
                            <h3>{playlist.name}</h3>
                            {sortBy === 'tracks' && (
                              <p>Canciones: {playlist.tracks}</p>
                            )}
                          </a>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <Pagination
                          totalPages={totalPages}
                          currentPage={currentPage}
                          onPageChange={(page) => setCurrentPage(page)}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <a href={SPOTIFY_AUTH_URL} className="login-button">
                  Iniciar sesión con Spotify
                </a>
              )}
            </div>
          </>
        } />
      </Routes>
    </Router>
  )
}

export default App