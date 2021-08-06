# Tellie

## Running locally

```bash
$ git clone https://github.com/nielsrowinbik/tellie
$ cd tellie
```

### With Docker:

```bash
$ docker-compose run --rm tellie npm ci # Only on first run to install dependencies
$ docker-compose up # To start development server
$ docker-compose exec tellie sh # Run this to run commands within the container
```

### Without Docker:

```bash
$ npm i # To install dependencies
$ npm run dev # To start development server