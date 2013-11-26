function keyMirror(x) {
  var y = {};
  for (var k in x) {
    y[k] = k;
  }
  return y;
}

module.exports = keyMirror;