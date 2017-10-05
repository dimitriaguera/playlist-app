/**
 * Created by Dimitri Aguera on 20/09/2017.
 */

module.exports = ({file, options, env}) => ({
    plugins: {
        autoprefixer: env === 'production' ? {} : false,
    }
});
