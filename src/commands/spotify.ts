import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Extra } from 'telegraf';
import { URLSearchParams } from 'url';
import { get } from 'lodash';

dotenv.config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

const SpotifyCommand = async ({
    message: { message_id },
    replyWithAudio,
    replyWithPhoto,
    state: { command },
}: any) => {
    const { args: words } = command;

    if (words.length === 0) return;

    const result = await doSearch(words);
    const track = get(result, 'tracks.items[0]');
    const trackPermalink = get(track, 'external_urls.spotify');
    const trackPreview = get(track, 'preview_url');
    const album = get(track, 'album');
    const albumArtwork = get(album, 'images[1].url');
    const albumPermalink = get(album, 'external_urls.spotify');
    const artist = get(track, 'artists[0]');
    const artistPermalink = get(artist, 'external_urls.spotify');

    const options = Extra.markup(m =>
        m.inlineKeyboard([
            [m.urlButton('Listen to full track', trackPermalink)],
            [m.urlButton('Listen to album', albumPermalink)],
            [m.urlButton('View artist', artistPermalink)],
        ])
    );

    if (trackPreview) {
        await replyWithPhoto(
            albumArtwork,
            Extra.inReplyTo(message_id).load({ caption: get(album, 'name') })
        );
        return replyWithAudio(trackPreview, options);
    }
    return replyWithPhoto(albumArtwork, options.inReplyTo(message_id)).load({
        caption: get(album, 'name'),
    });
};

const getToken = async (): Promise<string | boolean> => {
    const client = Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    const token = await (await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: params,
        headers: {
            Authorization: `Basic ${client}`,
        },
    })).json();

    return token.access_token || false;
};

const doSearch = async (query: string) => {
    const token = await getToken();

    const params = new URLSearchParams();
    params.append('q', query);
    params.append('type', 'track');
    params.append('limit', '5');

    const response = await (await fetch(
        `https://api.spotify.com/v1/search?${params.toString()}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    )).json();

    return response;
};

export default SpotifyCommand;
export { SpotifyCommand };
