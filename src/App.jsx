// src/App.jsx
import React, { useState, useEffect } from 'react';
import { searchDeadShows, getShowsOnDate, getTracks } from './api';
import Player from './Player';

export default function App() {
  const [query, setQuery] = useState('');
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeShow, setActiveShow] = useState(null); // The show currently playing
  const [activeTracks, setActiveTracks] = useState([]);

  // Load "On This Day" on startup
  useEffect(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    setLoading(true);
    getShowsOnDate(month, day).then((results) => {
      setShows(results);
      setLoading(false);
    });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    const results = await searchDeadShows(query);
    setShows(results);
    setLoading(false);
  };

  const playShow = async (show) => {
    setLoading(true);
    const tracks = await getTracks(show.primary.identifier);
    setActiveTracks(tracks);
    setActiveShow(show);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Search Bar */}
      <div className="p-4 bg-gray-800 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold mb-2 text-blue-400">
          DeadDroid Alpha
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (e.g. 'Cornell' or '1977')"
            className="flex-1 p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 px-4 py-2 rounded font-bold"
          >
            Go
          </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        {loading && (
          <div className="text-center py-10 text-gray-400 animate-pulse">
            Loading the Vault...
          </div>
        )}

        {!loading && shows.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No shows found. Try a year or venue.
          </div>
        )}

        <div className="space-y-4">
          {shows.map((show) => (
            <div
              key={show.primary.identifier}
              className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700 flex justify-between items-center"
            >
              <div>
                <div className="font-bold text-lg">{show.date}</div>
                <div className="text-sm text-gray-400 truncate w-48">
                  {show.primary.title}
                </div>
                <div className="text-xs text-green-400 mt-1">
                  ★ {show.primary.avg_rating || '?'} • ⬇{' '}
                  {show.primary.downloads}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => playShow(show)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg active:scale-95 transition"
                >
                  PLAY
                </button>
                {show.alternates.length > 0 && (
                  <div className="text-xs text-center text-gray-500">
                    {show.alternates.length} other vers.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Overlay */}
      {activeShow && (
        <Player
          show={activeShow}
          tracks={activeTracks}
          onClose={() => setActiveShow(null)}
        />
      )}
    </div>
  );
}
