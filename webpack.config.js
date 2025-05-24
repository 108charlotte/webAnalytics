const path = require('path')

module.exports = {
    mode: 'development',
    entry: {
        bundle: './src/index.js'
    }, 
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    }, 
    devServer: {
        static: './dist',
        port: 3000,
        open: true
    },

}