const BASE_URL = "https://archive.org/advancedsearch.php";

const parseDuration = (durationStr) => {
  if (!durationStr) return 0;
  if (typeof durationStr === 'string' && durationStr.includes(':')) {
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  return parseFloat(durationStr) || 0;
};

export const searchDeadShows = async (text, year, month, sortBy = "date asc") => {
  const parts = ["collection:(GratefulDead)", "mediaType:(etree)"];

  if (text) {
    parts.push(`(title:(${text}) OR venue:(${text}) OR coverage:(${text}))`);
  }

  if (year) {
    parts.push(`year:${year}`);
  }

  if (month) {
    parts.push(`date:????-${month}-*`);
  }

  const q = parts.join(" AND ");
  
  const params = new URLSearchParams({
    q: q,
    fl: ["identifier", "title", "date", "downloads", "avg_rating", "year", "runtime", "num_files", "source", "description", "venue", "coverage"].join(","),
    sort: sortBy,
    output: "json",
    rows: 50,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();
    return processResults(data.response.docs);
  } catch (error) {
    console.error("Search failed", error);
    return [];
  }
};

export const getShowsOnDate = async (month, day, sortBy = "date asc") => {
  const q = `collection:(GratefulDead) AND mediaType:(etree) AND title:"-${month}-${day}"`;
  
  const params = new URLSearchParams({
    q: q,
    fl: ["identifier", "title", "date", "downloads", "avg_rating", "runtime", "num_files", "source", "description", "venue", "coverage"].join(","),
    sort: sortBy,
    output: "json",
    rows: 50,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();
    return processResults(data.response.docs);
  } catch (error) {
    console.error("History search failed", error);
    return [];
  }
};

const processResults = (docs) => {
  if (!docs || !Array.isArray(docs)) return [];
  
  const grouped = {};
  docs.forEach(doc => {
    const date = doc.date ? doc.date.split("T")[0] : "Unknown";
    if (!grouped[doc.identifier]) {
      grouped[doc.identifier] = { date: date, primary: doc };
    }
  });
  return Object.values(grouped);
};

export const getTracks = async (identifier) => {
  const url = `https://archive.org/metadata/${identifier}`;
  const response = await fetch(url);
  const data = await response.json();
  
  const files = data.files.filter(f => f.format === "VBR MP3" && f.title);
  
  files.sort((a, b) => (parseInt(a.track) || 999) - (parseInt(b.track) || 999));

  return files.map(f => ({
    title: f.title,
    url: `https://archive.org/download/${identifier}/${f.name}`,
    length: parseDuration(f.length),
    showIdentifier: identifier 
  }));
};