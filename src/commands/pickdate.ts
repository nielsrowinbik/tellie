import { Extra } from 'telegraf';
import db from '../utils/db';

interface Datepicker {
    _id?: string;
    chat: number;
    subject: string;
    user: {
        id: number;
        first_name: string;
    };
}

const datepickers = db('datepickers');

const command = async (ctx: any) => {
    const { args: subject } = ctx.state.command;
    const chat = ctx.chat;
    const { first_name, id: user_id } = ctx.from;
    const { message_id } = ctx.message;

    // Build and store datepicker
    const datepicker: Datepicker = {
        chat: chat.id,
        subject,
        user: {
            id: user_id,
            first_name,
        },
    };
    datepickers.insert(datepicker);

    // Send personal message to user
    const privateOptions = Extra.markdown().markup(m =>
        m.inlineKeyboard([
            [m.urlButton('Tap to set up datepicker', `https://google.com/`)],
        ])
    );
    ctx.telegram.sendMessage(
        user_id,
        `Alright ${first_name}, tap the button below to set up your datepicker.\n\n*IMPORTANT NOTE*: Keep this link private. Sharing it will allow others to edit your datepicker!`,
        privateOptions
    );

    // Send prompt message to user to read personal message
    const publicOptions = Extra.markdown()
        .inReplyTo(message_id)
        .markup(m =>
            m.inlineKeyboard([
                [
                    m.urlButton(
                        'Tap to read',
                        `https://telegram.me/${process.env.BOT_NAME}`
                    ),
                    m.callbackButton('Resend', 'datepicker_init_resend'),
                ],
            ])
        );
    ctx.reply(
        `Okay ${first_name}, I've sent you a private message to set up a datepicker.`,
        publicOptions
    );
};

const PickDateCommand = {
    addHandlers: (bot: any): void => {
        bot.command('/pickdate', command);
        bot.command('/datepicker', command);
    },
};

export default PickDateCommand;
export { PickDateCommand, command };
