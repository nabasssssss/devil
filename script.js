const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

// Map-focused responses
const BOT_MSGS = [
  "Where would you like to explore today?",
  "You can search for places, dropped pins, or routes using the search bar above.",
  "Click any marker on the map to inspect location details.",
  "Try asking for directions, or click 'Find Points of Interest' on the map!"
];

// Map-themed avatars
const BOT_IMG = "https://image.flaticon.com/icons/svg/854/854878.svg"; // Map pin/navigation icon
const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
const BOT_NAME = "Map Guide";
const PERSON_NAME = "User";

msgerForm.addEventListener("submit", event => {
  event.preventDefault();

  const msgText = msgerInput.value.trim();
  if (!msgText) return;

  appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
  msgerInput.value = "";
  
  // Route user query to map logic or bot message
  handleMapQuery(msgText);
});

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

function handleMapQuery(userInput) {
  // Simple keyword routing for map feature interactions
  const inputLower = userInput.toLowerCase();
  
  if (inputLower.includes("route") || inputLower.includes("directions")) {
    setTimeout(() => {
      appendMessage(BOT_NAME, BOT_IMG, "left", "To calculate a route, click a starting point and a destination point on the map.");
    }, 600);
  } else if (inputLower.includes("search") || inputLower.includes("find")) {
    setTimeout(() => {
      appendMessage(BOT_NAME, BOT_IMG, "left", "Searching map database... Try typing a city name, postal code, or landmark.");
    }, 600);
  } else {
    // Fallback random map tip
    botResponse();
  }
}

function botResponse() {
  const r = random(0, BOT_MSGS.length - 1);
  const msgText = BOT_MSGS[r];
  const delay = msgText.split(" ").length * 80;

  setTimeout(() => {
    appendMessage(BOT_NAME, BOT_IMG, "left", msgText);
  }, delay);
}

// Utility Functions
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
