// src/App.jsx
import React, { useState, useEffect } from 'react';
import { searchDeadShows, getShowsOnDate, getTracks } from './api';
import Player from './Player';
 
const Skeleton = () => (
  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 animate-pulse flex gap-4 w-full">
    <div className="h-12 w-12 bg-gray-700 rounded-full shrink-0"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

const YEARS = Array.from({length: 31}, (_, i) => 1965 + i);
const MONTHS = [
  {val: "01", name: "Jan"}, {val: "02", name: "Feb"}, {val: "03", name: "Mar"},
  {val: "04", name: "Apr"}, {val: "05", name: "May"}, {val: "06", name: "Jun"},
  {val: "07", name: "Jul"}, {val: "08", name: "Aug"}, {val: "09", name: "Sep"},
  {val: "10", name: "Oct"}, {val: "11", name: "Nov"}, {val: "12", name: "Dec"}
];

export default function App() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [sort, setSort] = useState("date asc"); 
  
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeShow, setActiveShow] = useState(null);
  const [activeTracks, setActiveTracks] = useState([]);
  const [mode, setMode] = useState("history"); 

  const [favShows, setFavShows] = useState(() => JSON.parse(localStorage.getItem('favShows')) || []);
  const [favTracks, setFavTracks] = useState(() => JSON.parse(localStorage.getItem('favTracks')) || []);

  const dateObj = new Date();
  const todayMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
  const todayDay = String(dateObj.getDate()).padStart(2, '0');

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    localStorage.setItem('favShows', JSON.stringify(favShows));
    localStorage.setItem('favTracks', JSON.stringify(favTracks));
  }, [favShows, favTracks]);

  useEffect(() => {
    if (mode === "search") runSearch();
    else if (mode === "history") loadHistory();
  }, [year, month, sort]);

  const loadHistory = async () => {
    setLoading(true);
    setMode("history");
    setYear(""); setMonth(""); setQuery("");
    const results = await getShowsOnDate(todayMonth, todayDay, sort);
    setShows(results);
    setLoading(false);
  };

  const loadFavorites = () => {
    setMode("favorites");
    setShows(favShows); 
  };

  const clearFilters = () => {
    setQuery(""); setYear(""); setMonth(""); setSort("date asc");
    loadHistory(); 
  };

  const runSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query && !year && !month) return;
    setMode("search");
    setLoading(true);
    const results = await searchDeadShows(query, year, month, sort);
    setShows(results);
    setLoading(false);
  };

  const toggleFavShow = (e, show) => {
    e.stopPropagation(); 
    const exists = favShows.find(s => s.primary.identifier === show.primary.identifier);
    if (exists) {
      setFavShows(favShows.filter(s => s.primary.identifier !== show.primary.identifier));
    } else {
      setFavShows([...favShows, show]);
    }
  };

  // Allow swapping the source (primary) before playing
  const swapSource = (groupIndex, newSource) => {
    const newShows = [...shows];
    newShows[groupIndex].primary = newSource;
    setShows(newShows);
  };

  const playShow = async (show) => {
    setLoading(true);
    const tracks = await getTracks(show.primary.identifier);
    setActiveTracks(tracks);
    setActiveShow(show);
    setLoading(false);
  };

  const toggleFavTrack = (track) => {
    const exists = favTracks.find(t => t.url === track.url);
    if (exists) {
      setFavTracks(favTracks.filter(t => t.url !== track.url));
    } else {
      setFavTracks([...favTracks, { ...track, date: activeShow.date }]);
    }
  };

  // Play a single favorite track
  const playFavoriteTrack = (track) => {
    const dummyShow = {
      date: track.date || "Favorite",
      primary: { description: "Playing from Favorites", source: "Favorite Track", identifier: track.showIdentifier || "unknown" }
    };
    setActiveShow(dummyShow);
    setActiveTracks([track]); 
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-900 text-white font-sans">
      
      {/* HEADER */}
      <div className="w-full bg-gray-800 sticky top-0 z-10 p-4 shadow-md space-y-3">
        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
           <div className="flex items-center gap-2 cursor-pointer" onClick={loadHistory}>
             {/* Icon now handled by index.html, but we keep visual header icon */}
             <img src="https://archive.org/services/img/GratefulDead" className="w-8 h-8 rounded-full border border-gray-500" />
             <h1 className="text-xl font-bold text-blue-400">DeadDroid</h1>
           </div>
           <div className="flex gap-2">
             <button onClick={loadHistory} className={`px-3 py-1 rounded text-xs font-bold border ${mode === 'history' ? 'bg-blue-900 border-blue-500' : 'border-gray-600'}`}>TODAY</button>
             <button onClick={loadFavorites} className={`px-3 py-1 rounded text-xs font-bold border ${mode === 'favorites' ? 'bg-red-900 border-red-500' : 'border-gray-600'}`}>♥ FAVS</button>
           </div>
        </div>

        {mode !== 'favorites' && (
          <>
            <form onSubmit={runSearch} className="flex gap-2">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Venue, City..." className="flex-1 p-3 rounded bg-gray-700 text-white text-lg min-w-0" />
              <button type="submit" className="bg-blue-600 px-5 rounded font-bold text-white shrink-0">GO</button>
            </form>
            <div className="flex gap-2 w-full">
               <select value={year} onChange={(e) => { setYear(e.target.value); setMode("search"); }} className="flex-1 bg-gray-700 text-white p-2 rounded border border-gray-600">
                 <option value="">Year</option>
                 {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
               <select value={month} onChange={(e) => { setMonth(e.target.value); setMode("search"); }} className="flex-1 bg-gray-700 text-white p-2 rounded border border-gray-600">
                 <option value="">Month</option>
                 {MONTHS.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
               </select>
               <button onClick={clearFilters} className="px-3 bg-gray-700 rounded border border-gray-600 text-xs">✕</button>
            </div>
            <div className="flex gap-1 w-full pt-1">
               <button onClick={() => setSort("date asc")} className={`flex-1 py-1 rounded text-xs font-bold border ${sort === 'date asc' ? 'bg-gray-600 text-white' : 'border-gray-700 text-gray-500'}`}>Oldest</button>
               <button onClick={() => setSort("downloads desc")} className={`flex-1 py-1 rounded text-xs font-bold border ${sort === 'downloads desc' ? 'bg-gray-600 text-white' : 'border-gray-700 text-gray-500'}`}>Popular</button>
               <button onClick={() => setSort("avg_rating desc")} className={`flex-1 py-1 rounded text-xs font-bold border ${sort === 'avg_rating desc' ? 'bg-gray-600 text-white' : 'border-gray-700 text-gray-500'}`}>Rated</button>
            </div>
          </>
        )}
      </div>

      {/* RESULTS */}
      <div className="flex-1 p-4 space-y-3 pb-24 w-full">
        {!loading && (
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            {mode === 'history' ? `History: Jan ${todayDay} (${shows.length})` : mode === 'favorites' ? `My Library` : `Results (${shows.length})`}
          </h2>
        )}

        {mode === 'favorites' && favTracks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gray-500 text-xs uppercase mb-2">Favorite Tracks</h3>
            {favTracks.map((track, idx) => (
              <div key={idx} className="bg-gray-800 p-3 mb-2 rounded border border-gray-700 flex justify-between items-center group">
                 <div className="truncate pr-2 flex-1">
                   <div className="text-white">{track.title}</div>
                   <div className="text-xs text-blue-300">{track.date}</div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => playFavoriteTrack(track)} className="text-blue-500 text-xl">▶</button>
                    <button onClick={() => setFavTracks(favTracks.filter(t => t.url !== track.url))} className="text-gray-500 font-bold">✕</button>
                 </div>
              </div>
            ))}
            <h3 className="text-gray-500 text-xs uppercase mb-2">Favorite Shows</h3>
          </div>
        )}

        {loading && <><Skeleton /><Skeleton /></>}
        {!loading && shows.length === 0 && <div className="text-center text-gray-500 py-10">No shows found.</div>}

        {!loading && shows.map((show, idx) => {
          const isFav = favShows.some(s => s.primary.identifier === show.primary.identifier);
          return (
            <div key={show.date + idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full relative group">
              <div className="flex justify-between items-start" onClick={() => playShow(show)}>
                <div className="flex-1 min-w-0 pr-4 cursor-pointer">
                  <div className="font-bold text-lg text-blue-300">{show.date}</div>
                  <div className="text-white text-base truncate font-medium">{show.primary.venue || show.primary.title}</div>
                  <div className="text-gray-400 text-xs truncate mt-1">Source: {show.primary.identifier}</div>
                  <div className="flex gap-3 text-xs text-gray-500 mt-2 font-mono">
                     <span className="text-yellow-500">★ {show.primary.avg_rating || "-"}</span>
                     <span>⬇ {show.primary.downloads || 0}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                   <button onClick={(e) => toggleFavShow(e, show)} className={`text-2xl ${isFav ? 'text-red-500' : 'text-gray-600'}`}>♥</button>
                   <div className="text-xl text-blue-500 cursor-pointer">▶</div>
                </div>
              </div>
              
              {/* Alternate Versions Selector */}
              {show.alternates && show.alternates.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-700">
                  <select 
                    className="w-full bg-gray-900 text-xs text-gray-400 p-2 rounded border border-gray-700"
                    onChange={(e) => swapSource(idx, JSON.parse(e.target.value))}
                  >
                    <option value={JSON.stringify(show.primary)}>Selected: {show.primary.identifier.substring(0,30)}... ({show.primary.downloads} plays)</option>
                    {show.alternates.map(alt => (
                      <option key={alt.identifier} value={JSON.stringify(alt)}>
                        Version: {alt.identifier.substring(0,30)}... ({alt.downloads})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeShow && (
        <Player show={activeShow} tracks={activeTracks} onClose={() => setActiveShow(null)} onFavTrack={toggleFavTrack} favTracks={favTracks} onFavShow={(e) => toggleFavShow(e, activeShow)} isShowFav={favShows.some(s => s.primary.identifier === activeShow.primary.identifier)} />
      )}
    </div>
  );
}
