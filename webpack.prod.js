/**
 * Created by Dimitri Aguera on 30/08/2017.
 */
const path = require('path');

// Plugins
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const merge = require('webpack-merge');
const common = require('./webpack.default.js');


module.exports = merge(common, {
  output: {
    path: path.resolve('public/dist'),
    publicPath: '/static/dist/',
    filename: '[hash].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {loader: 'css-loader'},
            {loader: 'postcss-loader'}
          ]
        })
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {loader: 'css-loader'},
            {loader: 'postcss-loader'},
            {loader: 'sass-loader'}
          ]
        })
      }
    ]

  },
  plugins: [
    new CleanWebpackPlugin(['public/dist']),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new ExtractTextPlugin({ // define where to save the file
      filename: '[hash].[name].bundle.css',
      allChunks: true
    }),
    new OptimizeCssAssetsPlugin({
      cssProcessor: require('cssnano'),
      cssProcessorOptions: { discardComments: { removeAll: true } }
    }),
    new UglifyJSPlugin({
      sourceMap: true,
      compress: {
        warnings: false,
        drop_console: true
      },
      output: {
        comments: false
      }
    })
  ]
});
