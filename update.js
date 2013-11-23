var copyProperties = require('./copyProperties');
var keyOf = require('./keyOf');
var invariant = require('./invariant');

function shallowCopy(x) {
  return copyProperties({}, x);
}

function terminalUpdate(old, update) {
  return update;
};

var KEY_PUSH = keyOf({__push: null});
var KEY_UNSHIFT = keyOf({__unshift: null});
var KEY_SPLICE = keyOf({__splice: null});

function arrayUpdate(arr, spec) {
  if (!isObject(spec)) {
    return spec;
  }

  var updated = arr.slice();

  for (var key in spec) {
    if (!spec.hasOwnProperty(key)) {
      continue;
    }

    var value = spec[key];

    if (key === KEY_PUSH) {
      invariant(
        Array.isArray(value),
        'Expected __push to be an array; got %s',
        value
      );
      value.forEach(function(item) {
        updated.push(item);
      });
    } else if (key === KEY_UNSHIFT) {
      invariant(
        Array.isArray(value),
        'Expected __unshift to be an array; got %s',
        value
      );
      value.forEach(function(item) {
        updated.unshift(item);
      });
    } else if (key === KEY_SPLICE) {
      invariant(
        Array.isArray(value),
        'Expected __splice to be an array; got %s',
        value
      );
      value.forEach(function(args) {
        updated.splice.apply(updated, args);
      });
    } else if (!isNaN(key)) {
      updated[key] = update(updated[key], value);
    } else {
      invariant(
        false,
        'update() got unexpected key for array update: %s',
        key
      );
    }
  }

  return updated;
};

function objectUpdate(original, obj) {
  if (!isObject(obj)) {
    return obj;
  }

  var updated = shallowCopy(original);

  for (var k in obj) {
    updated[k] = update(original[k], obj[k]);
  }

  return updated;
};

function isObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

function update(original, mutation) {
  if (typeof mutation === 'undefined') {
    return original;
  }

  if (Array.isArray(original)) {
    return arrayUpdate(original, mutation);
  } else if (isObject(original)) {
    return objectUpdate(original, mutation);
  }
  return terminalUpdate(original, mutation);
}

module.exports = update;