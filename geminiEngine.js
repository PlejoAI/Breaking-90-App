const DEFAULT_API_BASE_URL = 'https://savage-golf-api.onrender.com';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

function absolutize(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function analyzeSwingVideo(uri) {
  const formData = new FormData();
  formData.append('video', {
    uri,
    name: 'swing.mp4',
    type: 'video/mp4'
  });

  const response = await fetch(`${API_BASE_URL}/api/analyze-swing`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json'
    }
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Backend returned invalid JSON: ${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `Backend error ${response.status}`);
  }

  if (data.skeleton_video_url) {
    data.skeleton_video_url = absolutize(data.skeleton_video_url);
    data.overlay_available = true;
  }

  return data;
}

export async function generateRoastAudio(text) {
  const response = await fetch(`${API_BASE_URL}/api/generate-roast-audio`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return absolutize(data.audio_url);
}

export async function askGolfAssistant(question) {
  // The recovered backend does not currently include a caddie/assistant endpoint.
  // Keep the UI usable until we add one.
  return `Chad's caddie radio is not wired to the backend yet, but here's the honest answer: ${question}`;
}
