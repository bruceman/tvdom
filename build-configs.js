const path = require('path');

// build configs
const configs = [
    {
        entry: path.resolve('index.js'),
        dest: path.resolve('dist/tvdom.common.js'),
        format: 'cjs'
    },
    {
        entry: path.resolve('index.js'),
        dest: path.resolve('dist/tvdom.esm.js'),
        format: 'es'
    },
    {
        entry: path.resolve('index.js'),
        dest: path.resolve('dist/tvdom.js'),
        format: 'umd'
    }
];

module.exports = configs;