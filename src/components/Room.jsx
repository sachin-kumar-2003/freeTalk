import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const URL = "http://localhost:3000";

const Room = () => {
  const [searchParams] = useSearchParams();
  const [lobby,setLoby]=useState(true);
  const name = searchParams.get("name");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!name) return; // Prevent running if name is missing

    const newSocket = io(URL, {
      autoConnect: false,
    });

    newSocket.connect(); // Ensure connection is established

    newSocket.on('send-offer', ({ roomId }) => {
      alert("send-offer please");

      // SDP placeholder (should be replaced with actual SDP from WebRTC)
      const sdp = "dummy-sdp"; 

      newSocket.emit('send-offer', { roomId, sdp, offer: "offer" });
    });

    newSocket.on("lobby",()=>{
      setLoby(true)
    })

    newSocket.on("offer", ({ roomId, offer }) => {
      alert("offer");
      setLoby(false)
      // SDP placeholder (should be replaced with actual SDP from WebRTC)
      const sdp = "dummy-sdp"; 

      newSocket.emit("answer", { roomId, sdp, answer: "answer" });
    });

    newSocket.on("answer", ({ roomId, answer }) => {
      alert("connection done");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect(); // Clean up socket on unmount
    };
  }, [name]);
  if(lobby){
    return <>
    <div>waiting for someone</div>
    </>
  }

  return <>
  <video src="" width={400}></video>
  <video src="" width={400}></video>
  </>
};

export default Room;