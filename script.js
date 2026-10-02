import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class Main {

    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Routes
        server.createContext("/", new StaticFileHandler());
        server.createContext("/api/place", new PlaceApiHandler());

        server.setExecutor(null);
        System.out.println("Server running on http://localhost:" + port);
        server.start();
    }

    // Handles serving the HTML webpage
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            byte[] response = HTML_PAGE.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        }
    }

    // Handles fetching place data from OpenStreetMap Nominatim
    static class PlaceApiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            String queryParam = exchange.getRequestURI().getQuery();
            String query = "";

            if (queryParam != null && queryParam.startsWith("q=")) {
                query = URLDecoder.decode(queryParam.substring(2), StandardCharsets.UTF_8);
            }

            if (query.trim().isEmpty()) {
                String errorJson = "{\"success\": false, \"message\": \"Query parameter required\"}";
                sendJson(exchange, 400, errorJson);
                return;
            }

            try {
                String placeJson = fetchFromNominatim(query);
                sendJson(exchange, 200, placeJson);
            } catch (Exception e) {
                String errorJson = "{\"success\": false, \"message\": \"Failed to gather place information\"}";
                sendJson(exchange, 500, errorJson);
            }
        }

        private void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
            byte[] response = json.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        }

        private String fetchFromNominatim(String searchQuery) throws Exception {
            String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
            String urlString = "https://nominatim.openstreetmap.org/search?q=" + encodedQuery + "&format=json&addressdetails=1&limit=1";

            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "JavaChatApp/1.0");

            if (conn.getResponseCode() != 200) {
                return "{\"success\": false, \"message\": \"Location lookup failed\"}";
            }

            StringBuilder apiResponse = new StringBuilder();
            try (InputStream is = conn.getInputStream();
                 BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    apiResponse.append(line);
                }
            }

            String jsonText = apiResponse.toString();
            if (jsonText.equals("[]") || jsonText.isEmpty()) {
                return "{\"success\": false, \"message\": \"No matching locations found\"}";
            }

            // Extract values manually to avoid external libraries
            String name = extractJsonValue(jsonText, "display_name");
            String lat = extractJsonValue(jsonText, "lat");
            String lon = extractJsonValue(jsonText, "lon");
            String placeClass = extractJsonValue(jsonText, "class");
            String placeType = extractJsonValue(jsonText, "type");

            String title = name.contains(",") ? name.substring(0, name.indexOf(",")) : name;
            String cleanName = escapeJson(title);
            String cleanAddress = escapeJson(name);
            String description = escapeJson("Category: " + placeClass + " (" + placeType + ")");

            return "{"
                + "\"success\": true,"
                + "\"data\": {"
                + "\"name\": \"" + cleanName + "\","
                + "\"address\": \"" + cleanAddress + "\","
                + "\"description\": \"" + description + "\","
                + "\"lat\": " + (lat.isEmpty() ? "0" : lat) + ","
                + "\"lng\": " + (lon.isEmpty() ? "0" : lon) + ","
                + "\"photo_url\": \"https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80\""
                + "}"
                + "}";
        }

        private String extractJsonValue(String json, String key) {
            String pattern = "\"" + key + "\":\"";
            int start = json.indexOf(pattern);
            if (start == -1) {
                pattern = "\"" + key + "\":";
                start = json.indexOf(pattern);
                if (start == -1) return "";
                start += pattern.length();
                int end = json.indexOf(",", start);
                if (end == -1) end = json.indexOf("}", start);
                return json.substring(start, end).replace("\"", "").trim();
            }
            start += pattern.length();
            int end = json.indexOf("\"", start);
            return (end != -1) ? json.substring(start, end) : "";
        }

        private String escapeJson(String text) {
            if (text == null) return "";
            return text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
        }
    }

    // HTML, CSS, and JS embedded in a single String template
    private static final String HTML_PAGE = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Java Chat Places Assistant</title>
          <style>
            :root {
              --body-bg: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              --msger-bg: #fff;
              --border: 2px solid #ddd;
              --left-msg-bg: #ececec;
              --right-msg-bg: #579ffb;
              --primary-btn-bg: #007bff;
              --primary-btn-hover: #0056b3;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex; justify-content: center; align-items: center;
              height: 100vh; background-image: var(--body-bg);
              font-family: Helvetica, Arial, sans-serif;
            }
            .msger {
              display: flex; flex-flow: column wrap; justify-content: space-between;
              width: 100%; max-width: 800px; height: 90vh;
              border: var(--border); border-radius: 8px; background: var(--msger-bg);
              box-shadow: 0 15px 15px -5px rgba(0, 0, 0, 0.2);
            }
            .msger-header {
              padding: 12px 16px; border-bottom: var(--border); background: #eee;
              color: #444; font-weight: bold; display: flex; justify-content: space-between;
            }
            .msger-chat {
              flex: 1; overflow-y: auto; padding: 15px; background-color: #fcfcfe;
            }
            .msg { display: flex; align-items: flex-end; margin-bottom: 15px; }
            .msg-img {
              width: 42px; height: 42px; margin-right: 10px;
              background: #ddd center/cover no-repeat; border-radius: 50%; flex-shrink: 0;
            }
            .msg-bubble {
              max-width: 450px; padding: 12px 16px; border-radius: 12px;
              background: var(--left-msg-bg); color: #222;
            }
            .msg-info { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .msg-info-name { font-weight: bold; font-size: 0.9em; margin-right: 10px; }
            .msg-info-time { font-size: 0.78em; color: #666; }
            .right-msg { flex-direction: row-reverse; }
            .right-msg .msg-bubble { background: var(--right-msg-bg); color: #fff; }
            .right-msg .msg-img { margin: 0 0 0 10px; }
            .msger-inputarea { display: flex; padding: 10px; border-top: var(--border); background: #eee; }
            .msger-input {
              flex: 1; padding: 10px 14px; border: none; border-radius: 4px;
              font-size: 1em; background: #ddd; outline: none;
            }
            .msger-send-btn {
              margin-left: 10px; padding: 10px 18px; background: rgb(0, 196, 65);
              color: #fff; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;
            }
            .place-card { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
            .place-photo { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; }
            .place-title { font-size: 1.1em; font-weight: bold; color: #111; }
            .place-location { font-size: 0.85em; color: #555; }
            .place-description { font-size: 0.9em; color: #333; line-height: 1.4; }
            .map-btn {
              align-self: flex-start; background: var(--primary-btn-bg); color: #fff;
              padding: 8px 14px; border-radius: 6px; font-size: 0.85em; font-weight: bold;
              text-decoration: none; margin-top: 4px; display: inline-block;
            }
          </style>
        </head>
        <body>
          <section class="msger">
            <header class="msger-header">
              <span>📍 Place Finder Assistant</span>
              <span>● Online</span>
            </header>
            <main class="msger-chat" id="msgerChat">
              <div class="msg left-msg">
                <div class="msg-img" style="background-image: url('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80')"></div>
                <div class="msg-bubble">
                  <div class="msg-info">
                    <div class="msg-info-name">Assistant</div>
                    <div class="msg-info-time">Just now</div>
                  </div>
                  <div class="msg-text">
                    Hi! Enter a location or place name (e.g., "Eiffel Tower" or "Central Park").
                  </div>
                </div>
              </div>
            </main>
            <form class="msger-inputarea" id="msgerForm">
              <input type="text" class="msger-input" id="msgerInput" placeholder="Type a place name..." autocomplete="off">
              <button type="submit" class="msger-send-btn">Send</button>
            </form>
          </section>

          <script>
            const msgerForm = document.getElementById("msgerForm");
            const msgerInput = document.getElementById("msgerInput");
            const msgerChat = document.getElementById("msgerChat");

            const BOT_IMG = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
            const PERSON_IMG = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80";

            msgerForm.addEventListener("submit", async (e) => {
              e.preventDefault();
              const text = msgerInput.value.trim();
              if (!text) return;

              appendMessage("You", PERSON_IMG, "right", text);
              msgerInput.value = "";

              const loadingId = appendMessage("Assistant", BOT_IMG, "left", "Searching for place details...");

              try {
                const res = await fetch("/api/place?q=" + encodeURIComponent(text));
                const data = await res.json();
                const elem = document.getElementById(loadingId);

                if (!res.ok || !data.success) {
                  elem.querySelector(".msg-text").innerText = data.message || "No place found.";
                  return;
                }

                const place = data.data;
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
                
                elem.querySelector(".msg-text").innerHTML = `
                  <div class="place-card">
                    <img class="place-photo" src="${place.photo_url}" alt="${place.name}">
                    <div class="place-title">${place.name}</div>
                    <div class="place-location">📍 ${place.address}</div>
                    <p class="place-description">${place.description}</p>
                    <a class="map-btn" href="${mapUrl}" target="_blank">🗺️ View on Google Maps</a>
                  </div>
                `;
              } catch (err) {
                document.getElementById(loadingId).querySelector(".msg-text").innerText = "Error fetching location.";
              }
            });

            function appendMessage(name, img, side, text) {
              const id = "msg-" + Date.now();
              const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const html = `
                <div class="msg ${side}-msg" id="${id}">
                  <div class="msg-img" style="background-image: url(${img})"></div>
                  <div class="msg-bubble">
                    <div class="msg-info">
                      <div class="msg-info-name">${name}</div>
                      <div class="msg-info-time">${time}</div>
                    </div>
                    <div class="msg-text">${text}</div>
                  </div>
                </div>
              `;
              msgerChat.insertAdjacentHTML("beforeend", html);
              msgerChat.scrollTop += 500;
              return id;
            }
          </script>
        </body>
        </html>
        """;
}
