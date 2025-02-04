import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [partnerId, setPartnerId] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isCalling, setIsCalling] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Connecting to socket...");
    setLoading(true);
    socket.emit("find_pair");

    socket.on("match_found", ({ partnerId }) => {
      console.log("Match found with partner:", partnerId);
      setPartnerId(partnerId);
      initWebRTC();
      setLoading(false);
    });

    socket.on("offer", async ({ sdp, from }) => {
      console.log("Received offer from:", from);
      if (!peerConnection.current) initWebRTC();
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log("Remote description set for offer");
      const answer = await peerConnection.current.createAnswer();
      console.log("Answer created:", answer);
      await peerConnection.current.setLocalDescription(answer);
      console.log("Local description set for answer");
      socket.emit("answer", { sdp: answer, partnerId: from });
    });

    socket.on("answer", async ({ sdp }) => {
      console.log("Received answer from partner");
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log("Remote description set for answer");
    });

    socket.on("ice-candidate", async (candidate) => {
      console.log("Received ICE candidate from partner:", candidate);
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE candidate added successfully");
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("receive_message", ({ message, from }) => {
      console.log("Received message from:", from);
      setChat((prevChat) => [...prevChat, { from, message }]);
    });

    socket.on("partner_left", () => {
      console.log("Partner left the chat");
      alert("Your partner has left the chat.");
      resetChat();
    });

    return () => {
      console.log("Cleaning up...");
      socket.disconnect();
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, []);

  const initWebRTC = async () => {
    console.log("Initializing WebRTC...");
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // Google's public STUN server
      ],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate to partner:", event.candidate);
        socket.emit("ice-candidate", { candidate: event.candidate, partnerId });
      }
    };

    peerConnection.current.ontrack = (event) => {
      console.log("Remote video stream received");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("Local stream obtained");
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Failed to access your camera and microphone. Please check permissions.");
    }
  };

  const startCall = async () => {
    if (!peerConnection.current) {
      alert("No connection to partner.");
      return;
    }

    console.log("Creating offer...");
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    console.log("Local description set for offer");
    socket.emit("offer", { sdp: offer, partnerId });
    setIsCalling(true);
  };

  const leaveCall = () => {
    console.log("Leaving call...");
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    socket.emit("leave_call", { partnerId }); // Notify backend to clean up
    resetChat();
  };

  const resetChat = () => {
    console.log("Resetting chat...");
    setPartnerId(null);
    setIsCalling(false);
    setChat([]);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      console.log("Sending message to partner:", partnerId);
      socket.emit("send_message", { message, partnerId });
      setChat([...chat, { from: "You", message }]);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full md:w-1/2 h-64 md:h-auto border-4 border-blue-500 rounded-lg"
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full md:w-1/2 h-64 md:h-auto border-4 border-green-500 rounded-lg"
          />
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-2 text-gray-500">Finding partner...</p>
            </div>
          ) : partnerId && !isCalling ? (
            <button
              onClick={startCall}
              className="w-full bg-blue-500 text-white py-2 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
            >
              Start Call
            </button>
          ) : isCalling ? (
            <button
              onClick={leaveCall}
              className="w-full bg-red-500 text-white py-2 rounded-lg shadow-md hover:bg-red-600 transition duration-300"
            >
              Leave Call
            </button>
          ) : (
            <p className="text-gray-500 mt-4 text-center">Waiting for partner...</p>
          )}
        </div>

        <div className="border-t border-gray-300 p-4">
          <div className="h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg mb-4">
            {chat.map((msg, index) => (
              <div
                key={index}
                className={`py-2 ${msg.from === "You" ? "text-right" : "text-left"}`}
              >
                <strong className={`${msg.from === "You" ? "text-blue-500" : "text-green-500"}`}>
                  {msg.from}:
                </strong>{" "}
                <span className="text-gray-700">{msg.message}</span>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border-2 border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message"
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;