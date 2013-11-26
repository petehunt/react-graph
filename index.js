var Graph = require('./Graph');

var makeObjectUpdatable = require('./makeObjectUpdatable');
var update = require('./update');

module.exports = {
  createGraph: Graph.createGraph,
  makeObjectUpdatable: makeObjectUpdatable,
  update: update
};