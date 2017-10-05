/**
 * Created by Dimitri Aguera on 30/08/2017.
 */

exports.index = function(req, res) {
    res.render('./public/dist/views/index');
};

exports.renderNotFound = function(req, res) {
    res.status(404).render('./public/dist/views/404');
};
