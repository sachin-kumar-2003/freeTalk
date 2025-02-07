class UserManager {
  constructor(roomManager) {
    this.GLOBAL_ROOM_ID = 0;
    this.users = [];
    this.queue = [];
    this.roomManager = roomManager;
  }

  addUser(name, socket) {
    this.users.push({ name, socket });
    this.queue.push(socket.id); // ✅ Add to queue for pairing
    socket.emit("lobby"); // ✅ Use emit instead of send
    this.clearQueue();
    this.initHandlers(socket);
  }

  removeUser(socketId) {
    this.users = this.users.filter(user => user.socket.id !== socketId);
    this.queue = this.queue.filter(id => id !== socketId);
  }

  clearQueue() {
    console.log("inside the clear queue")
    if (this.queue.length < 2) {
      return;
    }

    const userId1 = this.queue.shift();
    const userId2 = this.queue.shift();
    const user1 = this.users.find(user => user.socket.id === userId1);
    const user2 = this.users.find(user => user.socket.id === userId2);

    if (user1 && user2) {
      const roomId = this.generate();
      user1.socket.emit('new-room', {
        type: "send-offer",
        roomId
      });
      console.log("creating room")
      console.log("romms id is ",roomId)
      
      

      user2.socket.emit('new-room', {
        type: "receive-offer",
        roomId
      });

      if (this.roomManager && typeof this.roomManager.createRoom === 'function') {
        this.roomManager.createRoom(user1, user2);
      }
    }
  }

  initHandlers(socket) {
    socket.on("offer", (data) => {
      if (this.roomManager && typeof this.roomManager.onOffer === 'function') {
        this.roomManager.onOffer(data.roomId, data.sdp);
      }
    });

    socket.on("answer", (data) => {
      if (this.roomManager && typeof this.roomManager.onAnswer === 'function') {
        this.roomManager.onAnswer(data.roomId, data.sdp);
      }
    });
  }

  generate() {
    return this.GLOBAL_ROOM_ID++;
  }
}

module.exports = UserManager;
