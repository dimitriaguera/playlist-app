/**
 * Created by Dimitri Aguera on 30/08/2017.
 */

exports.index = function(req, res) {
  res.render('./public/dist/views/index', (err, html) => {
    if (err) {
      return res.status(500).send(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Server Error</title>
        </head>
        <body>
          <h1>Server Error</h1>
          <p>The playlistapp service is not available</p>
        </body>
        </html>
        `
      );
    }
    res.send(html);
  });
};

exports.renderNotFound = function(req, res) {
  res.status(404).render('./public/dist/views/404');
};
