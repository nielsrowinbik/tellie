import { URLSearchParams } from 'url';

export const removeString = (sub: string, rem: string, bindex?: number) => {
    if (!bindex) bindex = sub.indexOf(rem);
    const eindex = bindex + rem.length;
    const result = sub.substr(0, bindex) + sub.substr(eindex);
    return result.trim().replace(/\s\s+/g, ' ');
};

export const stripCommand = (str: string) => {
    const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]*)$/i;
    const parts = regex.exec(str);

    return {
        text: str,
        command: parts ? parts[1] : '',
        bot: parts ? parts[2] : '',
        args: parts ? parts[3] : '',
        get splitArgs() {
            return parts ? parts[3].split(/\s+/) : '';
        },
    };
};

const randomFromOptions = (options: string[]) => (): string =>
    options[(Math.random() * options.length) >> 0];

export const acknowledge = randomFromOptions(['Alright', 'Okay', 'Sure']);

export const remind = randomFromOptions([
    "here's your reminder",
    "don't forget about",
]);

export const objectToURLSearchParams = (
    obj: object,
    toString: boolean = false
): URLSearchParams | string => {
    const params = new URLSearchParams();
    Object.keys(obj).forEach(key => params.append(key, obj[key]));
    return toString ? params.toString() : params;
};
