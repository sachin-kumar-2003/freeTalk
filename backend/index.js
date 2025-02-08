const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"] }));
app.use(express.json());
app.use(express.static('public'));

const UserManager = require('./userManger/UserManager');
const userManager = new UserManager(); // Create an instance of UserManager

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  userManager.addUser(socket.id, socket); 

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    userManager.removeUser(socket.id); 
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
