{/* 
  import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const StudentWorkletView = () => {
  const { workletId } = useParams();
  const [worklet, setWorklet] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // It fetches from the exact same endpoint as the mentor
    fetch(`http://localhost:8080/api/worklets/${workletId}`)
      .then(res => res.json())
      .then(data => {
        setWorklet(data.worklet);
        setMeeting(data.meeting);
        setLoading(false);
      })
      .catch(console.error);
  }, [workletId]);

  if (loading) return <div>Loading worklet details...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Student View: {worklet?.title}</h1>
      <p>Worklet ID: {workletId}</p>
      
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-2xl">Meeting Status</h2>
        {meeting ? (
          <div>
            <p className="text-green-600">Your mentor has scheduled a meeting!</p>
            <Link to={`/meeting/${meeting.channelName}`} className="text-blue-500 hover:underline">
              Click here to Join Meeting
            </Link>
          </div>
        ) : (
          <p>No meeting has been scheduled yet. Please wait for your mentor.</p>
        )}
      </div>
    </div>
  );
};

export default StudentWorkletView;
*/}