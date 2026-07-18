// src/components/RoomContainer.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import Room from '../pages/Room'; // Your existing Room component

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function RoomContainer({ user }) {
  const { roomId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ room: roomId, username: user?.name || user?.email })
    })
    .then(res => res.json())
    .then(data => { setData(data); setLoading(false); })
    .catch(err => { console.error(err); setLoading(false); });
  }, [roomId, user]);

  if (loading) return <div>Joining room...</div>;
  if (!data) return <div>Failed to connect.</div>;

  return <Room token={data.token} serverUrl={data.serverUrl} onLeaveCall={() => window.location.href = '/dashboard'} />;
}