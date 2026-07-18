import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Configure this to point to your backend url
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Dashboard({ user, onJoinCall, loading }) {
  const [roomInput, setRoomInput] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';

  const avatar = user?.user_metadata?.avatar_url;

  // 1. Fetch user's recent rooms from the Express Backend
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setDbLoading(false);
      return;
    }

    const fetchRecentRooms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rooms/recent`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch rooms');

        const data = await response.json();
        if (data) {
          setRecentRooms(data.map((row) => row.room_name));
        }
      } catch (error) {
        console.error('Error fetching recent rooms:', error.message);
      } finally {
        setDbLoading(false);
      }
    };

    fetchRecentRooms();
  }, [user?.id]);

  // 2. Persist room through Backend API & Trigger Join
  const handleJoin = async (roomName) => {
    const formattedRoom = roomName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!formattedRoom) return;

    const token = localStorage.getItem('authToken');
    
    // Attempt to save history before joining
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/rooms/recent`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ room_name: formattedRoom }),
        });
      }
      
      // Navigate to room regardless of save success, 
      // but only if room name exists
      onJoinCall(formattedRoom);
      
    } catch (error) {
      console.error('Failed to save room history, joining anyway:', error.message);
      onJoinCall(formattedRoom);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleJoin(roomInput);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0b12] p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] aspect-square rounded-full bg-blue-500/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] aspect-square rounded-full bg-purple-500/10 blur-3xl animate-float-delayed pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-fadeSlideUp">
        
        {/* Logout */}
        <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-red-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>

        {/* Header */}
        <div className="px-10 pt-12 pb-8 border-b border-white/5 flex items-center gap-4">
           {avatar ? <img src={avatar} className="w-16 h-16 rounded-full border-2 border-blue-400/60" /> : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">{displayName[0]}</div>}
           <div>
             <h3 className="text-xl font-semibold text-white">Welcome, {displayName}</h3>
             <p className="text-sm text-gray-400">{user?.email}</p>
           </div>
        </div>

        {/* Content */}
        <div className="p-10 space-y-10">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="text-xs font-semibold text-gray-400 uppercase">Start or Join a Meeting</label>
            <div className="flex gap-3">
              <input 
                type="text" required placeholder="enter-room-name" value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-400"
              />
              <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500">Join</button>
            </div>
          </form>

          {/* Recent Rooms */}
          <div className="space-y-4">
            <span className="text-xs font-semibold text-gray-400 uppercase">Recent Rooms</span>
            {dbLoading ? <div className="text-gray-500 text-sm">Loading history...</div> : (
              <div className="flex flex-wrap gap-2">
                {recentRooms.map((room) => (
                  <button key={room} onClick={() => handleJoin(room)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-gray-300 hover:bg-blue-500/10">
                    #{room}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}