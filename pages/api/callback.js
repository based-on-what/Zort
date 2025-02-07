import { Buffer } from "buffer";

export default async function callback(req, res) {
  const code = req.query.code || null;

  if (!code) {
    return res
      .status(400)
      .json({ error: "No se recibió el código de autorización" });
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

  const authOptions = {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
    }).toString(),
  };

  try {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      authOptions
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error });
    }

    // A partir de aquí, puedes proceder a utilizar tokenData.access_token para obtener datos del usuario.
    // Ejemplo: obtener el perfil del usuario
    const userProfileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + tokenData.access_token,
      },
    });

    const userProfile = await userProfileResponse.json();

    // Aquí puedes establecer una sesión, redirigir al usuario o devolver la información que necesites.
    return res.status(200).json({ user: userProfile });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error en el intercambio del código por el token" });
  }
}
