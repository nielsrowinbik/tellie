import { Extra } from 'telegraf';
import fetch from 'node-fetch';
import { capitalize, get, lowerCase } from 'lodash';

const DefineCommand = async ({
    message: { message_id },
    reply,
    state: { command },
}: any) => {
    const defaultOptions = Extra.markdown().inReplyTo(message_id);
    const { args: words } = command;

    const response: any = await (await fetch(
        `https://api.urbandictionary.com/v0/define?term=${words}`
    )).json();
    const result = get(response, 'list[0]');

    if (result === null || result === undefined)
        return reply(
            `Sorry, I could not find a definition for *${words}*.`,
            defaultOptions
        );

    const { author, definition, permalink, word } = result;
    const extraOptions = defaultOptions.markup(m =>
        m.inlineKeyboard([
            [m.urlButton('View definition on the web', permalink)],
        ])
    );

    return reply(
        `According *${author}* on Urban Dictionary, the definition of *${lowerCase(
            word
        )}* is:\n\n_${capitalize(definition)}_`,
        extraOptions
    );
};

export default DefineCommand;
export { DefineCommand };
