Socket.IO Chat
==============

A server-side demo of the room handler callback.

### Quickstart
```
$ npm install
$ node app
```

### Features
Ever had to do a significant amount of work operating at the room level, but got frustrated when you only had sockets to work with? This feature's for you...
- Access a first-class room object in the function callback.
- Get the room ID and sockets in the room as natural properties of the room.
- Listen to room-specific events at the room level, including 'join' and 'leave' when sockets come and go, and 'destroy' when the room is eventually closed down.
- Easily set and get custom properties of the room itself right on the room object (note: this does not scale beyond a single server using the default in-memory backend).
- Easily attach listeners for custom events raised on the room's sockets with `room.on("some socket event", [function])`, as they automatically bubble up to each room they are participating in.
