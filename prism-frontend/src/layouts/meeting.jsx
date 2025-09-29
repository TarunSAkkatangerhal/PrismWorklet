{/* 
  import React, { useState } from 'react';
import AgoraUIKit from 'agora-react-uikit';
// 1. Import useParams to read the URL
import { useParams } from 'react-router-dom';

const MeetingPage = () => {
  const [videoCall, setVideoCall] = useState(false);
  const [token, setToken] = useState(null);

  // 2. Get the room name from the URL parameter
  const { roomName } = useParams();
  
  // 3. Use the dynamic room name, or a default if none is provided
  const channelName = roomName || 'general-lobby';

  const rtcProps = {
    appId: '362ab3f7c1474fada160216dde6ed2de', // Your App ID
    channel: channelName, // Use the dynamic channel name
    token: token,
  };

  const callbacks = {
    EndCall: () => {
      setVideoCall(false);
      setToken(null);
    },
  };

  const joinCall = async () => {
    try {
      const response = await fetch(`http://localhost:8080/rtc/${channelName}/0`);
      if (!response.ok) {
        throw new Error('Failed to fetch token from server.');
      }
      const data = await response.json();
      setToken(data.rtcToken);
      setVideoCall(true);
    } catch (error) {
      console.error('Error fetching token:', error);
      alert('Could not get token to join the call. Please ensure the token server is running and configured correctly.');
    }
  };

  return (
    <>
      {videoCall ? (
        <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
          <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
        </div>
      ) : (
        <div className="flex justify-center items-center w-full h-screen bg-[#282c34] text-white">
          <div className="text-center">
            <h1 className="text-5xl mb-4">Ready to Join?</h1>
            {/* 4. Display the dynamic room name to the user */}
           {/* } <p className="text-xl mb-8 text-gray-300">
              You are about to enter the room: <strong>{channelName}</strong>
            </p>
            <button
              onClick={joinCall}
              className="py-4 px-8 text-xl rounded-full border-none bg-gradient-to-r from-[#6a11cb] to-[#2575fc] text-white cursor-pointer transition-transform duration-200 ease-in-out shadow-[0_4px_15px_0_rgba(49,196,190,0.75)] hover:scale-105"
            >
              Join Secure Meeting
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MeetingPage;
*/}