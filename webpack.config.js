const path = require('path');

module.exports = () => ({
    entry: path.resolve(__dirname, 'src/index.ts'),

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'tellie.js',
        chunkFilename: '[name].[chunkhash:10].js',
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    module: {
        rules: [
            {
                test: /\.(j|t)s?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.mjs$/,
                type: 'javascript/auto',
            },
        ],
    },

    target: 'node',
});
