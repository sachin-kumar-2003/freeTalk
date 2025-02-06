class RoomManager {
  constructor() {
    this.rooms = {};
  }

  createRoom(roomId) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = [];
      return `Room ${roomId} created.`;
    } else {
      return `Room ${roomId} already exists.`;
    }
  }

  deleteRoom(roomId) {
    if (this.rooms[roomId]) {
      delete this.rooms[roomId];
      return `Room ${roomId} deleted.`;
    } else {
      return `Room ${roomId} does not exist.`;
    }
  }

  addUserToRoom(roomId, userId) {
    if (this.rooms[roomId]) {
      if (!this.rooms[roomId].includes(userId)) {
        this.rooms[roomId].push(userId);
        return `User ${userId} added to room ${roomId}.`;
      } else {
        return `User ${userId} already in room ${roomId}.`;
      }
    } else {
      return `Room ${roomId} does not exist.`;
    }
  }

  removeUserFromRoom(roomId, userId) {
    if (this.rooms[roomId]) {
      const userIndex = this.rooms[roomId].indexOf(userId);
      if (userIndex !== -1) {
        this.rooms[roomId].splice(userIndex, 1);
        return `User ${userId} removed from room ${roomId}.`;
      } else {
        return `User ${userId} not found in room ${roomId}.`;
      }
    } else {
      return `Room ${roomId} does not exist.`;
    }
  }

  getUsersInRoom(roomId) {
    if (this.rooms[roomId]) {
      return this.rooms[roomId];
    } else {
      return `Room ${roomId} does not exist.`;
    }
  }
}

module.exports = RoomManager;