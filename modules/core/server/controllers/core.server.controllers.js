/**
 * Created by Dimitri Aguera on 30/08/2017.
 */

const { sendErrorBasic } = require('../services/error.server.services');

exports.index = (req, res) => {
  res.sendFile(
    process.env.PWD + '/public/dist/index.html',
    {
      maxAge: 0 //no cache
    },
    err => {
      if (err) sendErrorBasic(res);
    }
  );

  // With pug engine
  // res.render('./public/dist/views/index', (err, html) => {
  //   if (err) {
  //     return res.status(500).send(
  //       `
  //       <!DOCTYPE html>
  //       <html lang="en">
  //       <head>
  //         <meta charset="UTF-8">
  //         <title>Server Error</title>
  //       </head>
  //       <body>
  //         <h1>Server Error</h1>
  //         <p>The playlistapp service is not available</p>
  //       </body>
  //       </html>
  //       `
  //     );
  //   }
  //   res.send(html);
  // });
};

exports.renderNotFound = function(req, res) {
  res.sendFile(
    process.env.PWD + '/public/dist/404.html',
    {
      maxAge: 0 //no cache
    },
    err => {
      if (err) sendErrorBasic(res);
    }
  );

  // With pug engine
  //res.status(404).render('./public/dist/views/404');
};
