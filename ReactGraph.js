var copyProperties = require('./copyProperties');
var invariant = require('./invariant');
var update = require('./update');

var ReactGraphNodeTypeSpec = {
  getNodesByEdgeType: function(type) {
    return this.graph.rawGraph.getNodesByEdgeType(this.getKey(), type).map(
      this.graph._deserializeNode,
      this.graph
    );
  },

  getEdgesByType: function(type) {
    return this.graph.rawGraph.getEdgesByType(this.getKey(), type).map(
      function(edge) {
        return {
          data: edge.data,
          order: edge.order,
          node: this.graph.getNode(edge.key2)
        };
      },
      this
    );
  }
};

function ReactGraphGraphMutator(rawMutator) {
  this.rawMutator = rawMutator;
}

copyProperties(ReactGraphGraphMutator.prototype, {
  addNode: function(newNode) {
    var nodeData = {
      typeKey: newNode.constructor.__typeKey,
      data: newNode.data
    };
    this.rawMutator.addNode(newNode.getKey(), nodeData);

    return this;
  },

  removeNode: function(node) {
    this.rawMutator.removeNode(node.getKey());

    return this;
  },

  addEdge: function(node, node2, type, order, data) {
    this.rawMutator.addEdge(
      node.getKey(),
      node2.getKey(),
      type,
      order,
      data
    );

    return this;
  },

  removeEdge: function(node, node2, type) {
    this.rawMutator.removeEdge(node.getKey(), node2.getKey(), type);

    return this;
  },

  save: function() {
    this.rawMutator.save();
  }
});

// Created every tick!
function ReactGraphGraph(rawGraph, nodeTypes) {
  this.rawGraph = rawGraph;
  this.nodeTypes = nodeTypes;
  this.rawMutator = rawGraph.mutator();
}

copyProperties(ReactGraphGraph.prototype, {
  _deserializeNode: function(entry) {
    return this.nodeTypes[entry.typeKey](entry.data, this);
  },

  getNode: function(key) {
    return this._deserializeNode(this.rawGraph.getNode(key));
  },

  mutator: function() {
    return new ReactGraphGraphMutator(this.rawMutator);
  },

  save: function() {
    this.mutator().save();
  }
});

function ReactGraphEdgeType(typeKey, fromNodeType, toNodeType) {
  this.typeKey = typeKey;
  this.fromNodeType = fromNodeType;
  this.toNodeType = toNodeType;
}

function ReactGraphDomain() {
  this.idSeed = 0;
  this.nodeTypes = {};
  this.locked = false;
}

copyProperties(ReactGraphDomain.prototype, {
  createNodeType: function(spec) {
    invariant(
      !this.locked,
      'createNodeType(): createGraph() was already called.'
    );

    function NodeType(data, graph) {
      this.data = data;
      this.graph = graph;
    }

    NodeType.__typeKey = 'nodeType:' + (this.idSeed++);

    function convenienceConstructor(data, graph) {
      return new NodeType(data, graph);
    }

    this.nodeTypes[NodeType.__typeKey] = convenienceConstructor;

    if (spec['static']) {
      copyProperties(convenienceConstructor, spec['static']);
      copyProperties(NodeType, spec['static']);
      spec = update(spec, {'static': {__replace: undefined}});
    }

    copyProperties(NodeType.prototype, ReactGraphNodeTypeSpec);
    copyProperties(NodeType.prototype, spec);

    return convenienceConstructor;
  },

  createEdgeType: function(spec) {
    invariant(
      !this.locked,
      'createEdgeType(): createGraph() was already called.'
    );

    return new ReactGraphEdgeType(
      'edgeType:' + (this.idSeed++),
      spec.fromNodeType,
      spec.toNodeType
    );
  },

  createGraph: function(rawGraph) {
    this.locked = true;
    return new ReactGraphGraph(rawGraph, this.nodeTypes);
  }
});

var ReactGraph = {
  createDomain: function() {
    return new ReactGraphDomain();
  }
};

module.exports = ReactGraph;