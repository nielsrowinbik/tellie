import * as dotenv from 'dotenv';
import Telegraf, { Extra } from 'telegraf';
import { Reminder } from './utils/constants';
import { Handler, Callback, APIGatewayEvent } from 'aws-lambda';

dotenv.config();

const { BOT_TOKEN } = process.env;

const bot = new Telegraf(BOT_TOKEN || '');

// TODO: Edit original acknowledgement when sending reminder

const handler: Handler = (event: APIGatewayEvent, _, callback: Callback) => {
    const query = event.queryStringParameters || {};
    const reminder: Reminder = {
        _id: query._id,
        acknowledgement: parseInt(query.acknowledgement),
        chat: parseInt(query.chat),
        text: query.text,
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
