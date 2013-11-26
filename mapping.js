var invariant = require('./invariant');

function Item(key, value) {
  this.key = key;
  this.value = value;
}

function item(key, value) {
  return new Item(key, value);
}

function mapping() {
  var result = {};
  Array.prototype.slice.call(arguments).forEach(function(item) {
    invariant(
      item instanceof Item,
      'mapping(): you can only provide mapping.Item instance arguments! ' +
        '(passed %s)',
      item
    );
    invariant(
      !result.hasOwnProperty(item.key),
      'mapping(): you passed a duplicate key %s',
      item.key
    );
    result[item.key] = item.value;
  });
  return result;
}

mapping.item = item;

module.exports = mapping;