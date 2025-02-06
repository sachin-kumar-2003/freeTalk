import { User } from "./User.js";

let GLOBAL_ID = 1;

class RoomManager {
  constructor() {
    this.rooms = new Map(); // Using Map instead of an object
  }

  createRoom(user1, user2) {
    const roomId = this.generate(); // Fixed `generate()` method call

    this.rooms.set(roomId.toString(), {
      user1,
      user2,
    });

    user1.socket.emit("new-room", {
      type: "send-offer",
      roomId,
    });
  }

  onOffer(roomId, sdp) {
    const room = this.rooms.get(roomId.toString());
    if (room && room.user2) {
      room.user2.socket.emit("new-room", {
        type: "receive-offer",
        roomId,
        sdp, // Added sdp parameter
      });
    }
  }

  onAnswer(roomId, sdp) {
    const room = this.rooms.get(roomId.toString());
    if (room && room.user1) {
      room.user1.socket.emit("new-room", {
        type: "receive-answer",
        roomId,
        sdp, // Added sdp parameter
      });
    }
  }

  generate() {
    return GLOBAL_ID++;
  }
}

export default RoomManager;
