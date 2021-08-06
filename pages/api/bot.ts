import * as chrono from 'chrono-node';
import type { NextApiHandler } from 'next';
import { Telegraf, Markup } from 'telegraf';
import {
    acknowledge,
    formatDate,
    removeString,
    stripCommand,
    toReminderText,
} from '../../lib/helpers';
import { getSearchResults as getUDSearchResults } from '../../lib/urban-dictionary';
import { getSearchResults as getSpotifySearchResults } from '../../lib/spotify';
import { v4 as uuid } from 'uuid';
import { addHook } from '../../lib/posthook';
import { addHours } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: { webhookReply: true },
});

bot.command('define', async (ctx) => {
    const { args } = stripCommand(ctx.message.text);

    const { author, definition, permalink } = await getUDSearchResults(args);

    if (!definition) {
        return ctx.replyWithMarkdown(
            `Sorry, I could not find a definition for *${args}*.`
        );
    }

    return ctx.replyWithMarkdown(
        `According to *${author}* on Urban Dictionary, the definition of *${args.toLowerCase()}* is:\n\n_${definition}_`,
        Markup.inlineKeyboard([
            Markup.button.url('View definition on the web', permalink),
        ])
    );
});

bot.command('help', (ctx) => ctx.reply('I need somebody! 🎵'));

bot.command('remindme', async (ctx) => {
    const { message } = ctx;
    const { first_name, id } = message.from;
    const { args: userMessage } = stripCommand(message.text);

    const now = utcToZonedTime(new Date(), process.env.BOT_TIMEZONE);
    const parsed = chrono.parse(userMessage, now, { forwardDate: true });
    const subject = (
        parsed.length
            ? removeString(userMessage, parsed[0].text, parsed[0].index)
            : userMessage
    ).trim();
    const date =
        parsed.length > 0
            ? new Date(parsed[0].start.date().getTime())
            : addHours(now, 1);

    const reminder = {
        id: uuid(),
        chat: ctx.message.chat.id,
        inReplyTo: message.reply_to_message
            ? message.reply_to_message.message_id
            : message.message_id,
        text: `[${first_name}](tg://user?id=${id}), ${toReminderText(subject)}`,
    };

    try {
        const res = await addHook(reminder, date);

        if (res.status >= 300) {
            throw res.statusText;
        }

        return ctx.replyWithMarkdown(
            `${acknowledge()}, I'll remind you ${formatDate(date)}`
        );
    } catch (error) {
        console.log(error);
        return ctx.replyWithMarkdown(
            `Sorry, something went wrong storing your reminder.`
        );
    }
});

bot.command('spotify', async (ctx) => {
    const { first_name } = ctx.message.from;
    const { args } = stripCommand(ctx.message.text);
    const words = args || 'Runnin in the 90s';

    const { album, artist, track } = await getSpotifySearchResults(words);

    if (track.preview) {
        await ctx.replyWithAudio(track.preview);
        await ctx.replyWithMarkdown(
            `Here's a sample for *${track.name}* from the album:`
        );
    } else {
        ctx.replyWithMarkdown(
            `${acknowledge()} ${first_name}, *${track.name}* by *${
                artist.name
            }* from the album:`
        );
    }

    return ctx.replyWithPhoto(album.artwork, {
        caption: album.name,
        ...Markup.inlineKeyboard([
            [Markup.button.url('Listen to full track', track.permalink)],
            [Markup.button.url('Listen to album', album.permalink)],
            [Markup.button.url('View artist', artist.permalink)],
        ]),
    });
});

const handler: NextApiHandler = (req, res) => {
    if (req.method === 'POST') {
        bot.handleUpdate(req.body);
        res.status(200).json({ status: 'OK' });
    }
};

export default handler;
