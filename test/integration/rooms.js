var http = require('http').Server;
var io = require('..');
var ioc = require('socket.io-client');
var request = require('supertest');
var expect = require('expect.js');
var Socket = require('../lib/socket');
var Room = require('../lib/room');

// creates a socket.io client for the given server
function client(srv, nsp, opts){
  if ('object' == typeof nsp) {
    opts = nsp;
    nsp = null;
  }
  var addr = srv.address();
  if (!addr) addr = srv.listen().address();
  var url = 'ws://' + addr.address + ':' + addr.port + (nsp || '');
  return ioc(url, opts);
}

describe('socket.io', function () {
  describe('rooms', function () {
    
    describe('default namespace', function () {
      it('should be accessible through .rooms', function () {
        var sio = io();
        expect(sio.rooms).to.be.a(??);
      });

      it('should fire a `create` event when created', function(done){
        var srv = http();
        var sio = io(srv);
        srv.listen(function(){
          var socket = client(srv);
          sio.rooms.on('create', function(room){
            expect(room).to.be.a(Room);
            done();
          });
        });
      });
      
      it('should fire a `destroy` event when destroyed', function(done){
        var srv = http();
        var sio = io(srv);
        var roomId = '123';
        
        srv.listen(function(){
          var client = client(srv);
          
          // Set up rooms callback
          sio.rooms.on('create', function(room){
            // Finish when this happens
            room.on('destroy', function () {
              done();
            });
          });
          
          // Connect and disconnect a socket
          client.on('connect', function (socket) {
            // Join the room, thus creating it
            socket.join(roomId);
            
            // Leave it - last one out triggers destruction
            socket.leave(roomId);
          });
        });
      });

      it('can initiate its own messages to all its sockets', function (done) {
        var srv = http();
        var sio = io(srv);
        var roomId = '123';
        
        srv.listen(function () {
          // Create some network clients
          var client = client(srv);
        
          // Get room to say something of its own accord
          sio.rooms.on('create', function (room) {
            room.send('ping');
          });
          
          // We are done when we receive the event
          client.on('message', function (data) {
            done();
          });
          
          // Connect a single client, listen for response          
          client.on('connect', function (socket) {
            socket.join(roomId);
          });
        });
      });

      it('should have many sockets', function(done){
        var srv = http();
        var sio = io(srv);
        var roomId = '123';
        
        srv.listen(function () {
          // Create some network clients
          var clients = [client(srv), client(srv)];
        
          // Set up room callback
          sio.rooms.on('create', function (room) {
            room.on('join', function () {
              // Stop once all our clients have connected
              var isRightRoom = (room.id === roomId);
              var allConnected = (room.sockets.length === clients.length);
              if (isRightRoom && allConnected) {
                done();
              }
            });
          });
          
          // Then connect the clients
          clients.forEach(function (client) {          
            client.on('connect', function (socket) {
              socket.join(roomId);
            });
          });
        });
      });
    });
  });
}):