# Tellie

## Development

### Before getting started

It is strongly advised to develop using a different bot than your production bot. During development, all commands sent to your bot will be handled by your local machine.

### Clone and install dependencies

```sh
$ git clone https://github.com/nielsrowinbik/tellie
$ cd tellie
$ npm i
```

### Development workflow

#### Expose the local development server to the web through ngrok:

```sh
$ npm run ngrok
```

Take note of the URL that ngrok exposes. We'll use `https://urlfromngrok.ngrok.io` in this guide as an example.

#### Set up environment variables:

Create a `.env` file in the root folder of the project and add the following entries:

```sh
BOT_DOMAIN=https://urlfromngrok.ngrok.io
BOT_TIMEZONE=Europe/Amsterdam
BOT_TOKEN=123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ
POSTHOOK_API_KEY=
```

 - `BOT_DOMAIN` is the URL from ngrok we grabbed earlier.
 - `BOT_TIMEZONE` is a timezone in its TZ database name.
 - `BOT_TOKEN` is a token you get from BotFather on Telegram.
 - `POSTHOOK_API_KEY` is the API key needed to store reminders. If you do not plan on using the remindme command, leave this out.

#### Start the local development servers

Run the following commands in separate terminal windows (order doesn't matter):

```sh
$ npm run dev:bot
$ npm run dev
```

This will start the netlify-functions emulator locally (first command) and serve the files in a live-reloading web-server (second command).


#### Have the bot set the correct webhook

Open your browser and point it to `https://urlfromngrok.ngrok.io/.netlify/functions/set-webhook`. Doing a GET here will make the bot register the correct webhook URL with the bot.

Note that this step is only necessary if you use the free version of ngrok, which gives you a different URL every time you start it.

#### All done

You are now ready to start development. Any commands sent to the bot will be handled by your local machine.


### License

MIT
