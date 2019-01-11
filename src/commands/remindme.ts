import * as dotenv from 'dotenv';
import { Extra } from 'telegraf';
import { acknowledge, removeString } from '../utils';
import { addHours, format, isToday, isTomorrow } from 'date-fns';
import * as chrono from 'chrono-node';
import { convertToTimeZone } from 'date-fns-timezone';
import { URLSearchParams } from 'url';
import fetch from 'node-fetch';

dotenv.config();

interface Reminder {
    _id?: string;
    acknowledgement: number;
    chat: number;
    date: string;
    subject: string;
    user: {
        id: number;
        first_name: string;
    };
}

const {
    ATRIGGER_API_KEY,
    ATRIGGER_API_SECRET,
    ATRIGGER_API_URL_CREATE,
    BOT_DOMAIN,
    BOT_TIMEZONE,
} = process.env;

const RemindMeCommand = async ({ from, message, reply, state }: any) => {
    const { args: userMessage } = state.command;
    const { id, first_name } = from;
    const { message_id } = message;

    // Parse user message
    const { date, subject } = parse(userMessage);
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
    const sent = await reply(
        `${acknowledge()}, I'll remind you ${moment}.`,
        options
    );

    // Build reminder
    const reminder: Reminder = {
        acknowledgement: sent.message_id,
        chat: sent.chat.id,
        date: date.toUTCString(),
        subject,
        user: { id, first_name },
    };

    // Build request and store as remote CRON job
    const params = new URLSearchParams();
    params.append('key', ATRIGGER_API_KEY || '');
    params.append('secret', ATRIGGER_API_SECRET || '');
    params.append('timeSlice', '0minute');
    params.append('count', '1');
    params.append('url', `${BOT_DOMAIN}/.netlify/functions/send-reminder`);
    params.append('tag_id', ''); // TODO: Generate unique ID
    params.append('first', date.toISOString());
    const scheduled = await (await fetch(
        `${ATRIGGER_API_URL_CREATE}?${params.toString()}`,
        {
            method: 'POST',
            body: JSON.stringify(reminder),
        }
    )).json();

    // TODO: Better error handling
    if (scheduled.type === 'ERROR')
        return reply(`Error while storing reminder: ${scheduled.message}`);
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
