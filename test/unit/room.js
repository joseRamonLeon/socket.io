var http = require('http').Server;
var sio = require('../..');
var request = require('supertest');
var expect = require('expect.js');
var sinon = require('sinon');
var Socket = require('../../lib/socket');
var Namespace = require('../../lib/namespace');

/* The System Under Test */
var Room = require('../../lib/room');
    
/*
 * Room unit tests
 */
describe('room', function() {
  var sandbox;
  
  // Commonly used room dependencies
  var id, srv, owner, nsp, clientsArray, r;
    
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    
    id = '123';
    nsp = '';
    // createStubInstance does not support __defineGetter__
    owner = { id: '345' };
    clientsArray = [owner];
    srv = {
      clients: function () {},
      in: function () {
        return {
          emit: function () {}
        };
      }
    };
    sandbox.stub(srv, "clients", function () {
      return clientsArray;
    });
    
    r = new Room(id, srv);
  });
  
  afterEach(function () {
    sandbox.restore();
  });
  
  it('should initialize its instance variables', function (done) { 
    // Does it store room ID
    expect(r.id).to.be(id);
    
    // Is the owner in the list of sockets
    expect(r.sockets).to.contain(owner);
    
    done();
  });
  
  it('should emit an error when onerror called', function (done) {
    // Mock room deps
    var badSocket = { id: '456' };
    var errorText = '456';
    
    // Stub the 'emit' method
    var method = sandbox.stub(r, 'emit');
    
    // Execute
    r.onerror(badSocket, errorText);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, 'error', badSocket, errorText);
    
    done();
  });
  
  it('should emit a join event when onjoin called', function (done) {
    // Mock room deps
    var joinedSocket = { id: '456' };

    // Stub the 'emit' method
    var method = sandbox.stub(r, 'emit');
        
    // Execute
    r.onjoin(joinedSocket);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, 'join', joinedSocket);

    done();
  });
  
  it('should know of the joining socket when onjoin called', function (done) {
    // Mock room deps
    var joinedSocket = { id: '456' };
    clientsArray.push(joinedSocket);
    
    // Stub the 'emit' method
    var method = sandbox.stub(r, 'emit');
    
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
        
    // Stub the 'emit' method
    var method = sandbox.stub(r, 'emit');
    
    // Execute
    r.onleave(leavingSocket, text);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, 'leave', leavingSocket, text);
    
    done();
  });
  
  it('should remove leaving socket from list when onleave called', function (done) {
    // Mock room deps
    var leavingSocket = { id: '456' };
    
    // Stub the 'emit' method
    var method = sandbox.stub(r, 'emit');
    
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
    var namesp = srv.in(id);
    var method = sandbox.stub(namesp, 'emit');
    
    // Execute
    r.emit(eventName, data);
    
    // Stub assertions
    sinon.assert.calledOnce(method);
    sinon.assert.calledWithMatch(method, eventName, data);
    
    done();
  });
});