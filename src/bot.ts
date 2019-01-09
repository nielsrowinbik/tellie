import * as dotenv from 'dotenv';
import * as commandParts from 'telegraf-command-parts';
import * as express from 'express';
import Telegraf from 'telegraf';
import serverless from 'serverless-http';

import DefineCommand from './commands/define';
import HelpCommand from './commands/help';
import RemindMeCommand from './commands/remindme';

dotenv.config();

const { BOT_DOMAIN, BOT_NAME, BOT_TOKEN } = process.env;
const BOT_PATH = '.netlify/functions/bot';

const bot = new Telegraf(BOT_TOKEN || '', {
    telegram: {
        webhookReply: false,
    },
    username: BOT_NAME,
});
bot.use(commandParts());

bot.command('/define', DefineCommand);
bot.command('/help', HelpCommand);
bot.command('/remindme', RemindMeCommand);

const app = express();
app.get(`/${BOT_PATH}`, (_, res) => {
    // TODO: Move this to its own (secret) endpoint
    return bot.telegram.setWebhook(`${BOT_DOMAIN || ''}/${BOT_PATH}`)
        ? res.json({ status: 'OK' })
        : res.json({ status: 'ERROR' });
});
app.use(bot.webhookCallback(`/${BOT_PATH}`));

const handler = serverless(app);
export { handler };
