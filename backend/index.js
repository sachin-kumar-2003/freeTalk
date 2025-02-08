const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const UserManager = require('./userManger/UserManager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const userManager = new UserManager();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  userManager.addUser("randomName", socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    userManager.removeUser(socket.id);
  });
});

server.listen(3000, () => {
  console.log('Listening on port 3000');
});
