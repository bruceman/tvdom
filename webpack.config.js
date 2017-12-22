var webpack = require("webpack");
var path = require('path');

var baseConfig = {
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['env']
                }
            }
        }]
    },
    // plugins: [
    //     new webpack.optimize.UglifyJsPlugin()
    // ]
};

var umdConfig = {
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'tvdom.js',
        libraryTarget: 'umd',
        library: 'tvdom'
    }
};

var esmConfig = {
    entry: './index.esm.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'tvdom.esm.js',
        library: 'tvdom'
    }
}

module.exports = function(env) {
    if (env && env.target == 'umd') {
        return Object.assign({}, baseConfig, umdConfig);
    } else {
        return Object.assign({}, baseConfig, esmConfig);
    }
}

