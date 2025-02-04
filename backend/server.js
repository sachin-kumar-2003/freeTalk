const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (update in production)
    methods: ["GET", "POST"],
  },
});

app.use(cors());

let queue = []; // Queue to store waiting users
let users = {}; // Store user socket IDs and their partners

io.on("connection", (socket) => {
  console.log("New user connected: ", socket.id);

  // Add user to queue
  socket.on("find_pair", () => {
    console.log(`User ${socket.id} is looking for a pair...`);
    if (queue.length > 0) {
      const partner = queue.shift(); // Get the first waiting user
      users[socket.id] = partner;
      users[partner] = socket.id;

      console.log(`Match found: ${socket.id} <-> ${partner}`);
      io.to(socket.id).emit("match_found", { partnerId: partner });
      io.to(partner).emit("match_found", { partnerId: socket.id });
    } else {
      queue.push(socket.id);
      console.log(`User ${socket.id} added to queue. Waiting for a partner...`);
    }
  });

  // Handle WebRTC signaling
  socket.on("offer", (data) => {
    console.log(`Offer received from ${socket.id} to ${data.partnerId}`);
    io.to(data.partnerId).emit("offer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("answer", (data) => {
    console.log(`Answer received from ${socket.id} to ${data.partnerId}`);
    io.to(data.partnerId).emit("answer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    console.log(`ICE candidate received from ${socket.id} to ${data.partnerId}`);
    io.to(data.partnerId).emit("ice-candidate", data);
  });

  // Handle text messages
  socket.on("send_message", (data) => {
    console.log(`Message received from ${socket.id} to ${data.partnerId}`);
    io.to(data.partnerId).emit("receive_message", { message: data.message, from: socket.id });
  });

  // Handle user leaving the call
  socket.on("leave_call", (data) => {
    console.log(`User ${socket.id} is leaving the call...`);
    const partnerId = users[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("partner_left");
      delete users[partnerId];
    }
    delete users[socket.id];
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
    const partnerId = users[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("partner_left");
      delete users[partnerId];
    }
    queue = queue.filter((id) => id !== socket.id);
    delete users[socket.id];
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});