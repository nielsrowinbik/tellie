const { trueGray } = require('tailwindcss/colors');
const { colors } = require('tailwindcss/defaultTheme');

module.exports = {
    darkMode: 'class',
    mode: 'jit',
    plugins: [require('tailwindcss-only-child')],
    purge: ['./pages/**/*.tsx', './components/**/*.tsx', './layouts/**/*.tsx'],
    theme: {
        colors: {
            ...colors,
            gray: trueGray,
        },
        extend: {},
    },
    variants: {
        borderRadius: ['responsive', 'only'],
    },
};