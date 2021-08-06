import querystring from 'querystring';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const SEARCH_ENDPOINT = `https://api.spotify.com/v1/search`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
    if (!client_id || !client_secret) {
        throw 'Spotify credentials not set!';
    }

    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.stringify({
            grant_type: 'client_credentials',
        }),
    });

    return response.json();
};

export const getSearchResults = async (query: string) => {
    const { access_token } = await getAccessToken();

    const params = querystring.stringify({
        q: query,
        type: 'track',
        limit: 5,
    });
    const results = await fetch(`${SEARCH_ENDPOINT}?${params}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    const json = await results.json();
    const item = json.tracks.items[0];

    return {
        track: {
            name: item.name,
            permalink: item.external_urls.spotify,
            preview: item.preview_url,
        },
        artist: {
            name: item.artists[0].name,
            permalink: item.artists[0].external_urls.spotify,
        },
        album: {
            artwork: item.album.images[1].url,
            name: item.album.name,
            permalink: item.album.external_urls.spotify,
        },
    };
};
