import querystring from 'querystring';

const SEARCH_ENDPOINT = 'https://api.urbandictionary.com/v0/define';

export const getSearchResults = async (query: string) => {
    const params = querystring.stringify({
        term: query,
    });
    const results = await fetch(`${SEARCH_ENDPOINT}?${params}`);
    const json = await results.json();
    const item = json.list[0];

    return {
        author: item.author,
        definition: item.definition,
        permalink: item.permalink,
    };
};
