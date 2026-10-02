const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

// Map places with image URLs, descriptions, and coordinates
const PLACES_DATABASE = [
  {
    name: "Edinburgh Castle",
    location: "Edinburgh, Scotland",
    img: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=500",
    description: "Historic fortress dominating the skyline of Edinburgh from Castle Rock.",
    coords: [55.9486, -3.1999]
  },
  {
    name: "Eiffel Tower",
    location: "Paris, France",
    img: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500",
    description: "Iconic 19th-century wrought-iron lattice tower on the Champ de Mars.",
    coords: [48.8584, 2.2945]
  },
  {
    name: "Colosseum",
    location: "Rome, Italy",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500",
    description: "Ancient amphitheatre built during the Roman Empire in the center of Rome.",
    coords: [41.8902, 12.4922]
  },
  {
    name: "Fushimi Inari Shrine",
    location: "Kyoto, Japan",
    img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500",
    description: "Shinto shrine famous for thousands of vibrant orange torii gates.",
    coords: [34.9671, 135.7727]
  }
];

const BOT_IMG = "https://image.flaticon.com/icons/svg/854/854878.svg";
const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
const BOT_NAME = "Map Guide";
const PERSON_NAME = "User";

msgerForm.addEventListener("submit", event => {
  event.preventDefault();

  const msgText = msgerInput.value.trim();
  if (!msgText) return;

  appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
  msgerInput.value = "";
  
  handleMapQuery(msgText);
});

// Standard text message renderer
function appendMessage(name, img, side, text) {
  const safeText = escapeHTML(text);

  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${safeText}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop = msgerChat.scrollHeight;
}

// Special renderer for places with photos and map action buttons
function appendPlaceCard(place) {
  const cardHTML = `
    <div class="msg left-msg">
      <div class="msg-img" style="background-image: url(${BOT_IMG})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${BOT_NAME}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">
          <div class="place-card">
            <img src="${place.img}" alt="${escapeHTML(place.name)}" class="place-photo" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:8px;" />
            <strong>📍 ${escapeHTML(place.name)}</strong>
            <p style="margin: 4px 0; font-size: 0.85em; color: #666;">${escapeHTML(place.location)}</p>
            <p style="margin: 6px 0; font-size: 0.9em;">${escapeHTML(place.description)}</p>
            <button onclick="panToCoordinates(${place.coords[0]}, ${place.coords[1]})" style="background:#007bff; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85em; margin-top:4px;">
              Center on Map
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", cardHTML);
  msgerChat.scrollTop = msgerChat.scrollHeight;
}

function handleMapQuery(userInput) {
  const query = userInput.toLowerCase();

  // Search if the query matches any place in our database
  const foundPlace = PLACES_DATABASE.find(p => 
    query.includes(p.name.toLowerCase()) || 
    query.includes(p.location.toLowerCase().split(",")[0])
  );

  if (foundPlace) {
    setTimeout(() => {
      appendPlaceCard(foundPlace);
    }, 500);
  } else {
    // Show a random featured place card if no specific match is found
    const randomPlace = PLACES_DATABASE[random(0, PLACES_DATABASE.length - 1)];
    setTimeout(() => {
      appendMessage(BOT_NAME, BOT_IMG, "left", `Here is a featured landmark you can check out on the map:`);
      appendPlaceCard(randomPlace);
    }, 600);
  }
}

// Function called by the card button to sync with your map UI
function panToCoordinates(lat, lng) {
  if (window.map) {
    window.map.flyTo([lat, lng], 15);
  } else {
    console.log(`Map target: ${lat}, ${lng}`);
  }
}

// Utilities
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();
  return `${h.slice(-2)}:${m.slice(-2)}`;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
