import * as dotenv from 'dotenv';
import * as express from 'express';
import Telegraf, { Extra } from 'telegraf';
import serverless from 'serverless-http';
import { isUndefined, words } from 'lodash';

import { BOT_NAME } from './utils/constants';

dotenv.config();

const { BOT_TOKEN } = process.env;

const bot = new Telegraf(BOT_TOKEN || '', {
    telegram: {
        webhookReply: false,
    },
    username: BOT_NAME,
});

const app = express();
app.get('/.netlify/functions/send-reminder', async (req, res) => {
    const { chat, user_id, user_name } = req.query;
    const greeting = `[${user_name}](tg://user?id=${user_id})`;
    const subject = subjectToReminder(req.query.subject);
    const options = Extra.markdown().markup(m =>
        m.inlineKeyboard([
            [
                m.callbackButton('Snooze 1 hour', 'reminder_snooze'),
                m.callbackButton('Done', 'reminder_done'),
            ],
        ])
    );

    const sent = await bot.telegram.sendMessage(
        chat,
        `${greeting}, here's your reminder${subject}.`,
        options
    );
    return sent.message_id ? res.status(200) : res.status(500);
});

const subjectToReminder = (subject: string): string => {
    const subjectWords = words(subject);
    if (subject === '' || isUndefined(subject)) return '';
    if (subjectWords[0] === 'to')
        return `: *${subject
            .split(' ')
            .slice(1)
            .join(' ')}*`;
    if (subjectWords[0] === 'about') return ` ${subject}`;
    return ` about ${subject}`;
};

const handler = serverless(app);
export { handler };
