import { format, isToday, isTomorrow } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const removeString = (sub: string, rem: string, bindex?: number) => {
    if (!bindex) bindex = sub.indexOf(rem);
    const eindex = bindex + rem.length;
    const result = sub.substr(0, bindex) + sub.substr(eindex);
    return result.trim().replace(/\s\s+/g, ' ');
};

export const stripCommand = (str: string) => {
    const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]+)?$/i;
    const parts = regex.exec(str);

    return {
        text: str,
        command: parts[1] || '',
        bot: parts[2] || '',
        args: parts[3] || '',
    };
};

const randomFromOptions = (options: string[]) => (): string =>
    options[(Math.random() * options.length) >> 0];

export const acknowledge = randomFromOptions(['Alright', 'Okay', 'Sure']);

export const remind = randomFromOptions([
    "here's your reminder",
    "don't forget about",
]);

export const formatDate = (date: Date): string =>
    isToday(date)
        ? format(date, "'at' HH:mm")
        : isTomorrow(date)
        ? format(date, "'tomorrow at' HH:mm")
        : format(date, "'on' MMM d 'at' HH:mm");

export const toReminderText = (str: string): string => {
    const subjectWords = str.split(' ');

    if (str === '' || !str) return "here's your reminder";
    if (subjectWords[0] === 'to') return `don't forget ${str}`;
    return `${remind()} ${subjectWords[0] === 'about' ? str : `about ${str}`}`;
};
