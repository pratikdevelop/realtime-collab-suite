import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';

// Ensure this matches your backend port
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Room({ token, serverUrl, onLeaveCall }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="relative w-screen h-screen bg-[#0b0b12] overflow-hidden flex items-center justify-center p-4 font-sans">
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] max-w-[500px] aspect-square rounded-full bg-blue-500/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] max-w-[500px] aspect-square rounded-full bg-purple-500/10 blur-3xl animate-float-delayed pointer-events-none" />

      <div className="relative z-10 w-full h-full max-w-[1600px] animate-fadeSlideUp">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          connect={true}
          onDisconnected={onLeaveCall}
          onError={(err) => console.error('LiveKit Room error:', err)}
          className="w-full h-full flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1 h-full min-h-0 rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl shadow-black/50">
            <VideoConference />
            <button
              onClick={() => setSidebarVisible(prev => !prev)}
              className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium hover:bg-blue-500/30 transition-all"
            >
              {sidebarVisible ? 'Hide Tools' : 'Show Tools'}
            </button>
          </div>

          <div className={`w-full md:w-[380px] md:flex-shrink-0 h-[40vh] md:h-full bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 ${sidebarVisible ? 'block md:flex' : 'hidden'}`}>
            <CollaborationSuite />
          </div>
        </LiveKitRoom>
      </div>
    </div>
  );
}

function CollaborationSuite() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [drawColor, setDrawColor] = useState('#1f8cf9');

  const drawOnCanvasRef = useRef(null);
  const clearCanvasRef = useRef(null);

  // Inside CollaborationSuite

  // 1. Fetch Existing Strokes on Load
  useEffect(() => {
    const fetchStrokes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/whiteboard/${room.name}`);
        const strokes = await res.json();
        strokes.forEach(s => drawOnCanvas(s.x0, s.y0, s.x1, s.y1, s.color, false));
      } catch (err) { console.error("Failed to load strokes", err); }
    };
    fetchStrokes();
  }, [room.name]);

  // 2. Update draw function to save to DB
  const drawOnCanvas = useCallback((x0, y0, x1, y1, color, emit) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Draw logic...
    ctx.beginPath();
    ctx.moveTo(x0 * canvas.width, y0 * canvas.height);
    ctx.lineTo(x1 * canvas.width, y1 * canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (emit) {
      // 1. Broadcast to LiveKit for real-time (instant)
      const data = JSON.stringify({ type: 'draw', x0, y0, x1, y1, color });
      localParticipant?.publishData(new TextEncoder().encode(data), { reliable: false });

      // 2. Save to Database (background - don't await so drawing feels smooth)
      fetch(`${API_BASE_URL}/whiteboard/stroke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.name, x0, y0, x1, y1, color })
      }).catch(console.error);
    }
  }, [localParticipant, room.name]);

  // 3. Update Clear logic
  const clearCanvas = useCallback((emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    if (emit) {
      localParticipant?.publishData(new TextEncoder().encode(JSON.stringify({ type: 'clear' })), { reliable: true });
      fetch(`${API_BASE_URL}/whiteboard/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.name })
      });
    }
  }, [localParticipant, room.name]);

  // 1. Fetch History on mount
  useEffect(() => {
    if (!room.name) return;
    const fetchFiles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/files/${room.name}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setFiles(data);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    fetchFiles();
  }, [room.name]);

  // 2. Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', room.name);
    formData.append('sender_name', localParticipant?.identity || 'Me');

    try {
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: formData,
      });

      const newFile = await response.json();
      setFiles((prev) => [...prev, newFile]);

      if (localParticipant) {
        const payload = JSON.stringify({ type: 'file-share', file: newFile });
        localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  useEffect(() => {
    drawOnCanvasRef.current = drawOnCanvas;
    clearCanvasRef.current = clearCanvas;
  }, [drawOnCanvas, clearCanvas]);

  // Listener for incoming Data
  useEffect(() => {
    const handleData = (payload, participant) => {
      const dataStr = new TextDecoder().decode(payload);
      try {
        const message = JSON.parse(dataStr);
        if (message.type === 'draw') {
          drawOnCanvasRef.current?.(message.x0, message.y0, message.x1, message.y1, message.color, false);
        } else if (message.type === 'clear') {
          clearCanvasRef.current?.(false);
        } else if (message.type === 'file-share') {
          setFiles((prev) => [...prev, message.file]);
        }
      } catch (err) { console.error(err); }
    };
    room.on('dataReceived', handleData);
    return () => room.off('dataReceived', handleData);
  }, [room]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  const startDrawing = (e) => { isDrawing.current = true; lastPos.current = getCoordinates(e); };
  const draw = (e) => { if (isDrawing.current) { const pos = getCoordinates(e); drawOnCanvas(lastPos.current.x, lastPos.current.y, pos.x, pos.y, drawColor, true); lastPos.current = pos; } };
  const stopDrawing = () => { isDrawing.current = false; };

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">Workspace Tools</h3>
      </div>

      {/* Whiteboard Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase">Shared Whiteboard</span>
          <button onClick={() => clearCanvas(true)} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">Clear</button>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-[#0d0d14] border border-white/10">
          <canvas
            ref={canvasRef}
            width={380}
            height={240}
            className="w-full h-auto cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="absolute bottom-3 right-3">
            <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-8 h-8 cursor-pointer bg-transparent" />
          </div>
        </div>
      </div>

      {/* File Sharing Section */}
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase">Document Portal</span>
          <label className="text-xs bg-blue-500/15 text-blue-400 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-500/25">
            {uploading ? 'Uploading...' : 'Share File'}
            <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto bg-black/20 rounded-xl p-2 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/[0.03] p-2 rounded-lg">
              {/* CHANGE: Use file.file_name and file.file_url */}
              <span className="text-sm text-gray-200 truncate">
                {file.file_name || 'File'}
              </span>
              <a
                href={file.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 text-xs"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}