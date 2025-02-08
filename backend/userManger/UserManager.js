const { socket } = require("socket.io");
const RoomManager = require("./RoomManager");

class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name, socket) {
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    }

    removeUser(socketId) {
        this.users = this.users.filter(user => user.socket.id !== socketId);
        this.queue = this.queue.filter(id => id !== socketId);
    }

    clearQueue() {
        console.log("Inside clearQueue");
        console.log("Queue length:", this.queue.length);

        if (this.queue.length < 2) {
            return;
        }

        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        console.log(`Pairing users: ${id1} and ${id2}`);

        const user1 = this.users.find(user => user.socket.id === id1);
        const user2 = this.users.find(user => user.socket.id === id2);

        if (!user1 || !user2) {
            console.warn("Pairing failed: One or both users not found.");
            return;
        }

        console.log("Creating room...");
        this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }

    initHandlers(socket) {
        socket.on("offer", ({ sdp, roomId }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer", ({ sdp, roomId }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
    }
}

module.exports = UserManager;
