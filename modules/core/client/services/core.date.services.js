/**
 * Created by Dimitri on 19/10/2017.
 */

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// Return formated date from string formated input date.
exports.getFormatedDate = function(string) {
  const date = new Date(string);
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
};
