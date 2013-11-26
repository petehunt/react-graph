var index = require('./index');

describe('makeObjectUpdatable', function() {
  it('should work', function() {
    function MyObj(name) {
      this.name = name;
      this.count = 0;
    }
    MyObj.prototype.sayHello = function() {
      return 'Hello ' + this.name + '! The count is ' + this.count;
    };
    MyObj.prototype.incr = function() {
      this._update({count: this.count + 1});
    };

    var o = new MyObj('pete');
    var u = index.makeObjectUpdatable(o);
    var next = null;
    var prev = null;

    u.addUpdateListener(function(next_, prev_) {
      next = next_;
      prev = prev_;
    });

    expect(o.sayHello()).toBe('Hello pete! The count is 0');
    expect(u.sayHello()).toBe('Hello pete! The count is 0');

    u.incr();
    expect(o.sayHello()).toBe('Hello pete! The count is 0');
    expect(u.sayHello()).toBe('Hello pete! The count is 0');

    expect(prev).toBe(u);
    expect(next.sayHello()).toBe('Hello pete! The count is 1');

    expect(u.incr.bind(u)).toThrow('Invariant Violation: _update(): Updatable was already updated. You can only update once.');
  });
});

function UpdatableHolder(updatable, pipeline) {
  this.updatable = null;
  this.pipeline = pipeline
  this.step = 0;
  this.onUpdate(updatable);
}

UpdatableHolder.prototype.onUpdate = function(newUpdatable) {
  this.updatable = newUpdatable;
  this.updatable.addUpdateListener(this.onUpdate.bind(this));
  if (this.step < this.pipeline.length) {
    this.pipeline[this.step++](this.updatable);
  }
};

describe('Graph', function() {
  it('should work', function() {
    var myGraph = index.createGraph({
      getPagesUserLikes: function(email) {
        return this.getNodesByEdgeType('user:' + email, 'like').map(function(page) {
          return page.name;
        });
      },

      // mutation
      pageSignup: function(pageID, pageName) {
        this.mutator()
          .addNode('page:' + pageID, {name: pageName})
          .save();
      },

      userLikesPage: function(email, pageID) {
        this.mutator()
          .addEdge('user:' + email, 'page:' + pageID, 'like')
          .save();
      }
    });

    var done = false;

    var heldGraph = new UpdatableHolder(
      myGraph,
      [
        function(graph) {
          graph.mutator().addNode('user:floydophone', {email: 'floydophone'}).save();
        },
        function(graph) {
          graph.pageSignup('mypage', 'my cool page');
        },
        function(graph) {
          expect(graph.getPagesUserLikes('floydophone').length).toBe(0);
          graph.userLikesPage('floydophone', 'mypage');
        },
        function(graph) {
          expect(graph.getPagesUserLikes('floydophone')).toEqual([
            'my cool page'
          ]);
          done = true;
        }
      ]
    );
    expect(done).toBe(true);
  });
});

describe('react-graph', function() {
  it('should work', function() {
    var Facebook = index.createDomain();
    var User = Facebook.createNodeType({
      static: {
        signUp: function(graph, email, fullName) {
          graph.mutator()
            .addNode(User({email: email, fullName: fullName}, graph));
        },

        getByEmail: function(graph, email) {
          return graph.getNode('user:' + email);
        }
      },

      getKey: function() {
        return 'user:' + this.data.email;
      },

      getGreeting: function() {
        return 'Hello, ' + this.data.fullName + '!';
      },

      likePage: function(page) {
        this.graph.mutator()
          .addEdge(this, page, Liked);
      },

      getPageTitlesLiked: function() {
        return this.getNodesByEdgeType(Liked).map(function(node) {
          return node.getPageTitle();
        });
      }
    });

    var Page = Facebook.createNodeType({
      static: {
        register: function(graph, pageID, title) {
          graph.mutator()
            .addNode(Page({pageID: pageID, title: title}, graph));
        },

        getByID: function(graph, pageID) {
          return graph.getNode('page:' + pageID);
        }
      },

      getKey: function() {
        return 'page:' + this.data.pageID;
      },

      getPageTitle: function() {
        return this.data.title;
      }
    });

    var Liked = Facebook.createEdgeType({
      fromNodeType: User,
      toNodeType: Page
    });

    var rawGraph = index.createGraph();

    var ran = false;

    var heldGraph = new UpdatableHolder(
      rawGraph,
      [
        function(rawGraph) {
          var myGraph = Facebook.createGraph(rawGraph);
          User.signUp(myGraph, 'floydophone');
          Page.register(myGraph, 'page1', 'test page');
          myGraph.save();
        },
        function(rawGraph) {
          var myGraph = Facebook.createGraph(rawGraph);
          var page = Page.getByID(myGraph, 'page1');
          User.getByEmail(myGraph, 'floydophone').likePage(page);
          myGraph.save();
        },
        function(rawGraph) {
          var myGraph = Facebook.createGraph(rawGraph);
          expect(
            User.getByEmail(myGraph, 'floydophone').getPageTitlesLiked()
          ).toEqual(['test page']);
          ran = true;
        }
      ]
    );
    expect(ran).toBe(true);
  });
});