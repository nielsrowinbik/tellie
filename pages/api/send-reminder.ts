import type { NextApiHandler } from 'next';
import { Telegraf } from 'telegraf';
import type { Reminder } from '../../lib/types';

const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: { webhookReply: true },
});

// const signing_key = process.env.POSTHOOK_SIGNING_KEY;

const handler: NextApiHandler = async (req, res) => {
    if (req.method === 'POST') {
        // if (!signing_key) {
        //     throw 'Posthook credentials not set!';
        // }

        // TODO: Verify incoming messages using the X-Ph-Signature header and the signing key

        const { chat, text, inReplyTo } = JSON.parse(req.body.data);

        try {
            await bot.telegram.sendMessage(chat, text, {
                reply_to_message_id: inReplyTo,
                parse_mode: 'Markdown',
            });

            return res.status(200).json({
                status: 'OK',
                message: 'Reminder was sent',
            });
        } catch (e) {
            return res.status(500).json({ status: 'ERROR', message: e });
        }
    }
};

export default handler;
