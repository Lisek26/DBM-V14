module.exports = {
  name: "Losowe Zdjęcie z Folderu",
  section: "Messaging",

  meta: {
    version: "1.2",
    preciseCheck: false,
    author: "Liseczkowy",
    authorUrl: null,
    downloadUrl: null,
  },

  fields: ["folderPath", "embedTitle", "embedColor", "footer"],

  html() {
    return `
    <div style="padding: 10px;">
      <span class="dbminputlabel">Folder z obrazkami (folder musi być w plikach bota)</span><br>
      <input id="folderPath" class="round" type="text" placeholder="images" style="width: 100%;"><br><br>

      <span class="dbminputlabel">Tytuł embeda</span><br>
      <input id="embedTitle" class="round" type="text" placeholder="Losowe zdjęcie" style="width: 100%;"><br><br>

      <span class="dbminputlabel">Kolor embeda (hex)</span><br>
      <input id="embedColor" class="round" type="text" placeholder="#00ffcc" style="width: 100%;"><br><br>

      <span class="dbminputlabel">Footer</span><br>
      <input id="footer" class="round" type="text" placeholder="Wpisz tutaj footer!" style="width: 100%;">
    </div>`;
  },

  init() {},

  async action(cache) {
    const data = cache.actions[cache.index];
    const fs = require("fs");
    const path = require("path");
    const { EmbedBuilder, AttachmentBuilder } = require("discord.js");

    const folderPath = this.evalMessage(data.folderPath, cache);
    const embedTitle = this.evalMessage(data.embedTitle, cache) || "Losowe zdjęcie";
    const embedColor = this.evalMessage(data.embedColor, cache) || "#00ffcc";
    const footer = this.evalMessage(data.footer, cache) || "";

    try {
      const folderFullPath = path.join(__dirname, '..', folderPath);  
      const files = fs.readdirSync(folderFullPath).filter(file =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );

      if (!files.length) {
        console.error(`❌ Brak plików graficznych w folderze: ${folderFullPath}`);
        return this.callNextAction(cache);
      }

      const randomFile = files[Math.floor(Math.random() * files.length)];
      const fullPath = path.join(folderFullPath, randomFile);

      const fileNameWithoutExtension = randomFile.replace(/\.[^/.]+$/, "");
      const safeName = randomFile.replace(/[^\w.-]/g, "_");
      const attachment = new AttachmentBuilder(fullPath, { name: safeName });

      const embed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setColor(embedColor)
        .setImage("attachment://" + safeName)
        .setDescription(fileNameWithoutExtension);

      if (footer.trim()) {
        embed.setFooter({ text: footer });
      }

      const channel = cache.interaction?.channel || cache.msg?.channel;
      if (!channel?.send) {
        console.error("❌ Nie znaleziono kanału do wysyłki wiadomości.");
        return this.callNextAction(cache);
      }

      await channel.send({ embeds: [embed], files: [attachment] });
    } catch (err) {
      console.error("❌ Błąd przy ładowaniu obrazu:", err);
    }

    this.callNextAction(cache);
  },

  mod() {},
};
