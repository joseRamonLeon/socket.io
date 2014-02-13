/**
 * Module dependencies.
 */
var Socket = require('./socket');
var Emitter = require('events').EventEmitter;
var parser = require('socket.io-parser');
var debug = require('debug')('socket.io:room');

/**
 * Module exports.
 */
module.exports = exports = Room;

/**
 * Blacklisted events.
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
 * Flags.
 */
exports.flags = ['json'];

/**
 * `EventEmitter#emit` reference.
 */
var emit = Emitter.prototype.emit;

/**
 * Room constructor.
 *
 * @param {Server} server instance
 * @param {Socket} name
 * @api private
 */
function Room(server, name){
  this.name = name;
  this.server = server;
  this.adapter = new (server.adapter())(this);
  this.sockets = [];
  this.connected = {};
  this.fns = [];
  this.ids = 0;
  this.acks = {};
}

/**
 * Inherits from `EventEmitter`.
 */
Room.prototype.__proto__ = Emitter.prototype;

/**
 * Apply flags from `Socket`.
 */
exports.flags.forEach(function(flag){
  Room.prototype.__defineGetter__(flag, function(){
    this.flags = this.flags || {};
    this.flags[flag] = true;
    return this;
  });
});

/**
 * Sets up room middleware.
 *
 * @return {Room} self
 * @api public
 */
Room.prototype.use = function(fn){
  this.fns.push(fn);
  return this;
};

/**
 * Executes the middleware for an incoming client.
 *
 * @param {Socket} socket that will get added
 * @param {Function} last fn call in the middleware
 * @api private
 */
Room.prototype.run = function(socket, fn){
  var fns = this.fns.slice(0);
  if (!fns.length) return fn(null);

  function run(i){
    fns[i](socket, function(err){
      // upon error, short-circuit
      if (err) return fn(err);

      // if no middleware left, summon callback
      if (!fns[i + 1]) return fn(null);

      // go on to next
      run(i + 1);
    });
  }

  run(0);
};

/**
 * -----------------
 * Room instance methods
 * called from the room on("create") callback itself
 * which trigger actions on it.
 * -----------------
 */

/**
 * Adds a new client.
 *
 * @return {Socket}
 * @api private
 */
Room.prototype.add = function(client, fn){
  debug('adding socket to room %s', this.name);
  var socket = new Socket(this, client);
  var self = this;
  this.run(socket, function(err){
    process.nextTick(function(){
      if ('open' == client.conn.readyState) {
        if (err) return socket.error(err.data || err.message);

        // track socket
        self.sockets.push(socket);

        // it's paramount that the internal `onconnect` logic
        // fires before user-set events to prevent state order
        // violations (such as a disconnection before the connection
        // logic is complete)
        socket.onconnect();
        if (fn) fn();

        // fire user-set event
        self.emit('join', socket);
      } else {
        debug('next called after client was closed - ignoring socket');
      }
    });
  });
  return socket;
};

/**
 * Removes a client. Called by each `Socket`.
 *
 * @api private
 */
Room.prototype.remove = function(socket){
  var i = this.sockets.indexOf(socket);
  if (~i) {
    this.sockets.splice(i, 1);
    
    // Fire user-set event
    self.emit('leave', i);
  } else {
    debug('ignoring remove for %s', socket.id);
  }
};

/**
 * Emits to all clients.
 *
 * @return {Room} self
 * @api public
 */
Room.prototype.emit = function(ev){
  if (~exports.events.indexOf(ev)) {
    emit.apply(this, arguments);
  } else {
    // set up packet object
    var args = Array.prototype.slice.call(arguments);
    var packet = { type: parser.EVENT, data: args };

    if ('function' == typeof args[args.length - 1]) {
      throw new Error('Callbacks are not supported when broadcasting');
    }

    this.adapter.broadcast(packet, {
      rooms: [this.name],
      flags: this.flags
    });

    delete this.flags;
  }
  return this;
};

/**
 * Sends a `message` event to all clients.
 *
 * @return {Room} self
 * @api public
 */
Room.prototype.send =
Room.prototype.write = function(){
  var args = Array.prototype.slice.call(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};

/**
 * -----------------
 * Private Room "on" callbacks
 * called by sockets
 * which trigger user-supplied on("foo", function (bar)) fns.
 * -----------------
 */

/**
 * Called upon a socket in the room getting an error.
 *
 * @param {Socket} socket
 * @param {String} error
 * @api private
 */
Room.prototype.onerror = function(socket, error){
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
Room.prototype.onleave = function(socket, reason){
  debug('socket leaving room - reason %s', reason);
  this.emit('leave', socket, reason);
};

/**
 * Called upon a socket joining the room.
 *
 * @param {Socket} socket
 * @api private
 */
Room.prototype.onjoin = function(socket){
  debug('socket joining room - id %s', socket.id);
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
