// server/utils/sse.js
const clients = [];

function pushTranscript(payload) {
  const speaker =
    payload.track === "inbound_track"
      ? "caller"
      : payload.track === "outbound_track"
      ? "agent"
      : "unknown";

  const data = {
    id: Date.now().toString(),
    speaker,
    content: payload.text,
    final: payload.final || false,
  };

  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of [...clients]) {
    try {
      client.write(msg);
    } catch (err) {
      console.error("⚠️ Dropping SSE client:", err);
      client.close();
      clients.splice(clients.indexOf(client), 1);
    }
  }
}

function addClient(client) {
  clients.push(client);
}

function removeClient(client) {
  const idx = clients.indexOf(client);
  if (idx >= 0) clients.splice(idx, 1);
}

module.exports = { pushTranscript, addClient, removeClient };
