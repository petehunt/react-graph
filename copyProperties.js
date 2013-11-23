function copyProperties(x, y) {
  for (var k in y) {
    if (!y.hasOwnProperty(k)) {
      continue;
    }
    x[k] = y[k];
  }
}

module.exports = copyProperties;