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