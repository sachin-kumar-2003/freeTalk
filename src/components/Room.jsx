import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const URL = "http://localhost:3000";

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
                console.log("Added track:", localVideoTrack);
                pc.addTrack(localVideoTrack);
            }
            if (localAudioTrack) {
                console.log("Added track:", localAudioTrack);
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
                console.log("Negotiation needed, sending offer...");
                const sdp = await pc.createOffer();
                pc.setLocalDescription(sdp);
                socket.emit("offer", { sdp, roomId });
            };
        });

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            console.log("Received offer...");
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
            console.log("Loop closed");
        });

        socket.on("lobby", () => {
            setLobby(true);
        });

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            console.log("Adding ICE candidate from remote:", candidate, type);
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
        <div>
            <p>Hi {name}</p>
            <video autoPlay width={400} height={400} ref={localVideoRef} />
            {lobby && <p>Waiting to connect you to someone...</p>}
            <video autoPlay width={400} height={400} ref={remoteVideoRef} />
        </div>
    );
};
export default Room;