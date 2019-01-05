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

export const acknowledge = (): string => {
    const options = ['Alright', 'Okay', 'Sure'];

    return options[(Math.random() * options.length) >> 0];
};
