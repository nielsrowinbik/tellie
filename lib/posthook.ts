import querystring from 'querystring';

const api_key = process.env.POSTHOOK_API_KEY;

const HOOK_ENDPOINT = `https://api.posthook.io/v1/hooks`;

export const addHook = (data: any, date: Date) => {
    if (!api_key) {
        throw 'Posthook credentials not set!';
    }

    return fetch(HOOK_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': api_key,
        },
        body: JSON.stringify({
            path: '/api/send-reminder',
            postAt: date.toISOString(),
            data: JSON.stringify(data),
        }),
    });
};
