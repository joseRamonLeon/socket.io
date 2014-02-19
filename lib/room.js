/**
 * Module dependencies.
 */
var Socket = require('./socket');
var Emitter = require('events').EventEmitter;
var parser = require('socket.io-parser');
var debug = require('debug')('socket.io:room');

/**
 * Reserved events.
 */
exports.events = [
  'connect',    // for symmetry with client
  'connection',
  'join',
  'leave',
  'destroy',
  'error',
  'newListener'
];

/**
 * `EventEmitter#emit` reference.
 */
var emit = Emitter.prototype.emit;

/**
 * Room constructor.
 *
 * @param {Server} socket.io relay server instance
 * @param {String} name
 * @api private
 */
function Room(id, owner, io) {
  this.id = id;
  this.io = io;
  this.owner = owner;
  this.sockets = [];
}

/**
 * Inherits from `EventEmitter`.
 */
Room.prototype.__proto__ = Emitter.prototype;

/**
 * -----------------
 * Room instance methods
 * called from the room on("create") callback itself
 * which trigger actions on it.
 * -----------------
 */

/**
 * Emits reserved events to listeners,
 * broadcasts others (which are messages) to all sockets
 * in the room.
 *
 * @return {Room} self
 * @api public
 */
Room.prototype.emit = function (ev) {
  if (~exports.events.indexOf(ev)) {
    // Reserved event - want to raise on the room
    // so it can execute a related callback.
    emit.apply(this, arguments);
  } else {
    // Delegate to existing function to emit message.
    // Need to .apply with the function arguments array.
    this.io.sockets.in(this.id).emit.apply(this, arguments);
  }
  return this;
};

/**
 * -----------------
 * Private Room "on" triggers
 * called internally
 * for the user-supplied on("foo", function (bar)) callbacks.
 * -----------------
 */

/**
 * Called upon a socket in the room getting an error.
 *
 * @param {Socket} socket
 * @param {String} error
 * @api private
 */
Room.prototype.onerror = function (socket, error) {
  debug('socket in room got error %s', error);
  this.emit('error', socket, error);
};

/**
 * Called upon a socket leaving the room.
 *
 * @param {Socket} socket
 * @param {String} reason
 * @api private
 */
Room.prototype.onleave = function (socket, reason) {
  debug('socket leaving room - reason %s', reason);
  
  var index = this.sockets.indexOf(socket);
  if (index !== -1) {
    delete this.sockets[index];
  }
  
  this.emit('leave', socket, reason);
};

/**
 * Called upon a socket joining the room.
 *
 * @param {Socket} socket
 * @api private
 */
Room.prototype.onjoin = function (socket) {
  debug('socket joining room - id %s', socket.id);
  this.sockets.push(socket);
  this.emit('join', socket);
};

/**
 * Called upon destroying a room.
 *
 * @api private
 */
Room.prototype.ondestroy = function () {
  debug('closing room');
  this.emit('destroy');
};

/**
 * Module exports.
 */
module.exports = exports = Room;