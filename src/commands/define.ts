import { Extra } from 'telegraf';
import fetch from 'node-fetch';
import { get } from 'lodash';

const DefineCommand = async ({
    message: { message_id },
    reply,
    state: { command },
}: any) => {
    const options = Extra.markdown().inReplyTo(message_id);
    const { splitArgs: words } = command;
    const word = words[0];

    const response: any = await (await fetch(
        `https://api.urbandictionary.com/v0/define?term=${word}`
    )).json();
    const result = get(response, 'list[0]');

    if (result === null || result === undefined)
        return reply(
            `Sorry, I could not find a definition for *${word}*`,
            options
        );

    const { author, definition } = result;

    return reply(
        `According *${author}* on Urban Dictionary, the definition of *${word}* is:\n\n_${definition}_`,
        options
    );
};

export default DefineCommand;
export { DefineCommand };
