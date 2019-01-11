import * as dotenv from 'dotenv';
import * as express from 'express';
import Telegraf from 'telegraf';
import serverless from 'serverless-http';
import { trimEnd } from 'lodash';

import { BOT_PATH } from './utils/constants';

dotenv.config();

const { BOT_DOMAIN: BOT_DOMAIN_UNSAFE, BOT_TOKEN } = process.env;
const BOT_DOMAIN = trimEnd(BOT_DOMAIN_UNSAFE);

const bot = new Telegraf(BOT_TOKEN || '');

const app = express();
app.get('/.netlify/functions/set-webhook', async (_, res) => {
    const webhook = `${BOT_DOMAIN || ''}/${BOT_PATH}`;
    return (await bot.telegram.setWebhook(webhook))
        ? res.json({ status: 'OK', webhook })
        : res.json({ status: 'ERROR' });
});

const handler = serverless(app);
export { handler };
