import { useEffect, useRef, useState } from "react";
import { Room } from "./Room";

export const Landing = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const videoRef = useRef(null);
    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            setLocalAudioTrack(stream.getAudioTracks()[0]);
            setLocalVideoTrack(stream.getVideoTracks()[0]);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    };

    useEffect(() => {
        getCam();
    }, []);

    if (!joined) {
        return (
            <div>
                <video autoPlay ref={videoRef}></video>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your name"
                />
                <button 
                    onClick={() => {
                        if (!name.trim()) {
                            alert("Please enter your name.");
                            return;
                        }
                        setJoined(true);
                    }}
                >
                    Join
                </button>
            </div>
        );
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />;
};
export default Landing;