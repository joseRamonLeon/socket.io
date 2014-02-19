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
  it('should initialize its instance variables', function (done) {
    var id = '123';
    var srv = sinon.mock(http());
    var owner = sinon.mock(Socket);
    
    var r = new Room(id, owner, srv);
    
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
    var id = '123';
    var srv = sinon.mock(http());
    var owner = sinon.mock(Socket);
    var badSocket = sinon.mock(Socket);
    var errorText = '456';
    
    // Build isolated room
    var r = new Room(id, owner, srv);
    
    // Stub the 'emit' method
    var method = sinon.stub(r, 'emit');
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch('error', badSocket, errorText);
    
    // Execute
    r.onerror(badSocket, errorText);
    
    done();
  });
  
  it('should emit a join event when onjoin called', function (done) {
    // Mock room deps
    var id = '123';
    var srv = sinon.mock(http());
    var owner = sinon.mock(Socket);
    var joinedSocket = sinon.mock(Socket);
    
    // Build isolated room
    var r = new Room(id, owner, srv);
    
    // Stub the 'emit' method
    var method = sinon.stub(r, 'emit');
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, 'join', joinedSocket);
    
    // Execute
    r.onjoin(joinedSocket);
    
    done();
  });
  
  it('should add joining socket to list when onjoin called', function (done) {
    // Mock room deps
    var id = '123';
    var srv = sinon.mock(http());
    var owner = sinon.mock(Socket);
    var joinedSocket = sinon.mock(Socket);
    
    // Build isolated room
    var r = new Room(id, owner, srv);
    
    // Stub the 'emit' method
    var method = sinon.stub(r, 'emit');
    
    // Execute
    r.onjoin(joinedSocket);
    
    // Does it contain the new socket?
    expect(r.sockets).to.contain(joinedSocket);
    
    done();
  });
  
  it('should emit a leave event when onleave called', function (done) {
    // Mock room deps
    var id = '123';
    var srv = sinon.mock(http());
    var owner = sinon.mock(Socket);
    var leavingSocket = sinon.mock(Socket);
    var text = 'aoeu';
    
    // Build isolated room
    var r = new Room(id, owner, srv);
    
    // Tack on the extra socket to the list
    // (not the normal way to do this,
    // but this is just a unit test)
    r.sockets.push(leavingSocket);
    
    // Stub the 'emit' method
    var method = sinon.stub(r, 'emit');
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, 'leave', leavingSocket, text);
    
    // Execute
    r.onleave(leavingSocket, text);
    
    done();
  });
  
  it('should remove leaving socket from list when onleave called', function (done) {
    // Mock room deps
    var id = '123';
    var srv = sinon.mock(http());
    var owner = sinon.mock(Socket);
    var leavingSocket = sinon.mock(Socket);
    
    // Build isolated room
    var r = new Room(id, owner, srv);
    
    // Tack on the extra socket to the list
    // (not the normal way to do this,
    // but this is just a unit test)
    r.sockets.push(leavingSocket);
    
    // Stub the 'emit' method
    var method = sinon.stub(r.emit);
    
    // Execute
    r.onleave(leavingSocket);
    
    // Does it contain the old socket?
    expect(r.sockets).not.to.contain(joinedSocket);
    
    done();
  });
});