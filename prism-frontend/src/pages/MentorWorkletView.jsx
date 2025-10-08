// MentorWorkletView: Displays a single worklet (mentor perspective) and allows scheduling a meeting.
// This appears to be a prototype / legacy meeting feature hitting a hard-coded localhost backend.
// Consider refactoring to reuse shared service utilities & central error handling.
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const MentorWorkletView = () => {
  const { workletId } = useParams(); // Extract dynamic segment (e.g., /mentor/worklet/:workletId)
  const [worklet, setWorklet] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch base worklet + any existing scheduled meeting
    // NOTE: Direct fetch usage; consider abstraction & token injection if auth needed.
    fetch(`http://localhost:8080/api/worklets/${workletId}`)
      .then(res => res.json())
      .then(data => {
        setWorklet(data.worklet);
        setMeeting(data.meeting);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load worklet:', err);
        setLoading(false);
      });
  }, [workletId]);

  const handleScheduleMeeting = async () => {
    // POST to create/schedule a new meeting for this worklet
    try {
      const response = await fetch(`http://localhost:8080/api/worklets/${workletId}/schedule-meeting`, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const newMeeting = await response.json();
      setMeeting(newMeeting); // Reflect newly scheduled meeting
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
    }
  };

  if (loading) return <div>Loading worklet details...</div>; // Lightweight loading indicator

  return (
    <div className="p-8">
  <h1 className="text-3xl font-bold">Mentor View: {worklet?.title}</h1> {/* Worklet title from backend */}
      <p>Worklet ID: {workletId}</p>
      
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-2xl">Meeting Status</h2>
        {meeting ? (
          <div>
            <p className="text-green-600">Meeting is scheduled!</p>
            {/* Uses meeting.channelName as a route param; adjust if backend changes schema */}
            <Link to={`/meeting/${meeting.channelName}`} className="text-blue-500 hover:underline">Click here to Join/Start the Meeting</Link>
          </div>
        ) : (
          <div>
            <p>No meeting scheduled yet.</p>
            <button onClick={handleScheduleMeeting} className="bg-blue-500 text-white py-2 px-4 rounded">Schedule Meeting Now</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorWorkletView;