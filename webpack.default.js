/**
 * Created by Dimitri Aguera on 20/09/2017.
 */
/**
 * Created by Dimitri Aguera on 30/08/2017.
 */
const path = require('path');

// Plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');

const BeepPlugin = require('webpack-beep-plugin');

module.exports = {
  entry: {
    main: path.resolve(__dirname, 'modules/core/client/index.js')
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [
      path.resolve(__dirname, 'modules'),
      path.resolve(__dirname, 'config'),
      'node_modules'
    ]
  },
  module: {

    rules: [
      {
        test: /\.html$/,
        use: ['pug-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        use: ['babel-loader', 'import-glob'],
        exclude: /node_modules/
      },
      {
        test: /\.jsx$/,
        use: ['babel-loader', 'import-glob'],
        exclude: /node_modules/
      },
      {
        test: /\.(ico|eot|otf|webp|ttf|woff|woff2)$/i,
        use: {
          loader: 'file-loader',
          options: {
            limit: 100000,
            publicPath: '',
            name: 'assets/[name].[hash:8].[ext]'
          }
        }
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              // path: '',
              name: 'images/[name].[hash:8].[ext]'
            }
          },
          'img-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'views/index.server.views.html',
      template: 'modules/core/server/views/index.server.views.html'
    }),
    new HtmlWebpackPlugin({
      filename: 'views/404.server.views.html',
      template: 'modules/core/server/views/404.server.views.html'
    }),
    new HtmlWebpackPlugin({
      filename: 'views/500.server.views.html',
      template: 'modules/core/server/views/500.server.views.html'
    }),
    new BeepPlugin()
  ]
};
