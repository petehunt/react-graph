var Graph = require('./Graph');
var ReactGraph = require('./ReactGraph');

var makeObjectUpdatable = require('./makeObjectUpdatable');
var update = require('./update');

module.exports = {
  createDomain: ReactGraph.createDomain,
  createGraph: Graph.createGraph,
  makeObjectUpdatable: makeObjectUpdatable,
  update: update
};