var copyProperties = require('./copyProperties');
var invariant = require('./invariant');
var makeObjectUpdatable = require('./makeObjectUpdatable');

function GraphEdge(type, key2, order, data) {
  this.type = type;
  this.key2 = key2;
  this.order = order || 0;
  this.data = data || null;
}

function GraphNode(type, data) {
  this.type = type;
  this.data = data;
}

function Graph(nodeTypes, edges, nodes) {
  // edges: nodekey -> []
  this.nodeTypes = nodeTypes;
  this.edges = edges;
  this.nodes = nodes;
}

copyProperties(Graph.prototype, {
  _orderedEdges: function(edges) {
    return edges.sort(function(a, b) {
      return a.order - b.order;
    });
  },

  getNode: function(key) {
    var node = this.nodes[key];
    var nodeType = this.nodeTypes[node.type];
    if (nodeType) {
      var obj = {
        graph: this,
        key: key,
        data: node.data
      };
      copyProperties(obj, nodeType);
      return obj;
    } else {
      return node.data;
    }
  },

  getEdgesByType: function(key, type) {
    return this._orderedEdges(
      (this.edges[key] || []).filter(function(edge) {
        return edge.type === type;
      })
    );
  },

  getNodesByEdgeType: function(key, type) {
    return this.getEdgesByType(key, type).map(function(edge) {
      return this.getNode(edge.key2);
    }, this);
  },

  getEdge: function(key, key2, type) {
    var edges = this._orderedEdges(
      (this.edges[key] || []).filter(function(edge) {
        return edge.key2 === key2 && edge.type === type;
      })
    );
    if (edges.length > 0) {
      return edges[0];
    }
    return null;
  },

  mutator: function() {
    invariant(this.isUpdatable(), 'mutator(): Graph is not updatable');
    return new GraphMutator(this);
  }
});

function GraphMutator(updatableGraph) {
  this.updatableGraph = updatableGraph;
  this.spec = {
    edges: {},
    nodes: {}
  };
}

copyProperties(GraphMutator.prototype, {
  addEdge: function(key1, key2, type, order, data) {
    this.removeEdge(key1, key2, type);
    this.spec.edges[key1] = this.spec.edges[key1].concat([
      new GraphEdge(type, key2, order, data)
    ]);

    return this;
  },

  removeEdge: function(key1, key2, type) {
    this.spec.edges[key1] = (this.spec.edges[key1] || this.updatableGraph.edges[key1] || []).filter(function(edge) {
      return !(edge.key2 === key2 && edge.type === type);
    });

    return this;
  },

  addNode: function(key, data, type) {
    var node = new GraphNode(type || null, data);
    this.spec.nodes[key] = (
      this.updatableGraph.nodes[key] ? {__replace: node} : node
    );

    return this;
  },

  removeNode: function(key) {
    this.spec.nodes[key] = (
      this.updatableGraph.nodes[key] ? {__replace: null} : null
    );

    return this;
  },

  save: function() {
    this.updatableGraph._update(this.spec);
  }
});

Graph.createGraph = function(mixinSpec, nodeTypes) {
  var graph = new Graph(nodeTypes || {}, {}, {});
  copyProperties(graph, mixinSpec || {});
  return makeObjectUpdatable(graph);
};

module.exports = Graph;