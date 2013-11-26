var invariant = require('./invariant');
var shallowCopy = require('./shallowCopy');
var update = require('./update');

function makeObjectUpdatable(obj) {
  var newObj = shallowCopy(obj);
  var updateListeners = [];
  var updated = false;
  var ready = false;

  invariant(
    !(newObj.update || newObj.addUpdateListener || newObj.removeUpdateListener),
    'makeObjectUpdatable(): object has a magic method name.'
  );

  newObj.__setReady = function() {
    invariant(!ready, '__setReady(): object already ready');
    ready = true;
  };

  newObj._update = function(spec) {
    invariant(!updated, '_update(): Updatable was already updated. You can only update once.');
    invariant(
      !ready,
      '_update(): Updatable is not ready yet. This happens when you trigger an _update() in an ' +
      'update callback. You should move that update logic to the first _update() invocation.'
    );

    updated = true;
    var updatedObj = makeObjectUpdatable(update(obj, spec));

    updateListeners.forEach(function(cb) {
      cb(updatedObj, newObj);
    });

    updatedObj.__setReady();
  };

  newObj.addUpdateListener = function(cb) {
    invariant(!updated, 'addUpdateListener(): Updatable was already updated so there are no more changes to listen for.');
    if (updateListeners.indexOf(cb) > -1) {
      return;
    }
    updateListeners.push(cb);
  };

  newObj.removeUpdateListener = function(cb) {
    var index = updateListeners.indexOf(cb);
    if (index > -1) {
      updateListeners.splice(index, 1);
    }
  };

  return newObj;
}

module.exports = makeObjectUpdatable;