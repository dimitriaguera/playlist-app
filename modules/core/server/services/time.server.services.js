/**
 * Created by Marc Foletto on 17/12/2017.
 */

/**
 * Clock helper for calculate duration of process en s
 *
 * Exemple :
 *
 *      let start = clock(); -> start = 2653
 *      let end = clock(start); -> {end = 3000, duration:
 * @param start
 * @returns {end, duration}
 */
module.exports.clock = function(start) {
  if (!start) return process.hrtime();
  let end = process.hrtime(start);

  return {
    end: end,
    duration: Math.round(end[0] * 1000 + end[1] / 1000000) / 100
  };
};
