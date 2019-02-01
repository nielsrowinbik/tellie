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

    const { album, artist, track } = resultToObject(await doSearch(words));

    if (track.preview) {
        await replyWithAudio(track.preview, Extra.inReplyTo(message_id));
        await reply(
            `Here's a sample for *${get(track, 'name')}* from the album:`,
            Extra.markdown()
        );
    } else {
        await reply(
            `${acknowledge()} ${first_name}, *${track.name}* by *${
                artist.name
            }* from the album:`,
            Extra.markdown().inReplyTo(message_id)
        );
    }

    return replyWithPhoto(
        album.artwork,
        Extra.load({
            caption: album.name,
        }).markup(m =>
            m.inlineKeyboard([
                [m.urlButton('Listen to full track', track.permalink)],
                [m.urlButton('Listen to album', album.permalink)],
                [m.urlButton('View artist', artist.permalink)],
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

const resultToObject = (json: object) => {
    return {
        track: {
            name: get(json, 'tracks.items[0].name'),
            permalink: get(json, 'tracks.items[0].external_urls.spotify'),
            preview: get(json, 'tracks.items[0].preview_url'),
        },
        artist: {
            name: get(json, 'tracks.items[0].artists[0].name'),
            permalink: get(
                json,
                'tracks.items[0].artists[0]external_urls.spotify'
            ),
        },
        album: {
            artwork: get(json, 'tracks.items[0].album.images[1].url'),
            name: get(json, 'tracks.items[0].album.name'),
            permalink: get(json, 'tracks.items[0].album.external_urls.spotify'),
        },
    };
};

export default SpotifyCommand;
export { SpotifyCommand };
