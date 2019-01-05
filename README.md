# Tellie

## Development

### Clone and install dependencies

```sh
$ git clone https://github.com/nielsrowinbik/tellie
$ cd tellie
$ yarn
```

### Development workflow

#### Set up environment variables:

Create a `.env` file in the root folder of the project and add the following entries:

```sh
BOT_NAME=SomeBot
BOT_TOKEN=123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ
DEVELOPMENT=true
```

Optionally set the `SECRET_PATH` value to make the bot's webhook available at a certain path rather than at `/`.

#### To start a local development server:

```sh
$ yarn dev
```

The bot will automatically restart when changes are made. Port 80 (default, can be changed through environment variable `PORT`) is automatically exposed via [`ngrok`](https://ngrok.com/) and the webhook is set as well.

### License

MIT
