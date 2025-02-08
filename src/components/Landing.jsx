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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
                <h1 className="text-3xl font-bold mb-6">Join a Video Chat</h1>

                {/* Local Video Preview */}
                <div className="w-64 h-64 border-2 border-gray-600 rounded-lg overflow-hidden shadow-lg mb-4">
                    <video autoPlay ref={videoRef} className="w-full h-full object-cover"></video>
                </div>

                {/* Name Input */}
                <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-64 p-3 mb-4 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Join Button */}
                <button 
                    onClick={() => {
                        if (!name.trim()) {
                            alert("Please enter your name.");
                            return;
                        }
                        setJoined(true);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition text-lg font-semibold rounded-md shadow-lg"
                >
                    Join
                </button>
            </div>
        );
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />;
};
export default Landing;
