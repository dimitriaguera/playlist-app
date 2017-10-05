/**
 * Created by Dimitri Aguera on 20/09/2017.
 */
/**
 * Created by Dimitri Aguera on 30/08/2017.
 */

// Plugins
const path = require('path');

const StyleLintPlugin = require('stylelint-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const merge = require('webpack-merge');
const common = require('./webpack.default.js');


module.exports = merge(common, {
    output: {
        path: path.resolve('public/dist'),
        publicPath: "/static/dist/",
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [{
                        loader: 'css-loader', options: {
                            sourceMap: true
                        }
                    }
                    ],
                }),
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: 'style-loader'
                },{
                    loader: "css-loader", options: {
                        sourceMap: true,
                        importLoaders: 1,
                    }
                },{
                    loader: 'postcss-loader', options: {
                        sourceMap: true,
                    }
                }, {
                    loader: "sass-loader", options: {
                        sourceMap: true,
                    }
                }],
            },
        ],
    },
    plugins: [
        new StyleLintPlugin({}),
        new ExtractTextPlugin({ // define where to save the file
            filename: '[name].bundle.css',
            allChunks: true,
        }),
    ],
});
