// src/api.js
const BASE_URL = 'https://archive.org/advancedsearch.php';

// Helper to format the Archive query
export const searchDeadShows = async (query) => {
  // We search for Grateful Dead collection, usually filtered by title or date
  const q = `collection:(GratefulDead) AND mediaType:(etree) AND title:(${query})`;

  const params = new URLSearchParams({
    q: q,
    fl: ['identifier', 'title', 'date', 'downloads', 'avg_rating', 'year'].join(
      ','
    ),
    sort: ['date desc', 'downloads desc'].join(','),
    output: 'json',
    rows: 50,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();
    return processResults(data.response.docs);
  } catch (error) {
    console.error('Search failed', error);
    return [];
  }
};

// "On This Day" Logic
export const getShowsOnDate = async (month, day) => {
  // Lucene query syntax for date matching
  // Note: This is a simplified query for the prototype
  const q = `collection:(GratefulDead) AND date:*${month}-${day}`;

  const params = new URLSearchParams({
    q: q,
    fl: ['identifier', 'title', 'date', 'downloads', 'avg_rating'].join(','),
    sort: 'downloads desc',
    output: 'json',
    rows: 20,
  });

  const response = await fetch(`${BASE_URL}?${params}`);
  const data = await response.json();
  return processResults(data.response.docs);
};

// The "Auto-Select" Logic: Group by date, pick highest downloads
const processResults = (docs) => {
  const grouped = {};

  docs.forEach((doc) => {
    const date = doc.date.split('T')[0]; // Clean date
    if (!grouped[date]) {
      grouped[date] = {
        date: date,
        primary: doc,
        alternates: [],
      };
    } else {
      grouped[date].alternates.push(doc);
    }
  });

  // Convert back to array
  return Object.values(grouped);
};

export const getTracks = async (identifier) => {
  const url = `https://archive.org/metadata/${identifier}`;
  const response = await fetch(url);
  const data = await response.json();

  // Filter for MP3 files (VBR or 320)
  const files = data.files.filter((f) => f.format === 'VBR MP3' && f.title);

  // Sort by track number if available
  files.sort((a, b) => (parseInt(a.track) || 999) - (parseInt(b.track) || 999));

  return files.map((f) => ({
    title: f.title,
    url: `https://archive.org/download/${identifier}/${f.name}`,
    length: f.length,
  }));
};
