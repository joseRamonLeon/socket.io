var http = require('http').Server;
var sio = require('../..');
var request = require('supertest');
var expect = require('expect.js');
var sinon = require('sinon');
var Socket = require('../../lib/socket');

/* The System Under Test */
var Room = require('../../lib/room');
    
/*
 * Room unit tests
 */
describe('room', function() {
  var sandbox;
  
  // Commonly used room dependencies
  var id, srv, owner, r;
    
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    
    id = '123';
    srv = sandbox.mock(sio);
    // createStubInstance does not support __defineGetter__
    owner = { id: '345' };
    r = new Room(id, owner, srv);
  });
  
  afterEach(function () {
    sandbox.restore();
  });
  
  it('should initialize its instance variables', function (done) { 
    // Does it store room ID
    expect(r.id).to.be(id);
    
    // Does it store the owner
    expect(r.owner).to.be(owner);
    
    // Is the owner in the list of sockets
    expect(r.sockets).to.contain(owner);
    
    done();
  });
  
  it('should emit an error when onerror called', function (done) {
    // Mock room deps
    var badSocket = { id: '456' };
    var errorText = '456';
        
    // Stub the signal
    var method = sandbox.stub(r.on.error, 'dispatch');
    
    // Execute
    r.onerror(badSocket, errorText);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, badSocket, errorText);
    
    done();
  });
  
  it('should emit a join event when onjoin called', function (done) {
    // Mock room deps
    var joinedSocket = { id: '456' };
    
    // Stub the signal
    var method = sandbox.stub(r.on.join, 'dispatch');
    
    // Execute
    r.onjoin(joinedSocket);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, joinedSocket);
    
    done();
  });
  
  it('should add joining socket to list when onjoin called', function (done) {
    // Mock room deps
    var joinedSocket = { id: '456' };
    
    // Stub the signal
    var method = sandbox.stub(r.on.join, 'dispatch');
    
    // Execute
    r.onjoin(joinedSocket);
    
    // Does it contain the new socket?
    expect(r.sockets).to.contain(joinedSocket);
    
    done();
  });
  
  it('should emit a leave event when onleave called', function (done) {
    // Mock room deps
    var leavingSocket = { id: '456' };
    var text = 'aoeu';
    
    // Tack on the extra socket to the list
    // (not the normal way to do this,
    // but this is just a unit test)
    r.sockets.push(leavingSocket);
    
    // Stub the signal
    var method = sandbox.stub(r.on.leave, 'dispatch');
    
    // Execute
    r.onleave(leavingSocket, text);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, leavingSocket, text);
    
    done();
  });
  
  it('should remove leaving socket from list when onleave called', function (done) {
    // Mock room deps
    var leavingSocket = { id: '456' };
    
    // Tack on the extra socket to the list
    // (not the normal way to do this,
    // but this is just a unit test)
    r.sockets.push(leavingSocket);
    
    // Stub the signal
    var method = sandbox.stub(r.on.leave, 'dispatch');
    
    // Execute
    r.onleave(leavingSocket);
    
    // Does it contain the old socket?
    expect(r.sockets).not.to.contain(leavingSocket);
    
    done();
  });
  
  it('should send messages', function (done) {
    // Mock room deps
    var eventName = 'message';
    var data = 'hello';
    
    // Stub the delegated sender function
    var method = sandbox.stub(srv.sockets.in(id), 'emit');
    
    // Execute
    r.emit(eventName, data);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, eventName, data);
    
    done();
  });
});