import * as chrono from 'chrono-node';
import { addHours, format, isToday, isTomorrow } from 'date-fns';
import { eq, filter, isUndefined, words } from 'lodash';
import * as schedule from 'node-schedule';
import { Extra } from 'telegraf';
import { acknowledge, removeString } from '../utils';
import db from '../utils/db';

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

const reminders = db('reminders');

export const command = async (ctx: any) => {
    const { args: userMessage } = ctx.state.command;
    const { id, first_name } = ctx.from;
    const { message_id } = ctx.message;

    // Parse text and build acknowledgement
    const { date, subject } = parse(userMessage);
    const moment = isToday(date)
        ? format(date, '[at] HH:mm')
        : isTomorrow(date)
        ? format(date, '[tomorrow at] HH:mm')
        : format(date, '[on] MMM D [at] HH:mm');
    const reply = `${acknowledge()}, I'll remind you ${moment}.`;

    // Send acknowledgement
    const options = Extra.markdown()
        .inReplyTo(message_id)
        .markup(m =>
            m.inlineKeyboard([[m.callbackButton('Cancel', 'reminder_cancel')]])
        );
    const sent = await ctx.reply(reply, options);

    // Build and store reminder
    const reminder: Reminder = {
        acknowledgement: sent.message_id,
        chat: sent.chat.id,
        date: date.toUTCString(),
        subject,
        user: {
            id,
            first_name,
        },
    };
    reminders.insert(reminder);

    // Schedule reminder
    return schedule.scheduleJob(
        `${sent.chat.id}_${sent.message_id}`,
        date,
        reminderFactory(ctx, reminder)
    );
};

const reminderFactory = (ctx: any, reminder: Reminder) => async () => {
    const {
        acknowledgement,
        chat,
        user: { first_name, id },
    } = reminder;

    // Edit our acknowledgement to remove the cancel button
    ctx.telegram.editMessageReplyMarkup(
        reminder.chat,
        reminder.acknowledgement,
        undefined,
        Extra.markdown()
    );

    // Send the actual reminder
    const options = Extra.markdown().markup(m =>
        m.inlineKeyboard([
            [
                m.callbackButton('Snooze 1 hour', 'reminder_snooze'),
                m.callbackButton('Done', 'reminder_done'),
            ],
        ])
    );
    const greeting = `[${first_name}](tg://user?id=${id})`;
    const subject = subjectToReminder(reminder.subject);
    const sent = await ctx.telegram.sendMessage(
        chat,
        `${greeting}, here's your reminder${subject}.`,
        options
    );

    // Mark the reminder as sent
    return reminders.update(
        { acknowledgement, chat },
        { $set: { sent: sent.message_id } }
    );
};

export const cancel = async (ctx: any) => {
    const {
        update: { callback_query },
    } = ctx;
    const {
        from: { id },
        message: { chat, message_id },
    } = callback_query;
    const reminder: Reminder | null = await reminders.find({
        chat: chat.id,
        acknowledgement: message_id,
    });

    // Check reminder existence
    if (reminder === null)
        return ctx.answerCbQuery('This reminder no longer exists');

    // Verify ownership
    if (!eq(reminder.user.id, id)) return ctx.answerCbQuery();

    // Find and cancel the reminder job
    const job =
        schedule.scheduledJobs[`${reminder.chat}_${reminder.acknowledgement}`];
    job && job.cancel();
    // Remove the reminder from the database
    reminders.remove({ _id: reminder._id });

    // Delete our acknowledgement and confirm cancellation
    ctx.telegram.deleteMessage(chat.id, reminder.acknowledgement);
    return ctx.answerCbQuery(`Okay, I won't remind you`);
    // Alternatively, edit our acknowledgement to reflect the cancellation
    // return ctx.telegram.editMessageText(chat.id, reminder.acknowledgement, undefined, `_Okay, I won't remind you._`, Extra.markdown());
};

export const snooze = async (ctx: any) => {
    const {
        update: { callback_query },
    } = ctx;
    const {
        from: { id },
        message: { chat, message_id },
    } = callback_query;
    const reminder: Reminder = await reminders.find({
        chat: chat.id,
        sent: message_id,
    });

    // Check reminder existence
    if (reminder === null)
        return ctx.answerCbQuery('This reminder no longer exists');

    // Verify ownership
    if (!eq(reminder.user.id, id)) return ctx.answerCbQuery();

    // Compute new date, find job, and reschedule
    const newDate = addHours(reminder.date, 1);
    const job =
        schedule.scheduledJobs[`${reminder.chat}_${reminder.acknowledgement}`];
    job && job.reschedule(newDate.toDateString());
    // Update the reminder in the database
    reminders.update(
        { _id: reminder._id },
        { $unset: { sent: true }, $set: { date: newDate.toUTCString() } }
    );

    // Delete our reminder message
    ctx.deleteMessage();

    // Confirm the snooze with the user
    return ctx.answerCbQuery(
        `${acknowledge()}, I'll remind you again in 1 hour.`
    );
};

export const done = async (ctx: any) => {
    const {
        update: { callback_query },
    } = ctx;
    const {
        from: { id },
        message: { chat, message_id },
    } = callback_query;
    const reminder: Reminder = await reminders.find({
        chat: chat.id,
        sent: message_id,
    });

    // Verify ownership
    if (!eq(reminder.user.id, id)) return ctx.answerCbQuery();

    // Remove the reminder from the database
    reminders.remove({ _id: reminder._id });

    // Edit our reminder message to remove the buttons
    return ctx.telegram.editMessageReplyMarkup(
        chat.id,
        message_id,
        undefined,
        Extra.markdown()
    );
};

const scheduleJobs = async (bot: any) => {
    const toSchedule = filter(
        await reminders.findAll({ sent: { $exists: false } }),
        ({ acknowledgement, chat }: Reminder) =>
            !jobExists(`${chat}_${acknowledgement}`)
    );
    toSchedule.forEach((reminder: Reminder) => {
        schedule.scheduleJob(
            `${reminder.chat}_${reminder.acknowledgement}`,
            new Date(reminder.date),
            reminderFactory(bot, reminder)
        );
    });
};

export const RemindMeCommand = {
    addHandlers: (bot: any): void => {
        // Set jobs for all unsent reminders
        scheduleJobs(bot);

        // Bot handlers
        bot.command('/remindme', command);
        bot.action('reminder_cancel', cancel);
        bot.action('reminder_snooze', snooze);
        bot.action('reminder_done', done);
        // bot.on('edited_message', editMessageHandler);
    },
};

const jobExists = (name: string) => !isUndefined(schedule.scheduledJobs[name]);

const parse = (str: string) => {
    const now = new Date();
    const parsed = chrono.parse(str, now, { forwardDate: true });
    return {
        date:
            parsed.length > 0
                ? new Date(parsed[0].start.date().getTime())
                : addHours(now, 1),
        subject: (parsed.length > 0
            ? removeString(str, parsed[0].text, parsed[0].index)
            : str
        ).trim(),
    };
};

export const subjectToReminder = (subject: string): string => {
    const subjectWords = words(subject);
    if (subject === '' || isUndefined(subject)) return '';
    if (subjectWords[0] === 'to')
        return `: *${subject
            .split(' ')
            .slice(1)
            .join(' ')}*`;
    if (subjectWords[0] === 'about') return ` ${subject}`;
    return ` about ${subject}`;
};

export default RemindMeCommand;
