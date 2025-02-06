export class UserManager {
  constructor(roomManager) {
    this.GLOBAL_ROOM_ID = 0;
    this.users = [];
    this.queue = [];
    this.roomManager = roomManager; // Injecting RoomManager instance
  }

  addUser(name, socket) {
    this.users.push({ name, socket });
    this.clearQueue();
  }

  removeUser(socketId) {
    this.users = this.users.filter(user => user.socket.id !== socketId);
    this.queue = this.queue.filter(id => id !== socketId);
  }

  clearQueue() {
    if (this.queue.length < 2) {
      return;
    }

    const user1 = this.users.find(user => user.socket.id === this.queue.shift());
    const user2 = this.users.find(user => user.socket.id === this.queue.shift());

    if (user1 && user2) {
      const roomId = this.generate();
      user1.socket.emit('new-room', {
        type: "send-offer",
        roomId
      });

      user2.socket.emit('new-room', {
        type: "receive-offer",
        roomId
      });

      if (this.roomManager && typeof this.roomManager.createRoom === 'function') {
        const room = this.roomManager.createRoom(user1, user2);
      }
    }
  }

  generate() {
    return this.GLOBAL_ROOM_ID++;
  }
}
