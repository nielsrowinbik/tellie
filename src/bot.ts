import * as dotenv from 'dotenv';
import * as commandParts from 'telegraf-command-parts';
import * as express from 'express';
import Telegraf from 'telegraf';
import serverless from 'serverless-http';

import { BOT_NAME, BOT_PATH } from './utils/constants';

import DefineCommand from './commands/define';
import HelpCommand from './commands/help';
import RemindMeCommand from './commands/remindme';

dotenv.config();

const { BOT_TOKEN } = process.env;

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
app.get(`/${BOT_PATH}`, (_, res) => res.json({ status: 'OK' }));
app.use(bot.webhookCallback(`/${BOT_PATH}`));

const handler = serverless(app);
export { handler };
