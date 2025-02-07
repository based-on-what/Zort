import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Callback = ({ setToken }) => {
    const navigate = useNavigate()

    useEffect(() => {
        const hash = window.location.hash
        if (hash) {
            const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))?.split('=')[1]

            if (token) {
                setToken(token)
                localStorage.setItem('spotifyToken', token)

                // Redirigir a la ruta base del sitio actual
                const baseUrl = window.location.origin
                window.location.href = baseUrl
            }
        }
    }, [setToken])

    return null
}

export default Callback