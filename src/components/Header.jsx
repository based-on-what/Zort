import React from 'react';
import './Header.css';

function Header({ token, user }) {
    return (
        <header className="header">
            {token ? (
                <h1>AQUÍ ESTÁN SUS PLAYLISTS, {user}</h1>
            ) : (
                <>
                    <h1>BIENVENIDO A ZORT</h1>
                    <p>LA APLICACIÓN QUE ORDENA SUS PLAYLISTS DE SPOTIFY CONVENIENTEMENTE</p>
                </>
            )}
        </header>
    );
}

export default Header; 