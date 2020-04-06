import * as dotenv from 'dotenv';
import { Extra } from 'telegraf';
import { acknowledge, remind, removeString } from '../utils';
import { addHours, format, isToday, isTomorrow } from 'date-fns';
import * as chrono from 'chrono-node';
import { convertToTimeZone } from 'date-fns-timezone';
import { isUndefined, words } from 'lodash';
import uuid from 'uuid/v4';
import { Reminder } from '../utils/constants';
import fetch from 'node-fetch';

dotenv.config();

const { BOT_TIMEZONE, POSTHOOK_API_KEY } = process.env;

const RemindMeCommand = async ({ from, message, reply, state }: any) => {
    const { args: userMessage } = state.command;
    const { first_name, id } = from;
    const { message_id } = message;

    // Parse user message
    const { date, formatted, subject } = parse(userMessage);
    const inReplyTo = parseReplyTo(message);

    // Send acknowledgement
    const options = Extra.markdown().inReplyTo(message_id);
    const sent = await reply(
        `${acknowledge()}, I'll remind you ${formatted}.`,
        options
    );

    // Build actual reminder
    const greeting = `[${first_name}](tg://user?id=${id})`;
    const text = subjectToReminder(subject);
    const reminder: Reminder = {
        _id: uuid(),
        acknowledgement: sent.message_id,
        chat: sent.chat.id,
        inReplyTo,
        text: `${greeting}, ${text}.`,
    };

    // Build Posthook API call
    const url = 'https://api.posthook.io/v1/hooks';
    const request = {
        body: JSON.stringify({
            path: `/.netlify/functions/send-reminder`,
            postAt: date.toISOString(),
            data: reminder,
        }),
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': POSTHOOK_API_KEY || '',
        },
        method: 'POST',
    };

    // Send Posthook API call
    // TODO: Show user reminder couldn't be saved by editing acknowledgement in case
    // of an error
    try {
        await fetch(url, request);
    } catch (error) {
        console.log(error);
    }
};

const parse = (str: string) => {
    const now = new Date();
    const parsed = chrono.parse(str, now, { forwardDate: true });
    const date =
        parsed.length > 0
            ? new Date(parsed[0].start.date().getTime())
            : addHours(now, 1);

    return {
        date,
        formatted: formatDate(date),
        subject: (parsed.length > 0
            ? removeString(str, parsed[0].text, parsed[0].index)
            : str
        ).trim(),
    };
};

const parseReplyTo = (message: any): number => {
    if (message.reply_to_message) return message.reply_to_message.message_id;
    return message.message_id;
};

const formatDate = (serverDate: Date): string => {
    const date = convertToTimeZone(serverDate, {
        timeZone: BOT_TIMEZONE || 'Europe/London',
    });

    return isToday(date)
        ? format(date, "'at' HH:mm")
        : isTomorrow(date)
        ? format(date, "tomorrow at' HH:mm")
        : format(date, "'on' MMM d 'at' HH:mm");
};

const subjectToReminder = (subject: string): string => {
    const subjectWords = words(subject);

    if (subject === '' || isUndefined(subject)) return "here's your reminder";
    if (subjectWords[0] === 'to') return `don't forget ${subject}`;
    return `${remind()} ${
        subjectWords[0] === 'about' ? subject : `about ${subject}`
    }`;
};

export default RemindMeCommand;
export { RemindMeCommand };
