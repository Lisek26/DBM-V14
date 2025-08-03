const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Funkcja do wczytywania konfiguracji z pliku
function loadRelayConfig() {
  const filePath = path.join(__dirname, 'relay_config.json');
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error("❌ Błąd przy wczytywaniu pliku relay_config.json:", err);
      return [];
    }
  }
  return [];
}

// Funkcja do zapisywania konfiguracji do pliku
function saveRelayConfig(config) {
  const filePath = path.join(__dirname, 'relay_config.json');
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

let relayChannels = loadRelayConfig();

module.exports = {
  name: "Relay Message Embed",
  section: "Messaging",

  meta: {
    version: "7.3.4",
    preciseCheck: false,
    author: "liseczkowy",
  },

  fields: ["channelIds"],

  html() {
    return `
    <div style="padding: 10px;">
      <span class="dbminputlabel">ID kanałów (oddzielone przecinkami)</span><br>
      <input id="channelIds" class="round" style="width:100%" placeholder="np. 1234567890,9876543210"/><br><br>
      <p>📌 Kanały dodaje się tylko ręcznie tutaj. Kanał źródłowy nie otrzyma wiadomości zwrotnej.</p>
    </div>
    `;
  },

  init() {},

  async action(cache) {
    const data = cache.actions[cache.index];
    const inputIds = this.evalMessage(data.channelIds, cache);
    const currentChannel = cache.msg?.channel || cache.interaction?.channel;
    const guild = currentChannel?.guild;

    if (!currentChannel || !guild) {
      console.error("❌ Nie znaleziono kanału lub gildii.");
      return this.callNextAction(cache);
    }

    // Dodawanie nowych kanałów z DBM tylko raz
    if (inputIds) {
      const newIds = inputIds.split(',').map(id => id.trim()).filter(Boolean);
      let added = 0;
      for (const id of newIds) {
        const exists = relayChannels.some(c => c.channelId === id && c.guildId === guild.id);
        if (!exists) {
          relayChannels.push({ channelId: id, guildId: guild.id });
          added++;
        }
      }
      if (added > 0) {
        saveRelayConfig(relayChannels);
        currentChannel.send(`✅ Dodano ${added} kanał(y) relay do konfiguracji.`);
      }
    }

    // Sprawdzanie, czy wiadomość ma załącznik (np. obraz)
    const attachment = cache.msg.attachments.first();
    let imageURL = null;
    if (attachment && attachment.contentType && attachment.contentType.startsWith('image/')) {
      imageURL = attachment.url;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ffcc)
      .setDescription(cache.msg.content || "(brak treści)")
      .setAuthor({
        name: cache.msg.author?.tag || "Nieznany",
        iconURL: cache.msg.author?.displayAvatarURL({ dynamic: true }) || null,
      })
      .setFooter({ text: `Z serwera: ${guild.name}` });

    // Dodanie obrazka do embeda, jeśli istnieje
    if (imageURL) {
      embed.setImage(imageURL);
    }

    const uniqueTargets = new Set();
    for (const { guildId, channelId } of relayChannels) {
      // Pomiń kanał źródłowy i zduplikowane ID
      if (channelId === currentChannel.id || uniqueTargets.has(channelId)) continue;
      uniqueTargets.add(channelId);

      try {
        const targetChannel = await currentChannel.client.channels.fetch(channelId);
        if (targetChannel?.isTextBased()) {
          await targetChannel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error(`❌ Błąd wysyłania do ${channelId} (${guildId}):`, err);
      }
    }

    this.callNextAction(cache);
  },

  mod() {},
};

