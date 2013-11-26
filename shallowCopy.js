var copyProperties = require('./copyProperties');

function shallowCopy(x) {
  var newObj = new x.constructor();
  copyProperties(newObj, x);
  return newObj;
}

module.exports = shallowCopy;