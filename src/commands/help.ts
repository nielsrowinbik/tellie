import { Extra } from 'telegraf';

const HelpCommand = ({ message, reply }: any) =>
    reply('todo', Extra.inReplyTo(message.message_id));

export default HelpCommand;
export { HelpCommand };
