var http = require('http').Server;
var io = require('../..');
var request = require('supertest');
var expect = require('expect.js');
var sinon = require('sinon');
var client = require('../utilities').client;
var Socket = require('../../lib/socket');
var Namespace = require('../../lib/namespace');
  
describe('namespaces', function(){
  describe('default', function(){
    it('should be accessible through .sockets', function(){
      var sio = io();
      expect(sio.sockets).to.be.a(Namespace);
    });

    it('should be aliased', function(){
      var sio = io();
      expect(sio.use).to.be.a('function');
      expect(sio.to).to.be.a('function');
      expect(sio['in']).to.be.a('function');
      expect(sio.emit).to.be.a('function');
      expect(sio.send).to.be.a('function');
      expect(sio.write).to.be.a('function');
    });

    it('should automatically connect', function(done){
      var srv = http();
      var sio = io(srv);
      srv.listen(function(){
        var socket = client(srv);
        socket.on('connect', function(){
          done();
        });
      });
    });

    it('should fire a `connection` event', function(done){
      var srv = http();
      var sio = io(srv);
      srv.listen(function(){
        var socket = client(srv);
        sio.on('connection', function(socket){
          expect(socket).to.be.a(Socket);
          done();
        });
      });
    });

    it('should fire a `connect` event', function(done){
      var srv = http();
      var sio = io(srv);
      srv.listen(function(){
        var socket = client(srv);
        sio.on('connect', function(socket){
          expect(socket).to.be.a(Socket);
          done();
        });
      });
    });

    it('should work with many sockets', function(done){
      var srv = http();
      var sio = io(srv);
      srv.listen(function(){
        var chat = client(srv, '/chat');
        var news = client(srv, '/news');
        var total = 2;
        chat.on('connect', function(){
          --total || done();
        });
        news.on('connect', function(){
          --total || done();
        });
      });
    });

    it('should work with `of` and many sockets', function(done){
      var srv = http();
      var sio = io(srv);
      srv.listen(function(){
        var chat = client(srv, '/chat');
        var news = client(srv, '/news');
        var total = 2;
        sio.of('/news').on('connection', function(socket){
          expect(socket).to.be.a(Socket);
          --total || done();
        });
        sio.of('/news').on('connection', function(socket){
          expect(socket).to.be.a(Socket);
          --total || done();
        });
      });
    });

    it('should work with `of` second param', function(done){
      var srv = http();
      var sio = io(srv);
      srv.listen(function(){
        var chat = client(srv, '/chat');
        var news = client(srv, '/news');
        var total = 2;
        sio.of('/news', function(socket){
          expect(socket).to.be.a(Socket);
          --total || done();
        });
        sio.of('/news', function(socket){
          expect(socket).to.be.a(Socket);
          --total || done();
        });
      });
    });

    it('should disconnect upon transport disconnection', function(done){
      var srv = http();
      var sio = io(srv);
      srv.listen(function(){
        var chat = client(srv, '/chat');
        var news = client(srv, '/news');
        var total = 2;
        var totald = 2;
        var s;
        sio.of('/news', function(socket){
          socket.on('disconnect', function(reason){
            --totald || done();
          });
          --total || close();
        });
        sio.of('/chat', function(socket){
          s = socket;
          socket.on('disconnect', function(reason){
            --totald || done();
          });
          --total || close();
        });
        function close(){
          s.disconnect(true);
        }
      });
    });
  });
});

