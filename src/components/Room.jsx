import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const URL = "https://freetalk.onrender.com";

export const Room = ({ name, localAudioTrack, localVideoTrack }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState(null);
    const [sendingPc, setSendingPc] = useState(null);
    const [receivingPc, setReceivingPc] = useState(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState(null);
    
    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);

    useEffect(() => {
        const socket = io(URL);

        socket.on('send-offer', async ({ roomId }) => {
            console.log("Sending offer...");
            setLobby(false);
            const pc = new RTCPeerConnection();
            setSendingPc(pc);

            if (localVideoTrack) {
                pc.addTrack(localVideoTrack);
            }
            if (localAudioTrack) {
                pc.addTrack(localAudioTrack);
            }

            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    });
                }
            };

            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer();
                pc.setLocalDescription(sdp);
                socket.emit("offer", { sdp, roomId });
            };
        });

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);
            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp);
            const sdp = await pc.createAnswer();
            pc.setLocalDescription(sdp);
            
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setRemoteMediaStream(stream);
            setReceivingPc(pc);

            pc.ontrack = (e) => {
                alert("ontrack event received");
            };

            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId
                    });
                }
            };

            socket.emit("answer", { roomId, sdp });

            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track;
                const track2 = pc.getTransceivers()[1].receiver.track;

                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2);
                    setRemoteVideoTrack(track1);
                } else {
                    setRemoteAudioTrack(track1);
                    setRemoteVideoTrack(track2);
                }

                if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                    remoteVideoRef.current.srcObject.addTrack(track1);
                    remoteVideoRef.current.srcObject.addTrack(track2);
                    remoteVideoRef.current.play();
                }
            }, 5000);
        });

        socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);
            setSendingPc((pc) => {
                pc?.setRemoteDescription(remoteSdp);
                return pc;
            });
        });

        socket.on("lobby", () => {
            setLobby(true);
        });

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            if (type === "sender") {
                setReceivingPc((pc) => {
                    if (pc) {
                        pc.addIceCandidate(candidate);
                    }
                    return pc;
                });
            } else {
                setSendingPc((pc) => {
                    if (pc) {
                        pc.addIceCandidate(candidate);
                    }
                    return pc;
                });
            }
        });

        setSocket(socket);

        return () => {
            socket.disconnect();
        };
    }, [name]);

    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
            localVideoRef.current.play();
        }
    }, [localVideoTrack]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-4">Welcome, {name}!</h1>
            
            {/* Video Streams */}
            <div className="flex gap-4 flex-wrap justify-center">
                <div className="relative w-72 h-72 border-2 border-gray-600 rounded-lg overflow-hidden shadow-lg">
                    <video autoPlay ref={localVideoRef} className="w-full h-full object-cover"></video>
                    <p className="absolute bottom-2 left-2 bg-gray-700 px-2 py-1 text-sm rounded-md">You</p>
                </div>

                <div className="relative w-72 h-72 border-2 border-gray-600 rounded-lg overflow-hidden shadow-lg">
                    <video autoPlay ref={remoteVideoRef} className="w-full h-full object-cover"></video>
                    <p className="absolute bottom-2 left-2 bg-gray-700 px-2 py-1 text-sm rounded-md">Stranger</p>
                </div>
            </div>

            {/* Connection Status */}
            <div className="mt-4 text-lg">
                {lobby ? "Waiting for a connection..." : "Connected"}
            </div>

            {/* Leave Button */}
            <button 
                className="mt-6 bg-red-600 hover:bg-red-700 transition px-6 py-2 rounded-md text-lg font-semibold shadow-lg"
                onClick={() => window.location.href = "/"}
            >
                Leave Room
            </button>
        </div>
    );
};
export default Room;
