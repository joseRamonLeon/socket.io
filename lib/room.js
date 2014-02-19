/**
 * Module dependencies.
 */
var Socket = require('./socket');
var debug = require('debug')('socket.io:room');
var Signal = require('signals');

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
  this.sockets = [owner];
  this.on = {
    join: new Signal(),
    leave: new Signal(),
    destroy: new Signal(),
    error: new Signal(),
    // All messages from individual sockets.
    message: new Signal()
  };
}

/**
 * -----------------
 * Room instance methods
 * called from the room on("create") callback itself
 * which trigger actions on it.
 * -----------------
 */

/**
 * Broadcasts messages to all sockets
 * in the room.
 *
 * @return {Room} self
 * @api public
 */
Room.prototype.emit = function (ev) {
  // Delegate to existing function to emit message.
  // Need to .apply with the function arguments array.
  this.io.sockets.in(this.id).emit.apply(this, arguments);
  
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
  this.on.error.dispatch(socket, error);
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
  
  this.on.leave.dispatch(socket, reason);
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
  this.on.join.dispatch(socket);
};

/**
 * Called upon destroying a room.
 *
 * @api private
 */
Room.prototype.ondestroy = function () {
  debug('closing room');
  this.on.destroy.dispatch();
};

/**
 * Module exports.
 */
module.exports = exports = Room;