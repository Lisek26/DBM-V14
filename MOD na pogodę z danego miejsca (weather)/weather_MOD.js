module.exports = {
  name: "Weather",
  section: "Other Stuff",
  meta: {
    version: "3.2.4",
    preciseCheck: true,
    author: "liseczkowy",
    authorUrl: "https://github.com/Lisek26/DBM-V14",
    downloadURL:
      "https://github.com/Lisek26/DBM-V14/blob/main/MOD%20na%20pogodę%20z%20danego%20miejsca%20(weather)/weather_MOD.js
  },

  subtitle(data) {
    const info = [
      "Temperature",
      "Weather Text",
      "Date",
      "City",
      "Country",
      "Unused but needed!",
      "Wind Speed",
      "Humidity",
      "Wind Direction",
      "Humidity",
      "Unused but needed!",
      "Unused but needed!",
      "Unused but needed!",
      "Unused but needed!",
      "Feels like",
      "Image URL",
      "Current Day",
    ];
    return `${info[parseInt(data.info, 10)]}`;
  },

  variableStorage(data, varType) {
    if (parseInt(data.storage, 10) !== varType) return;
    let dataType = "Unknown Weather Type";
    switch (parseInt(data.info, 10)) {
      case 0:
        dataType = "Temperature";
        break;
      case 1:
        dataType = "Weather Text";
        break;
      case 2:
        dataType = "Date";
        break;
      case 3:
        dataType = "Weather City";
        break;
      case 4:
        dataType = "Weather Country";
        break;
      case 6:
        dataType = "Wind Speed";
        break;
      case 8:
        dataType = "Wind Direction";
        break;
      case 9:
        dataType = "Atmosphere Humidity";
        break;
      case 14:
        dataType = "Feels like";
        break;
      case 15:
        dataType = "Image URL";
        break;
      case 16:
        dataType = "Current Day";
        break;
    }
    return [data.varName, dataType];
  },

  fields: ["city", "degreeType", "info", "storage", "varName"],

  html() {
    return `
<div>
  <div style="float: left; width: 54%; padding-top: 16px; padding-right: 8px;">
    <span class="dbminputlabel">Miasto</span>
    <input id="city" class="round" type="text">
  </div>
  <div style="float: right; width: 44%; padding-top: 16px;">
    <span class="dbminputlabel">Jednostka temperatury</span>
    <select id="degreeType" class="round">
      <option value="F">Farhenheit</option>
      <option value="C">Celsius</option>
    </select>
  </div>
<br>

<div style="float: left; width: 100%; padding-top: 16px;">
  <span class="dbminputlabel">Jaką informację pobrać?</span>
  <select id="info" class="round">
    <option value="0">Temperatura</option>
    <option value="14">Odczuwalna</option>
    <option value="1">Opis pogody (EN)</option>
    <option value="20">Opis pogody (PL)</option>
    <option value="2">Data</option>
    <option value="3">Miasto</option>
    <option value="6">Prędkość wiatru</option>
    <option value="8">Kierunek wiatru</option>
    <option value="9">Wilgotność</option>
    <option value="15">URL ikony pogody</option>
    <option value="21">Ciśnienie</option>
    <option value="22">UV</option>
    <option value="23">Widoczność</option>
    <option value="24">Punkt rosy</option>
    <option value="25">Indeks ciepła</option>
    <option value="16">Dzień tygodnia</option>
  </select>
</div>

<div style="float: left; width: 100%; padding-top: 16px;">
  <store-in-variable dropdownLabel="Zapisz do" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></store-in-variable>
</div>`;
  },

  init() {},

  async action(cache) {
    const data = cache.actions[cache.index];
    const Mods = this.getMods();
    const weather = Mods.require("weather-js");
    const city = this.evalMessage(data.city, cache);
    const degreeType = this.evalMessage(data.degreeType, cache);
    const { Actions } = this.getDBM();
    const Discord = Mods.require("discord.js");

    if (!city) {
      console.error("Please specify a city to get weather information.");
      return this.callNextAction(cache);
    }

    weather.find({ search: city, degreeType }, async (err, response) => {
      if (err || !response || !response[0]) {
        if (cache.interaction && typeof cache.interaction.reply === 'function' && !cache.interaction.replied && !cache.interaction.deferred) {
          await cache.interaction.reply({ content: `Nie znaleziono pogody dla miasta **${city}**.` });
        } else if (cache.msg && typeof cache.msg.reply === 'function') {
          cache.msg.reply(`Nie znaleziono pogody dla miasta **${city}**.`);
        }
        return Actions.callNextAction(cache);
      }
      const current = response[0].current;
      const location = response[0].location;

      // Tłumaczenia dni tygodnia, miesięcy, krajów, pogody na polski
      const dni = { 'Monday': 'Poniedziałek', 'Tuesday': 'Wtorek', 'Wednesday': 'Środa', 'Thursday': 'Czwartek', 'Friday': 'Piątek', 'Saturday': 'Sobota', 'Sunday': 'Niedziela' };
      const miesiace = { 'Jan': 'stycznia', 'Feb': 'lutego', 'Mar': 'marca', 'Apr': 'kwietnia', 'May': 'maja', 'Jun': 'czerwca', 'Jul': 'lipca', 'Aug': 'sierpnia', 'Sep': 'września', 'Oct': 'października', 'Nov': 'listopada', 'Dec': 'grudnia' };
      const kraje = {
        'Poland': 'Polska', 'Germany': 'Niemcy', 'France': 'Francja', 'United Kingdom': 'Wielka Brytania', 'Italy': 'Włochy', 'Spain': 'Hiszpania', 'Czech Republic': 'Czechy', 'Slovakia': 'Słowacja', 'Ukraine': 'Ukraina', 'Russia': 'Rosja', 'USA': 'Stany Zjednoczone', 'United States': 'Stany Zjednoczone', 'Netherlands': 'Holandia', 'Belgium': 'Belgia', 'Sweden': 'Szwecja', 'Norway': 'Norwegia', 'Denmark': 'Dania', 'Austria': 'Austria', 'Switzerland': 'Szwajcaria', 'Portugal': 'Portugalia', 'Greece': 'Grecja', 'Turkey': 'Turcja', 'Finland': 'Finlandia', 'Hungary': 'Węgry', 'Romania': 'Rumunia', 'Bulgaria': 'Bułgaria', 'Serbia': 'Serbia', 'Croatia': 'Chorwacja', 'Slovenia': 'Słowenia', 'Lithuania': 'Litwa', 'Latvia': 'Łotwa', 'Estonia': 'Estonia', 'Ireland': 'Irlandia', 'Iceland': 'Islandia', 'China': 'Chiny', 'Japan': 'Japonia', 'South Korea': 'Korea Południowa', 'North Korea': 'Korea Północna', 'India': 'Indie', 'Brazil': 'Brazylia', 'Argentina': 'Argentyna', 'Canada': 'Kanada', 'Australia': 'Australia', 'Egypt': 'Egipt', 'Morocco': 'Maroko', 'Mexico': 'Meksyk', 'Israel': 'Izrael', 'Saudi Arabia': 'Arabia Saudyjska', 'United Arab Emirates': 'Zjednoczone Emiraty Arabskie', 'South Africa': 'RPA', 'New Zealand': 'Nowa Zelandia'
      };
      const pogoda = {
        'Sunny': 'Słonecznie', 'Clear': 'Czyste niebo', 'Mostly Sunny': 'Przeważnie słonecznie', 'Partly Sunny': 'Częściowo słonecznie', 'Cloudy': 'Pochmurno', 'Mostly Cloudy': 'Przeważnie pochmurno', 'Partly Cloudy': 'Częściowo pochmurno', 'Overcast': 'Zachmurzenie całkowite', 'Rain': 'Deszcz', 'Light Rain': 'Lekki deszcz', 'Showers': 'Przelotne opady', 'Scattered Showers': 'Rozproszone opady', 'Thunderstorms': 'Burze', 'Scattered Thunderstorms': 'Rozproszone burze', 'Snow': 'Śnieg', 'Light Snow': 'Lekki śnieg', 'Flurries': 'Przelotne opady śniegu', 'Fog': 'Mgła', 'Haze': 'Zamglenie', 'Windy': 'Wietrznie', 'Sleet': 'Deszcz ze śniegiem', 'Icy': 'Oblodzenie', 'Hot': 'Gorąco', 'Cold': 'Zimno', 'Drizzle': 'Mżawka', 'Mist': 'Mgła', 'Blizzard': 'Zamieć', 'Hail': 'Grad', 'Smoke': 'Dym', 'Dust': 'Pył', 'Sand': 'Piasek', 'Tornado': 'Tornado', 'Hurricane': 'Huragan', 'Tropical Storm': 'Sztorm tropikalny', 'Freezing Rain': 'Marznący deszcz', 'Light Freezing Rain': 'Lekki marznący deszcz', 'Heavy Rain': 'Ulewny deszcz', 'Heavy Snow': 'Obfity śnieg', 'Moderate Rain': 'Umiarkowany deszcz', 'Moderate Snow': 'Umiarkowany śnieg', 'Light Showers': 'Lekkie przelotne opady', 'Heavy Showers': 'Ulewne przelotne opady', 'Light Thunderstorms': 'Lekkie burze', 'Heavy Thunderstorms': 'Silne burze', 'Scattered Snow Showers': 'Rozproszone opady śniegu', 'Scattered Snow': 'Rozproszony śnieg', 'Scattered Rain Showers': 'Rozproszone opady deszczu', 'Scattered Rain': 'Rozproszony deszcz', 'Rain Showers': 'Opady deszczu', 'Snow Showers': 'Opady śniegu', 'Mostly Clear': 'Przeważnie czysto', 'Mostly Fair': 'Przeważnie pogodnie', 'Fair': 'Pogodnie', 'Unknown': 'Nieznana pogoda'
      };

      let dzien = dni[current.day] || current.day || '-';
      let data = current.date || '-';
      if (data && data.match(/\d{1,2} \w{3} \d{4}/)) {
        data = data.replace(/(\d{1,2}) (\w{3}) (\d{4})/, (m, d, msc, y) => `${d} ${miesiace[msc] || msc} ${y}`);
      }

      // Kierunek wiatru jako tekst (np. N, NE, E...)
      let windDir = '-';
      if (current.winddisplay) {
        // winddisplay: "NW at 10 km/h"
        windDir = current.winddisplay.split(' ')[0];
        const kierunki = { N: 'Północ', NE: 'Północny wschód', E: 'Wschód', SE: 'Południowy wschód', S: 'Południe', SW: 'Południowy zachód', W: 'Zachód', NW: 'Północny zachód' };
        windDir = kierunki[windDir] || windDir;
      }

      // Wschód i zachód słońca (jeśli dostępne)
      let sunrise = location.sunrise || current.sunrise || '-';
      let sunset = location.sunset || current.sunset || '-';
      if (sunrise && sunrise !== '-') sunrise = sunrise.replace(/^0:/, '00:');
      if (sunset && sunset !== '-') sunset = sunset.replace(/^0:/, '00:');

      // Miasto i kraj po polsku (jeśli się da, domyślnie oryginał)
      let miasto = location.name || '-';
      let kraj = kraje[location.country] || location.country || '-';

      // Opis pogody po polsku
      let opis = pogoda[current.skytext] || current.skytext || "Brak opisu";

      // Budujemy embeda z pełnymi danymi
      // Formatowanie strefy czasowej jako UTC+X
      let strefa = "-";
      if (location.timezone && !isNaN(Number(location.timezone))) {
        const tz = Number(location.timezone);
        strefa = `UTC${tz >= 0 ? "+" : ""}${tz}`;
      }
      const embed = new Discord.EmbedBuilder()
        .setTitle(`Pogoda dla ${miasto}`)
        .setDescription(opis)
        .setThumbnail(current.imageUrl)
        .addFields(
          { name: "🌡️ Temperatura", value: `${current.temperature}°${degreeType}`, inline: true },
          { name: "🤔 Odczuwalna", value: `${current.feelslike}°${degreeType}`, inline: true },
          { name: "💧 Wilgotność", value: `${current.humidity}%`, inline: true },
          { name: "🌬️ Wiatr", value: current.windspeed || "-", inline: true },
          { name: "📅 Dzień", value: dzien, inline: true },
          { name: "🕒 Data", value: data, inline: true },
          { name: "📍 Miejsce", value: current.observationpoint || "-", inline: true }
        )
        .setFooter({ text: `Strefa czasowa: ${strefa}` })
        .setColor(0x00aaff);

      // Wyślij embeda na kanał lub jako odpowiedź na interakcję
      try {
        if (cache.interaction && typeof cache.interaction.reply === 'function' && !cache.interaction.replied && !cache.interaction.deferred) {
          await cache.interaction.reply({ embeds: [embed] });
        } else if (cache.msg && typeof cache.msg.reply === 'function') {
          cache.msg.reply({ embeds: [embed] });
        } else if (cache.msg && typeof cache.sendMessage === 'function') {
          cache.sendMessage({ embeds: [embed] });
        }
      } catch (e) {
        // fallback na tekst
        if (cache.msg && typeof cache.msg.reply === 'function') {
          cache.msg.reply(`Pogoda: ${current.temperature}°${degreeType}, ${current.skytext}`);
        }
      }

      // Dla kompatybilności: zapisz wybraną wartość do zmiennej (jeśli ktoś używa)
      let result = {
        temperature: current.temperature,
        feelslike: current.feelslike,
        skytext: current.skytext,
        skytextPL: opis,
        date: current.date,
        city: location.name,
        windspeed: current.windspeed,
        winddisplay: current.winddisplay,
        humidity: current.humidity,
        imageUrl: current.imageUrl,
        day: current.day,
        pressure: current.pressure,
        uv: current.uv,
        visibility: current.visibility,
        dewpoint: current.dewpoint,
        heatindex: current.heatindex,
        observationpoint: current.observationpoint
      };
      // Zwracanie wybranej opcji do zmiennej
      let info = parseInt(data.info, 10);
      let singleResult;
      switch (info) {
        case 0: singleResult = current.temperature; break;
        case 14: singleResult = current.feelslike; break;
        case 1: singleResult = current.skytext; break;
        case 20: singleResult = opis; break;
        case 2: singleResult = current.date; break;
        case 3: singleResult = location.name; break;
        case 6: singleResult = current.windspeed; break;
        case 8: singleResult = current.winddisplay; break;
        case 9: singleResult = current.humidity; break;
        case 15: singleResult = current.imageUrl; break;
        case 21: singleResult = current.pressure; break;
        case 22: singleResult = current.uv; break;
        case 23: singleResult = current.visibility; break;
        case 24: singleResult = current.dewpoint; break;
        case 25: singleResult = current.heatindex; break;
        case 16: singleResult = dzien; break;
        default: singleResult = undefined;
      }
      if (singleResult !== undefined) {
        const storage = parseInt(data.storage, 10);
        const varName2 = Actions.evalMessage(data.varName, cache);
        Actions.storeValue(singleResult, storage, varName2, cache);
      }
      const storage = parseInt(data.storage, 10);
      const varName2 = Actions.evalMessage(data.varName, cache);
      Actions.storeValue(result, storage, varName2, cache);
      Actions.callNextAction(cache);
    });
  },

  mod() {},
};
