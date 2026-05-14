import './Header.css';

function Header({ token, user }) {
    return (
        <header className="header">
            {token ? (
                <h1>HERE ARE YOUR PLAYLISTS, {user}</h1>
            ) : (
                <>
                    <h1>WELCOME TO ZORT</h1>
                    <p>THE APP THAT SORTS YOUR SPOTIFY PLAYLISTS CONVENIENTLY</p>
                </>
            )}
        </header>
    );
}

export default Header; 