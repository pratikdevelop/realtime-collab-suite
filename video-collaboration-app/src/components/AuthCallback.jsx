// src/components/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Ask Supabase to check the active session from the hash URL parameters
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error fetching session:', error.message);
        setError(error.message);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (session) {
        // 2. Format the user details to match what your existing login code saves
        const userPayload = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata.full_name,
          avatar: session.user.user_metadata.avatar_url
        };

        // 3. Save to localStorage exactly like handleLogin does
        localStorage.setItem('authToken', session.access_token);
        localStorage.setItem('user', JSON.stringify(userPayload));

        // 4. Sync the OAuth profile into the `users` table so it's not just in auth.users
        try {
          await fetch(`${API_BASE_URL}/auth/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              supabase_id: session.user.id,
              email: session.user.email,
              name: userPayload.name,
              avatar: userPayload.avatar,
            }),
          });
        } catch (syncErr) {
          // Non-fatal: user can still use the app even if the sync call fails,
          // but log it so it's not silently lost.
          console.error('Failed to sync user profile:', syncErr);
        }

        // 5. Redirect to dashboard
        navigate('/dashboard');
      } else {
        // Fallback if no session can be found
        setError('Authentication failed. No active session found.');
        setTimeout(() => navigate('/login'), 3000);
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-lg shadow-2xl text-center">
        {!error ? (
          <>
            <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
            <h2 className="text-xl font-bold text-white mb-2">Verifying credentials...</h2>
            <p className="text-sm text-slate-400">Taking you to your dashboard in a moment.</p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-lg font-semibold mb-2">Auth Error</div>
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 py-2 rounded-lg mb-4">{error}</p>
            <p className="text-xs text-slate-500">Redirecting you back to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}