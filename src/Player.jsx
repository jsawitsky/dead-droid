// src/Player.jsx
import React, { useState, useRef, useEffect } from 'react';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Player({ show, tracks, onClose, onFavTrack, favTracks, onFavShow, isShowFav }) {
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
      
      {/* 1. TOP SECTION (Fixed Height ~45%) */}
      <div className="h-[45vh] shrink-0 bg-gray-900 border-b border-gray-700 flex flex-col">
        
        {/* Header Bar */}
        <div className="h-12 flex items-center justify-between px-4">
          <button onClick={onClose} className="text-gray-400 font-bold p-2 text-2xl">⌄</button>
          <div className="font-mono text-gray-500 text-xs">NOW PLAYING</div>
          <div className="w-8"></div>
        </div>

        {/* Info Row: Art + Title + Show Fav */}
        <div className="flex px-4 items-start gap-4 mb-2">
           <img src="https://archive.org/services/img/GratefulDead" className="w-16 h-16 rounded shadow object-cover shrink-0" />
           <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-blue-400 leading-none mb-1">{show.date}</div>
              <div className="text-sm text-white line-clamp-2 leading-tight">{show.primary.venue || show.primary.title}</div>
           </div>
           <button onClick={onFavShow} className={`text-3xl ${isShowFav ? 'text-red-500' : 'text-gray-600'}`}>♥</button>
        </div>

        {/* Scrollable Description */}
        <div className="flex-1 overflow-y-auto px-4 mb-2">
           <p className="text-xs text-gray-400 leading-relaxed">
             {show.primary.description || show.primary.source || "No description available."}
           </p>
        </div>

        {/* Controls & Scrubber */}
        <div className="px-4 pb-2">
           <div className="flex items-center justify-center gap-8 mb-3">
              <button onClick={playPrev} className="text-4xl text-gray-400 active:text-white">⏮</button>
              <button onClick={togglePlay} className="text-5xl text-white active:scale-95">{isPlaying ? "⏸" : "▶"}</button>
              <button onClick={playNext} className="text-4xl text-gray-400 active:text-white">⏭</button>
           </div>
           
           <input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-1" />
           <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
           </div>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Playlist (Scrollable) */}
      <div className="flex-1 overflow-y-auto bg-gray-800 w-full">
        {tracks.map((track, idx) => {
          const isTrackFav = favTracks.some(t => t.url === track.url);
          return (
            <div 
              key={idx} 
              className={`p-3 border-b border-gray-700 text-sm flex items-center ${idx === currentTrackIndex ? 'bg-blue-900/30' : 'hover:bg-gray-700'}`}
            >
              <div className="flex-1 flex items-center cursor-pointer min-w-0" onClick={() => setCurrentTrackIndex(idx)}>
                <span className={`font-mono w-8 text-center shrink-0 ${idx === currentTrackIndex ? 'text-blue-400 font-bold' : 'opacity-50'}`}>{idx + 1}</span>
                <span className={`truncate px-2 ${idx === currentTrackIndex ? 'text-blue-300 font-bold' : 'text-gray-300'}`}>{track.title}</span>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                 <span className="font-mono text-xs opacity-60">{formatTime(track.length)}</span>
                 <button 
                   onClick={() => onFavTrack(track)}
                   className={`text-xl ${isTrackFav ? 'text-red-500' : 'text-gray-600'}`}
                 >
                   ♥
                 </button>
              </div>
            </div>
          );
        })}
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