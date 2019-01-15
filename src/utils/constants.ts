export const BOT_PATH = '.netlify/functions/bot';
export const BOT_NAME = 'TellieBot';
export interface Reminder {
    _id?: string;
    acknowledgement: number;
    chat: number;
    text: string;
}
