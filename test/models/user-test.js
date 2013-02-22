/*
 * user-test.js Tests the User Model
 */

var should = require('should'),
    redis = require('redis'),
    events = require('events').EventEmitter,
    conn = redis.createClient();

var eventEmitter = new events(),
    User = require('../../lib/models/user')(eventEmitter);

beforeEach(function(done) {
  conn.FLUSHDB(done);
});


describe('sanitize', function() {
  var obj;

  beforeEach(function(done) {
    User.create({name: 'Bob'}, function(err, user) {
      if(err) return done(err);
      obj = user;
      done();
    });
  });

  describe('on .create()', function() {
    it('should lowercase name on create', function() {
      obj.name.should.equal('bob');
    });
  });

  describe('on .update()', function() {
    it('should lowercase name on update', function(done) {
      obj.update({name: 'Mike'}, function(err, u) {
        should.not.exist(err);
        u.name.should.equal('mike');
        done();
      });
    });
  });
});

/* Hooks */

describe('hooks', function() {

  beforeEach(function(done) {
    User.create({name: 'Bob'}, function(err, user) {
      if(err) return done(err);
      done();
    });
  });

  it('should check uniqueness of name on .create()', function(done) {
    User.create({name: 'Bob'}, function(err, obj) {
      should.exist(err);
      err.should.be.an.instanceof(Error);
      done();
    });
  });

  it('should check uniqueness of name on .save()', function(done) {
    User.create({name: 'Suzy'}, function(err, obj) {
      obj.name = "Bob";
      obj.save(function(err, user) {
        should.exist(err);
        err.should.be.an.instanceof(Error);
        done();
      });
    });
  });

  it('should check uniqueness of name on .update()', function(done) {
    User.create({name: 'Suzy'}, function(err, obj) {
      obj.update({ name: 'Bob' }, function(err) {
        should.exist(err);
        err.should.be.an.instanceof(Error);
        done();
      });
    });
  });

  it('should return successfully on non-validated properties', function(done) {
    User.create({name: 'Suzy'}, function(err, obj) {
      obj.update({ location: 'office' }, function(err, instance) {
        should.not.exist(err);
        instance.should.be.an.instanceof(User);
        done();
      });
    });
  });

});
