import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Extra } from 'telegraf';
import { URLSearchParams } from 'url';
import { get } from 'lodash';
import { acknowledge } from '../utils';

dotenv.config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

const SpotifyCommand = async ({
    from,
    message: { message_id },
    reply,
    replyWithAudio,
    replyWithPhoto,
    state: { command },
}: any) => {
    const { first_name } = from;
    const { args } = command;
    const words = args || 'Running in the 90s';

    const result = await doSearch(words);
    const track = get(result, 'tracks.items[0]');
    const trackPermalink = get(track, 'external_urls.spotify');
    const trackPreview = get(track, 'preview_url');
    const album = get(track, 'album');
    const albumArtwork = get(album, 'images[1].url');
    const albumPermalink = get(album, 'external_urls.spotify');
    const artist = get(track, 'artists[0]');
    const artistPermalink = get(artist, 'external_urls.spotify');

    if (trackPreview) {
        await replyWithAudio(trackPreview, Extra.inReplyTo(message_id));
        await reply(
            `Here's a sample for *${get(track, 'name')}* from the album:`,
            Extra.markdown()
        );
        return replyWithPhoto(
            albumArtwork,
            Extra.load({ caption: get(album, 'name') }).markup(m =>
                m.inlineKeyboard([
                    [m.urlButton('Listen to full track', trackPermalink)],
                    [m.urlButton('Listen to album', albumPermalink)],
                    [m.urlButton('View artist', artistPermalink)],
                ])
            )
        );
    }

    await reply(
        `${acknowledge()} ${first_name}, *${track.name}* by *${
            artist.name
        }* from the album:`,
        Extra.markdown().inReplyTo(message_id)
    );
    return replyWithPhoto(
        albumArtwork,
        Extra.load({
            caption: album.name,
        }).markup(m =>
            m.inlineKeyboard([
                [m.urlButton('Listen to full track', trackPermalink)],
                [m.urlButton('Listen to album', albumPermalink)],
                [m.urlButton('View artist', artistPermalink)],
            ])
        )
    );
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
