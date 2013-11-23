function invariant(x, msg) {
  if (!x) {
    throw new Error('Invariant Violation: ' + msg);
  }
}

module.exports = invariant;