/**
 * Created by Dimitri Aguera on 30/08/2017.
 */


exports.index = devTools => function(req, res) {

  if ( !devTools.devMiddleware ) {
    return res.render('./public/dist/views/index');
  }

  const pug = require('pug');
  const path = require('path');
  res.send(pug.render(devTools.devMiddleware.fileSystem.readFileSync(path.resolve(`${devTools.outPutPath}/views/index.server.views.html`)).toString()));

};

exports.renderNotFound = devTools => function(req, res) {

  if ( !devTools.devMiddleware ) {
    return res.status(404).render('./public/dist/views/404');
  }

  const pug = require('pug');
  const path = require('path');
  res.send(pug.render(devTools.devMiddleware.fileSystem.readFileSync(path.resolve(`${devTools.outPutPath}/views/404.server.views.html`)).toString()));



};
