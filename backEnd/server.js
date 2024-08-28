const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");

const socketIO = require("socket.io");
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: "http://localhost:8081",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "http://localhost:8081", methods: ["POST", "GET"] }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("createRoom", (roomName, callback) => {
    const roomId = Date.now().toString();
    const room = {
      id: roomId,
      name: roomName,
      users: new Map(),
      messages: [],
      guestRequests: [],
      streams: new Map(),
      isStreaming: false, // Add streaming status
      acceptedGuestRequests: new Map(),
      creatorId: socket.id,
      moderators: new Set([socket.id]),
    };
    rooms.set(roomId, room);
    callback({
      id: roomId,
      name: roomName,
      creatorId: socket.id,
      moderators: Array.from(room.moderators),
    });
    io.emit("roomsUpdated", Array.from(rooms.entries()));
  });

  socket.on("joinRoom", (roomId) => {
    const userId = socket.id;
    const room = rooms.get(roomId);
    if (room) {
      room.users.set(userId, { id: userId });
      socket.join(roomId);
      io.to(roomId).emit("roomUsers", {
        users: Array.from(room.users.values()),
        creatorId: room.creatorId,
        moderators: Array.from(room.moderators),
      });
      socket.broadcast.to(roomId).emit("event", {
        type: "join",
        from: socket.id,
        role: socket.handshake,
      });
    }

    socket.on("event", (evt) => {
      console.log("a signaling event was sent:", JSON.stringify(evt.type));
      io.sockets.sockets.get(evt.to).emit("event", evt);
    });
  });

  socket.on("getRooms", () => {
    io.emit("roomsUpdated", Array.from(rooms.entries()));
  });

  // gust to host sent the Request

  socket.on("requestToJoin", ({ roomId, userId }, callback) => {
    console.log("requestToJoin", roomId, userId);
    const room = rooms.get(roomId);
    if (!room) {
      return callback({ success: false, message: "Room not found" });
    }

    room.guestRequests.push({ userId });
    io.to(room.creatorId).emit("guestJoinRequest", { userId });
    callback({ success: true, message: "Request sent to the host" });
  });

  socket.on("respondToJoinRequest", ({ roomId, userId, accept }, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      return callback({ success: false, message: "Room not found" });
    }

    const requestIndex = room.guestRequests.findIndex(
      (req) => req.userId === userId
    );
    if (requestIndex === -1) {
      return callback({ success: false, message: "Request not found" });
    }

    if (accept === true) {
      const guestDetails = room.guestRequests[requestIndex].guestDetails;
      room.acceptedGuestRequests.set(userId, guestDetails);
      room.guestRequests.splice(requestIndex, 1);
      io.to(userId).emit("joinRequestAccepted", { roomId });
      callback({ success: true, message: "Guest accepted" });
    }

    if (accept == false) {
      room.guestRequests.splice(requestIndex, 1);
      io.to(userId).emit("joinRequestRejected", { roomId });
      callback({ success: true, message: "Guest rejected" });
    }

    // Emit updated guest request list to the host
    io.to(room.creatorId).emit("updateGuestRequests", room.guestRequests);
  });

  socket.on("leaveRoom", (roomId) => {
    const userId = socket.id;
    const room = rooms.get(roomId);
    if (room && room.users.has(userId)) {
      room.users.delete(userId);
      socket.leave(roomId);
      io.to(roomId).emit("roomUsers", {
        users: Array.from(room.users.values()),
        creatorId: room.creatorId,
        moderators: Array.from(room.moderators),
      });
    }
  });

  socket.on("message", ({ roomId, message }) => {
    const userId = socket.id;
    const room = rooms.get(roomId);
    if (room) {
      const msg = { username: `User${userId}`, message };
      room.messages.push(msg);
      io.to(roomId).emit("message", msg);
    }
  });

  socket.on("closeRoom", (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.creatorId === socket.id) {
      rooms.delete(roomId);
      io.emit("roomsUpdated", Array.from(rooms.entries()));
    }
  });

  socket.on("addModerator", (roomId, userId) => {
    const room = rooms.get(roomId);
    if (room && room.creatorId === socket.id) {
      room.moderators.add(userId);
      io.to(roomId).emit("roomUsers", {
        users: Array.from(room.users.values()),
        creatorId: room.creatorId,
        moderators: Array.from(room.moderators),
      });
    }
  });

  socket.on("removeModerator", (roomId, userId) => {
    const room = rooms.get(roomId);
    if (room && room.creatorId === socket.id) {
      room.moderators.delete(userId);
      io.to(roomId).emit("roomUsers", {
        users: Array.from(room.users.values()),
        creatorId: room.creatorId,
        moderators: Array.from(room.moderators),
      });
    }
  });

  socket.on("kickUser", (roomId, userId) => {
    const room = rooms.get(roomId);
    if (
      room &&
      (room.creatorId === socket.id || room.moderators.has(socket.id))
    ) {
      if (userId !== room.creatorId) {
        room.users.delete(userId);
        io.to(userId).emit("kicked", roomId);
        socket.to(roomId).emit("roomUsers", {
          users: Array.from(room.users.values()),
          creatorId: room.creatorId,
          moderators: Array.from(room.moderators),
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        io.to(roomId).emit("roomUsers", {
          users: Array.from(room.users.values()),
          creatorId: room.creatorId,
          moderators: Array.from(room.moderators),
        });
      }
    });
  });
});

server.listen(4000, () => {
  console.log("Server is running on http://localhost:3000");
});
