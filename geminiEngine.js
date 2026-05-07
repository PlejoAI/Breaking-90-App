const DEFAULT_API_BASE_URL = 'https://savage-golf-api.onrender.com';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

function errorMessage(value, fallback = 'Something went wrong.') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (value.message && typeof value.message === 'string') return value.message;
  if (value.detail) return errorMessage(value.detail, fallback);
  if (value.error) return errorMessage(value.error, fallback);
  try {
    return JSON.stringify(value);
  } catch (_) {
    return String(value);
  }
}

function absolutize(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function analyzeSwingVideo(uri) {
  const formData = new FormData();

  // React Native wants the { uri, name, type } object, but Expo web needs a real
  // Blob/File. Sending the RN object from web is what produces backend errors
  // that show up as "[object Object]" in the app.
  let attached = false;
  if (typeof fetch === 'function' && typeof Blob !== 'undefined' && /^(blob:|data:|https?:)/i.test(uri)) {
    try {
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      if (blob && blob.size > 0) {
        formData.append('video', blob, 'swing.mp4');
        attached = true;
      }
    } catch (error) {
      console.log('Web video blob conversion failed, falling back to native upload shape:', error);
    }
  }

  if (!attached) {
    formData.append('video', {
      uri,
      name: 'swing.mp4',
      type: 'video/mp4'
    });
  }

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
    throw new Error(errorMessage(data, `Backend error ${response.status}`));
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
  const response = await fetch(`${API_BASE_URL}/api/ask-caddie`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorMessage(data, `Caddie backend error ${response.status}`));
  }

  return data.answer || data.response || 'Chad came back with nothing. Ask that one again.';
}
