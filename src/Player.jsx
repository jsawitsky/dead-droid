// src/Player.jsx
import React, { useState, useRef, useEffect } from 'react';

// Strict MM:SS formatter
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Player({ show, tracks, onClose, onFavTrack, favTracks }) {
  const audioRef = useRef(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
      setIsPlaying(true);
    }
    if ('mediaSession' in navigator && currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: 'Grateful Dead',
          album: show.date,
          artwork: [{ src: 'https://archive.org/services/img/GratefulDead', sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (currentTrackIndex < tracks.length - 1) setCurrentTrackIndex(currentTrackIndex + 1);
  };

  const playPrev = () => {
    if (currentTrackIndex > 0) setCurrentTrackIndex(currentTrackIndex - 1);
  };

  const handleTimeUpdate = () => {
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);
  };

  const handleSeek = (e) => {
    const seekTime = (audioRef.current.duration / 100) * e.target.value;
    audioRef.current.currentTime = seekTime;
    setProgress(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col z-50 w-full h-full">
      
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700 shrink-0">
        <button onClick={onClose} className="text-gray-400 font-bold p-2 text-lg">⌄ Close</button>
        <div className="font-mono text-blue-400 font-bold">{show.date}</div>
        <div className="w-8"></div>
      </div>

      {/* Player Main */}
      <div className="shrink-0 flex flex-col items-center bg-gray-900 p-4 pb-0 w-full">
        <div className="w-20 h-20 bg-gray-800 rounded shadow overflow-hidden mb-2 relative">
           <img src="https://archive.org/services/img/GratefulDead" className="w-full h-full object-cover opacity-80" />
        </div>

        <div className="w-full flex justify-between items-center px-4 mb-1">
           <div className="w-6"></div>
           <h2 className="text-lg font-bold leading-tight line-clamp-1 text-center">{currentTrack?.title}</h2>
           {/* Heart Track Button */}
           <button 
             onClick={() => onFavTrack(currentTrack)}
             className={`w-6 text-xl ${favTracks.some(t => t.url === currentTrack?.url) ? 'text-red-500' : 'text-gray-600'}`}
           >
             ♥
           </button>
        </div>
        
        {/* Scrollable Description */}
        <div className="w-full max-h-16 overflow-y-auto text-xs text-gray-500 text-center px-6 mb-2 leading-relaxed border-t border-b border-gray-800 py-1">
           {show.primary.description || show.primary.source || "No source info available."}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 py-2">
           <button onClick={playPrev} className="h-16 w-16 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center active:bg-gray-700">⏮</button>
           <button onClick={togglePlay} className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg active:scale-95 text-3xl">
             {isPlaying ? "⏸" : "▶"}
           </button>
           <button onClick={playNext} className="h-16 w-16 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center active:bg-gray-700">⏭</button>
        </div>

        <div className="w-full px-2 mb-1">
          <input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>
        <div className="w-full flex justify-between text-xs text-gray-400 font-mono px-2 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto bg-gray-800 border-t border-gray-700 w-full">
        {tracks.map((track, idx) => (
          <div 
            key={idx} 
            onClick={() => setCurrentTrackIndex(idx)}
            className={`p-3 border-b border-gray-700 text-sm flex items-center cursor-pointer ${idx === currentTrackIndex ? 'bg-blue-900 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <span className="font-mono opacity-50 w-8 text-center shrink-0">{idx + 1}</span>
            <span className="truncate flex-1 px-2">{track.title}</span>
            <span className="font-mono text-xs opacity-60 w-12 text-right shrink-0">{formatTime(track.length)}</span>
          </div>
        ))}
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack?.url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={playNext}
      />
    </div>
  );
}