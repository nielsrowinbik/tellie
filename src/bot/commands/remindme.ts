import * as dotenv from 'dotenv';
import { Extra } from 'telegraf';
import { acknowledge, removeString } from '../utils';
import { addHours, format, isToday, isTomorrow } from 'date-fns';
import * as chrono from 'chrono-node';
import { convertToTimeZone } from 'date-fns-timezone';

dotenv.config();

const { BOT_TIMEZONE } = process.env;

const RemindMeCommand = async ({ message, reply, state }: any) => {
    const { args: userMessage } = state.command;
    const { message_id } = message;

    // Parse user message
    const { date } = parse(userMessage);
    const moment = isToday(date)
        ? format(date, '[at] HH:mm')
        : isTomorrow(date)
        ? format(date, '[tomorrow at] HH:mm')
        : format(date, '[on] MMM D [at] HH:mm');

    // Send acknowledgement
    const options = Extra.markdown()
        .inReplyTo(message_id)
        .markup(m =>
            m.inlineKeyboard([[m.callbackButton('Cancel', 'reminder_cancel')]])
        );
    return reply(`${acknowledge()}, I'll remind you ${moment}.`, options);
};

const parse = (str: string) => {
    const now = convertToTimeZone(new Date(), {
        timeZone: BOT_TIMEZONE || 'Europe/London',
    });
    const parsed = chrono.parse(str, now, { forwardDate: true });
    return {
        date:
            parsed.length > 0
                ? convertToTimeZone(
                      new Date(parsed[0].start.date().getTime()),
                      { timeZone: BOT_TIMEZONE || 'Europe/London' }
                  )
                : addHours(now, 1),
        subject: (parsed.length > 0
            ? removeString(str, parsed[0].text, parsed[0].index)
            : str
        ).trim(),
    };
};

export default RemindMeCommand;
export { RemindMeCommand };
