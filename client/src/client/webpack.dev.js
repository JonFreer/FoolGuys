const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    output: {
        // devtoolLineToLine: true,
        sourceMapFilename: "./bundle.js.map",
        pathinfo: true,
        path: __dirname,
        filename: "bundle.js"
    },
    devServer: {
        static: {
            directory: path.join(__dirname, '../../dist/client'),
        },
        hot: true,
        proxy: {
            '/socket.io': {
                target: 'http://127.0.0.1:3000',
                ws: true,
            },
        },
    },
})