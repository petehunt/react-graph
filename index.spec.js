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
      userSignup: function(email) {
        this.mutator()
          .addNode('user:' + email, {email: email}, 'user')
          .save();
      },

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
    }, {
      user: {
        sayHello: function() {
          return 'Hello, ' + this.data.email
        }
      }
    });

    var done = false;

    var heldGraph = new UpdatableHolder(
      myGraph,
      [
        function(graph) {
          graph.userSignup('floydophone');
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
          expect(graph.getNode('user:floydophone').sayHello()).toBe('Hello, floydophone');
          done = true;
        }
      ]
    );
    expect(done).toBe(true);
  });
});