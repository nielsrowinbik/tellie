import { Extra } from 'telegraf';

const HelpCommand = ({ message, reply }: any) =>
    reply('I need somebody! 🎵', Extra.inReplyTo(message.message_id));

export default HelpCommand;
export { HelpCommand };
