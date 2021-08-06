import type { NextApiHandler } from 'next';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: { webhookReply: true },
});

const handler: NextApiHandler = async (_, res) => {
    // TODO: Switch to POST
    const webhook = `https://${process.env.BOT_DOMAIN}/api/bot`;
    return (await bot.telegram.setWebhook(webhook))
        ? res.json({ status: 'OK', webhook })
        : res.json({ status: 'ERROR' });
};

export default handler;
