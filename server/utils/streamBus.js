// server/utils/streamBus.js

const clients = [];

/**
 * Map track type to speaker label.
 * @param {string} [track] - e.g. "inbound", "outbound_track"
 * @returns {string} - "caller" | "agent" | "unknown"
 */
function trackToSpeaker(track) {
  if (!track) return "unknown";
  const t = track.toLowerCase();
  if (t === "inbound" || t === "inbound_track") return "caller";
  if (t === "outbound" || t === "outbound_track") return "agent";
  return "unknown";
}

/**
 * Add an SSE client connection.
 * @param {{ write: Function, close: Function }} client
 */
function addClient(client) {
  clients.push(client);
}

/**
 * Remove an SSE client connection.
 * @param {{ write: Function, close: Function }} client
 */
function removeClient(client) {
  const i = clients.indexOf(client);
  if (i >= 0) clients.splice(i, 1);
}

/**
 * Broadcast a transcript event to all connected SSE clients.
 * @param {{ text: string, track?: string, speaker?: string, final?: boolean }} payload
 */
function pushTranscript(payload) {
  const speaker = payload.speaker || trackToSpeaker(payload.track);
  const data = {
    id: Date.now().toString(),
    speaker,
    content: payload.text,
    final: !!payload.final,
  };
  const msg = `data: ${JSON.stringify(data)}\n\n`;

  for (const c of [...clients]) {
    try {
      c.write(msg);
    } catch (err) {
      try {
        c.close();
      } catch {}
      removeClient(c);
    }
  }
}

// ✅ Export in CommonJS format
module.exports = {
  addClient,
  removeClient,
  pushTranscript,
};
