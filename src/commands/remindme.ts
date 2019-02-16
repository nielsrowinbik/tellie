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

// TODO: When /remindme command is a reply to a message, send reminder about that message
// TODO: Edit original acknowledgement when sending reminder
// TODO: Add ability to cancel a reminder
// TODO: Add ability to snooze a reminder
// TODO: Add ability to mark reminder as done

const RemindMeCommand = async ({ from, message, reply, state }: any) => {
    const { args: userMessage } = state.command;
    const { first_name, id } = from;
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

    // Build actual reminder
    const greeting = `[${first_name}](tg://user?id=${id})`;
    const text = subjectToReminder(subject);
    const reminder: Reminder = {
        _id: uuid(),
        acknowledgement: sent.message_id,
        chat: sent.chat.id,
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
    // TODO: Catch errors when storing reminder (by editing acknowledgement)
    try {
        await fetch(url, request);
    } catch (error) {
        console.log(error);
    }
};

const parse = (str: string) => {
    const now = new Date();
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
