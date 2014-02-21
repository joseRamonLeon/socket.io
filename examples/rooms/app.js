// Use the standalone server
var io = require('../..')();
var port = process.env.PORT || 8000;

io.rooms.on("create", function (room) {
  // ID is available
  console.log("Room ID", room.id);

  // Instance variables belonging to the room context can just be set in the callback.
  // NOTE: not scalable across multiple servers (yet).
  var someSharedVar = "foo";

  room.on("join", function (socket) {
    // tell all sockets in the room that a new socket joined
    room.emit("ohai", socket.id);
    
    // A little sugar for easy access to socket objects in the room
    console.log("There are now this many sockets in the room", room.sockets.length);
  });

  room.on("leave", function (socket) {
    // a socket left
    room.emit("bye", socket.id);
  });

  // Room cleanup automatically fires when the standard
  // socket.io room manager decides a room should die.
  room.on("destroy", function () {
    console.log("Room destroyed", room.id);
  });

  room.on("some custom socket event", function (data, socket) {
    // Whenever a socket receives data through a non-reserved event
    // it will be passed on to each room it is in
    // through a callback like this.

    // The socket object is included in this callback so we know whodunnit.
    console.log("Socket raised an event", socket.id);
    console.log("Payload received", data);
  });

});

io.listen(port);