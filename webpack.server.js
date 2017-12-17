const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const fs = require("fs");
const path = require('path');

const webPackConfig = require(path.resolve('./webpack.dev.js'));

outPutPath = webPackConfig.output.path;

const compiler = webpack(webPackConfig);

var server = new WebpackDevServer(compiler, {
  // webpack-dev-server options

  contentBase: path.resolve('public/dist'),
  // Can also be an array, or: contentBase: "http://localhost/",

  hot: false,
  // Enable special support for Hot Module Replacement
  // Page is no longer updated, but a "webpackHotUpdate" message is sent to the content
  // Use "webpack/hot/dev-server" as additional module in your entry point
  // Note: this does _not_ add the `HotModuleReplacementPlugin` like the CLI option does.

  historyApiFallback: false,
  // Set this as true if you want to access dev server from arbitrary url.
  // This is handy if you are using a html5 router.

  compress: true,
  // Set this if you want to enable gzip compression for assets

  proxy: {
    //"**": "http://localhost:8082"
  },
  // Set this if you want webpack-dev-server to delegate a single path to an arbitrary server.
  // Use "**" to proxy all paths to the specified server.
  // This is useful if you want to get rid of 'http://localhost:8080/' in script[src],
  // and has many other use cases (see https://github.com/webpack/webpack-dev-server/pull/127 ).

  setup: function(app) {
    // Here you can access the Express app object and add your own custom middleware to it.
    // For example, to define custom handlers for some paths:
    // app.get('/some/path', function(req, res) {
    //   res.json({ custom: 'response' });
    // });
  },

  // pass [static options](http://expressjs.com/en/4x/api.html#express.static) to inner express server
  staticOptions: {
  },

  clientLogLevel: "info",
  // Control the console log messages shown in the browser when using inline mode. Can be `error`, `warning`, `info` or `none`.

  // webpack-dev-middleware options
  quiet: false,
  noInfo: false,
  lazy: true,
  filename: "bundle.js",
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  // It's a required option.
  publicPath: "/static/dist/",
  headers: { "X-Custom-Header": "yes" },
  stats: { colors: true },

  // https: {
  //   cert: fs.readFileSync("path-to-cert-file.pem"),
  //   key: fs.readFileSync("path-to-key-file.pem"),
  //   cacert: fs.readFileSync("path-to-cacert-file.pem")
  // }
});
server.listen(8080, "localhost", function() {});
// server.close();