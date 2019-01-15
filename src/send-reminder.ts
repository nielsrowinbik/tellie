import * as dotenv from 'dotenv';
import Telegraf, { Extra } from 'telegraf';
import { get, trimEnd } from 'lodash';
import { Reminder } from './utils/constants';
import { Handler, Callback, APIGatewayEvent } from 'aws-lambda';

dotenv.config();

const { BOT_DOMAIN: BOT_DOMAIN_UNSAFE, BOT_TOKEN } = process.env;
const BOT_DOMAIN = trimEnd(BOT_DOMAIN_UNSAFE);

const bot = new Telegraf(BOT_TOKEN || '');

// TODO: Edit original acknowledgement when sending reminder

const handler: Handler = (event: APIGatewayEvent, _, callback: Callback) => {
    const query = event.queryStringParameters;
    const reminder: Reminder = {
        _id: get(query, '_id'),
        acknowledgement: parseInt(get(query, 'acknowledgement')),
        chat: parseInt(get(query, 'chat')),
        text: get(query, 'text'),
    };
    const options = Extra.markdown()
        .inReplyTo(reminder.acknowledgement)
        .markup(m =>
            m.inlineKeyboard([
                [
                    // m.callbackButton('Snooze 1 hour', 'reminder_snooze'),
                    // m.callbackButton('Done', 'reminder_done'),
                ],
            ])
        );

    bot.telegram
        .sendMessage(reminder.chat, reminder.text, options)
        .then(() => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    status: 'OK',
                    message: 'Reminder was sent',
                }),
            });
        })
        .catch(error => {
            callback(error);
        });
};

export { handler };
