import { Extra } from 'telegraf';
import { get } from 'lodash';
import fetch from 'node-fetch';

const handler = async (ctx: any) => {
    const options = Extra.inReplyTo(ctx.message.message_id).markdown();
    const { splitArgs: words } = ctx.state.command;
    const word = words[0];

    const response: any = await (await fetch(
        `https://api.urbandictionary.com/v0/define?term=${word}`
    )).json();
    const result = get(response, 'list[0]');

    if (result === null || result === undefined)
        return ctx.reply(
            `Sorry, I could not find a definition for *${word}*`,
            options
        );

    const { author, definition } = result;

    return ctx.reply(
        `According *${author}* on Urban Dictionary, the definition of *${word}* is:\n\n_${definition}_`,
        options
    );
};

const DefineCommand = {
    addHandlers: (bot: any): void => {
        bot.command('/define', handler);
    },
};

export default DefineCommand;
export { DefineCommand, handler };
