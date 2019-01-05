import { format, isToday, isTomorrow } from 'date-fns';
import { sortBy } from 'lodash';
import { Extra } from 'telegraf';
import db from '../utils/db';
import { subjectToReminder } from './remindme';

export const handler = async (ctx: any) => {
    const reminders = db('reminders');
    const { id, first_name } = ctx.from;
    const { message_id } = ctx.message;
    const limit = 5;
    const userReminders = await reminders.findAll({
        'user.id': id,
        sent: { $exists: false },
    });
    const options = Extra.markdown().inReplyTo(message_id);

    // Stop if user has no reminders
    if (userReminders.length === 0)
        return ctx.reply(`You do not have any pending reminders`, options);

    // If user has more than five replies, make a mention of it
    if (userReminders.length > limit)
        await ctx.reply(
            `Okay ${first_name}, you have ${
                userReminders.length
            } pending reminders. Here's the first ${limit}:`,
            options
        );
    else
        await ctx.reply(
            `Okay ${first_name}, here are your pending reminders:`,
            options
        );

    sortBy(userReminders, ['date'])
        .slice(0, limit)
        .forEach(async (reminder, index) => {
            const isFirst = index === 0;
            const isLast = index === limit - 1;
            const options = Extra.markdown();
            const count = isFirst
                ? 'First'
                : isLast
                ? 'Finally'
                : index % 2 === 0
                ? 'Next'
                : 'Then';
            await ctx.reply(
                `${count}, ${getDate(
                    reminder.date
                )}, I will remind you${subjectToReminder(reminder.subject)}.`,
                options
            );
        });
};

export const RemindersCommand = {
    addHandlers: (bot: any): void => {
        bot.command('/reminders', handler);
    },
};

const getDate = (date: string | Date): string => {
    if (isToday(date)) return format(date, '[today at] HH:mm');
    if (isTomorrow(date)) return format(date, '[tomorrow at] HH:mm');
    return format(date, '[on] MMM D [at] HH:mm');
};

export default RemindersCommand;
