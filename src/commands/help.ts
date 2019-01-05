import { Extra } from 'telegraf';

const handler = (ctx: any): void => {
    const options = Extra.inReplyTo(ctx.message.message_id);

    return ctx.reply('todo', options);
};

const HelpCommand = {
    addHandlers: (bot: any): void => {
        bot.command('/help', handler);
    },
};

export default HelpCommand;
export { HelpCommand, handler };
