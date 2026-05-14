import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const REDIRECT_URI = 'https://zort-rho.vercel.app/callback'

const Callback = ({ setToken }) => {
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')
        const verifier = localStorage.getItem('pkce_verifier')

        if (error || !code || !verifier) {
            navigate('/')
            return
        }

        const exchangeToken = async () => {
            try {
                const { data } = await axios.post(
                    'https://accounts.spotify.com/api/token',
                    new URLSearchParams({
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: REDIRECT_URI,
                        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
                        code_verifier: verifier
                    }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                )
                localStorage.removeItem('pkce_verifier')
                localStorage.setItem('spotifyToken', data.access_token)
                setToken(data.access_token)
                window.location.href = window.location.origin
            } catch (err) {
                console.error('Token exchange failed:', err)
                navigate('/')
            }
        }

        exchangeToken()
    }, [navigate, setToken])

    return null
}

export default Callback
