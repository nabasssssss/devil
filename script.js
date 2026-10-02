const msgerForm = id("msgerForm");
const msgerInput = id("msgerInput");
const msgerChat = id("msgerChat");

const BOT_IMG = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
const PERSON_IMG = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80";
const BOT_NAME = "Assistant";
const PERSON_NAME = "You";

msgerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const msgText = msgerInput.value.trim();
  if (!msgText) return;

  // Render User Message
  appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
  msgerInput.value = "";

  // Render Loading Indicator
  const loadingId = appendMessage(BOT_NAME, BOT_IMG, "left", "Searching for details...");

  // Gather & Render Place Data
  await fetchAndRenderPlace(msgText, loadingId);
});

async function fetchAndRenderPlace(query, loadingMsgId) {
  try {
    // 1. Fetch place info from backend API route
    const response = await fetch(`/api/place?q=${encodeURIComponent(query)}`);
    const result = await response.json();

    const loadingElement = id(loadingMsgId);

    if (!response.ok || !result.success || !result.data) {
      if (loadingElement) {
        loadingElement.querySelector(".msg-text").innerText = "Sorry, I couldn't find any matching details for that location.";
      }
      return;
    }

    // 2. Normalize and extract place data cleanly
    const place = formatPlaceData(result.data);

    // 3. Render Place Card HTML inside the chat bubble
    const cardHTML = renderPlaceCard(place);
    if (loadingElement) {
      loadingElement.querySelector(".msg-text").innerHTML = cardHTML;
    }
  } catch (error) {
    console.error("Data gathering error:", error);
    const loadingElement = id(loadingMsgId);
    if (loadingElement) {
      loadingElement.querySelector(".msg-text").innerText = "An error occurred while fetching information.";
    }
  }
}

/**
 * Normalizes input data regardless of whether it's Google Places API or direct data.
 */
function formatPlaceData(data) {
  const title = data.name || "Unknown Location";
  const location = data.formatted_address || data.address || data.vicinity || "Address not available";
  const description = data.editorial_summary?.overview || data.description || "No description provided for this place.";
  
  // Extract or build Image URL safely
  let photoUrl = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80"; // fallback
  if (data.photo_url) {
    photoUrl = data.photo_url;
  } else if (data.photos && data.photos.length > 0) {
    // If using Google Places photos directly:
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${data.photos[0].photo_reference}&key=YOUR_GOOGLE_MAPS_API_KEY`;
  }

  // Coordinates for Map Button
  const lat = data.geometry?.location?.lat || data.lat;
  const lng = data.geometry?.location?.lng || data.lng;
  const mapUrl = (lat && lng) 
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + location)}`;

  return { title, location, description, photoUrl, mapUrl };
}

/**
 * Generates the HTML layout matching CSS classes.
 */
function renderPlaceCard(place) {
  return `
    <div class="place-card">
      <img class="place-photo" src="${place.photoUrl}" alt="${place.title}" onerror="this.src='https://via.placeholder.com/400x180?text=Photo+Unavailable';">
      <div class="place-title">${escapeHTML(place.title)}</div>
      <div class="place-location">📍 ${escapeHTML(place.location)}</div>
      <p class="place-description">${escapeHTML(place.description)}</p>
      <a class="map-btn" href="${place.mapUrl}" target="_blank" rel="noopener noreferrer">
        🗺️ View on Google Maps
      </a>
    </div>
  `;
}

function appendMessage(name, img, side, text) {
  const msgId = "msg-" + Date.now();
  const msgHTML = `
    <div class="msg ${side}-msg" id="${msgId}">
      <div class="msg-img" style="background-image: url(${img})"></div>
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>
        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
  return msgId;
}

// Helpers
function id(elementId) {
  return document.getElementById(elementId);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();
  return `${h.slice(-2)}:${m.slice(-2)}`;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
