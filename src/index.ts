import * as dotenv from 'dotenv';
import * as glob from 'glob';
import * as ngrok from 'ngrok';
import * as path from 'path';
import Telegraf, { ContextMessageUpdate } from 'telegraf';
import * as commandParts from 'telegraf-command-parts';
import * as ora from 'ora';
import * as express from 'express';
import routes from './routes';

dotenv.config();

const init = async () => {
    const spinner = ora().start();

    const path = process.env.BOT_PATH || '';
    const port = process.env.BOT_PORT ? parseInt(process.env.BOT_PORT, 10) : 80;
    const url = process.env.BOT_URL || (await ngrok.connect(port));

    const bot = new Telegraf(process.env.BOT_TOKEN || '', {
        telegram: {
            webhookReply: false,
        },
        username: process.env.BOT_NAME || '',
    });
    bot.telegram.setWebhook(`${url}/${path}`);
    bot.use(commandParts());
    setupHandlers(bot);

    const app = express();
    app.use(bot.webhookCallback(`/${path}`));
    setupStaticRoutes(app);

    await app.listen(port);
    spinner.succeed(`Done. Listening on ${url}/${path}`);
};

const setupHandlers = (bot: Telegraf<ContextMessageUpdate>) => {
    const files = glob.sync('/commands/*.ts', {
        root: path.resolve(__dirname),
    });

    files.forEach(file => {
        const spinner = ora(`Loading command from ${file}`).start();
        try {
            const Command = require(file).default;
            Command.addHandlers(bot);
            spinner.succeed(`Loaded command from ${file}`);
        } catch (error) {
            spinner.fail(`Could not load command from ${file}`);
        }
    });
};

const setupStaticRoutes = app => {
    routes.forEach(({ route, folder }) => {
        app.use(route, express.static(['static', folder].join('/')));
    });
};

init();
