// src/Player.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function Player({ show, tracks, onClose }) {
  const audioRef = useRef(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentTrack = tracks[currentTrackIndex];

  // Auto-play when track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }

    // Set Media Session (Lock Screen Controls)
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: 'Grateful Dead',
        album: show.date,
        artwork: [
          {
            src: 'https://archive.org/services/img/GratefulDead',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
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
    if (currentTrackIndex < tracks.length - 1)
      setCurrentTrackIndex(currentTrackIndex + 1);
  };

  const playPrev = () => {
    if (currentTrackIndex > 0) setCurrentTrackIndex(currentTrackIndex - 1);
  };

  const handleTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    setProgress((current / duration) * 100);
  };

  const handleSeek = (e) => {
    const seekTime = (audioRef.current.duration / 100) * e.target.value;
    audioRef.current.currentTime = seekTime;
    setProgress(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col z-50">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-gray-800">
        <button onClick={onClose} className="text-gray-400 text-lg">
          ↓ Minimize
        </button>
        <span className="font-bold">{show.date}</span>
        <div className="w-8"></div>
      </div>

      {/* Main Display */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-64 h-64 bg-gray-700 rounded-lg mb-6 shadow-xl flex items-center justify-center overflow-hidden">
          {/* Simple Stealie Placeholder */}
          <img
            src="https://archive.org/services/img/GratefulDead"
            alt="Stealie"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold mb-2 line-clamp-2">
          {currentTrack?.title || 'Loading...'}
        </h2>
        <p className="text-gray-400">
          {tracks.length} Tracks • {show.primary?.identifier}
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          className="w-full h-4 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-8 flex justify-between items-center pb-12 safe-area-bottom">
        <button
          onClick={playPrev}
          className="p-4 rounded-full bg-gray-700 active:bg-gray-600"
        >
          ⏮
        </button>

        <button
          onClick={togglePlay}
          className="p-6 rounded-full bg-white text-black active:bg-gray-200 transform scale-125"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={playNext}
          className="p-4 rounded-full bg-gray-700 active:bg-gray-600"
        >
          ⏭
        </button>
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
