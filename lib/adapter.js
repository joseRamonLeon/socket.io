
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;

/**
 * Module exports.
 */

module.exports = Adapter;

/**
 * Memory adapter constructor.
 * Associates rooms with sockets in a namespace.
 *
 * Any 'free' sockets which are not
 * associated with rooms are stored in the
 * Namespace itself, not here.
 *
 * @param {Namespace} nsp
 * @api public
 */

function Adapter(nsp){
  this.nsp = nsp;

  /*
   * Now Rooms are a full-fledged class
   * containing their own lists of socket IDs
   * we need an array of Room instances.
   */
  this.roomObjects = [];
  
  /*
   * This associates room ID strings
   * to a list of socket IDs
   * which are in a room:
   * {
   *   'room123': {
   *     'socket123': true,
   *     'socket456': true
   *   }  
   * }
   */ 
  this.rooms = {};
  
  /*
   * Associates socket ID strings
   * to list of room IDs
   * which the socket is participating in:
   * {
   *   'socket123': {
   *     'room123': true,
   *     'room456': true
   *   }  
   * }
   */ 
  this.sids = {};
}

/**
 * Inherits from `EventEmitter`.
 */

Adapter.prototype.__proto__ = Emitter.prototype;

/**
 * Adds a socket to a room.
 *
 * @param {String} socket id
 * @param {String} room name
 * @param {Function} callback
 * @api public
 */

Adapter.prototype.add = function(id, room, fn){
  this.sids[id] = this.sids[id] || {};
  this.sids[id][room] = true;

  this.rooms[room] = this.rooms[room] || [];
  this.rooms[room][id] = true;

  // Find rooms with a matching ID
  // we can't use Array#find yet as that is in ES6.
  var existingRooms = this.roomObjects.filter(function (r) {
    r.id === room;
  });

  // There should not be more than one!
  var theRoom = existingRooms[0];

  if (theRoom) {
    // Now we have the room instance, add the socket
    // to its collection.
    theRoom.sockets[id] = true;

    // TODO trigger joining event
    theRoom.onjoin(id);
  } else {
    // Make new Room.
    // TODO with socket as owner.
    // TODO trigger io.rooms.on("create", ...) callback.
    this.roomObjects.push(new Room(room, id, ??));
  }

  if (fn) process.nextTick(fn.bind(null, null));
};

/**
 * Removes a socket from a room.
 *
 * @param {String} socket id
 * @param {String} room name
 * @param {Function} callback
 * @api public
 */

Adapter.prototype.del = function (id, room, fn) {
  this.sids[id] = this.sids[id] || {};
  this.rooms[room] = this.rooms[room] || {};

  delete this.sids[id][room];
  delete this.rooms[room][id];

  // Find rooms with a matching ID
  // we can't use Array#find yet as that is in ES6.
  var existingRooms = this.roomObjects.filter(function (r) {
    r.id === room;
  });

  // There should not be more than one!
  var theRoom = existingRooms[0];

  if (theRoom) {
    // Now we have the room instance, remove the socket
    // from its collection.
    delete theRoom.sockets[id];

    // TODO Trigger leave event
    theRoom.onleave(id);

    if (theRoom.sockets.length === 0) {
      // Destroy the room when all sockets gone.
      theRoom.ondestroy();

      // TODO remove room itself from dual associative arrays??
    }
  }

  if (fn) process.nextTick(fn.bind(null, null));
};

/**
 * Removes a socket from all rooms it's joined.
 *
 * @param {String} socket id
 * @api public
 */

Adapter.prototype.delAll = function(id, fn){
  var rooms = this.sids[id];
  if (rooms) {
    for (var room in rooms) {
      // TODO delegate to the `del` function instead.
      delete this.rooms[room][id];
    }
  }
  delete this.sids[id];
};

/**
 * Broadcasts a packet.
 *
 * Options:
 *  - `flags` {Object} flags for this packet
 *  - `except` {Array} sids that should be excluded
 *  - `rooms` {Array} list of rooms to broadcast to
 *
 * @param {Object} packet object
 * @api public
 */

Adapter.prototype.broadcast = function(packet, opts){
  var rooms = opts.rooms || [];
  var except = opts.except || [];
  var ids = {};
  var socket;

  if (rooms.length) {
    for (var i = 0; i < rooms.length; i++) {
      var room = this.rooms[rooms[i]];
      if (!room) continue;
      for (var id in room) {
        if (ids[id] || ~except.indexOf(id)) continue;
        socket = this.nsp.connected[id];
        if (socket) {
          socket.packet(packet);
          ids[id] = true;
        }
      }
    }
  } else {
    for (var id in this.sids) {
      if (~except.indexOf(id)) continue;
      socket = this.nsp.connected[id];
      if (socket) socket.packet(packet);
    }
  }
};
