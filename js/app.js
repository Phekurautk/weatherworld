"use strict";

// WeatherWorld: original project JavaScript, improved for this coursework.
// API formats were checked against official documentation:
// https://open-meteo.com/en/docs/geocoding-api
// https://open-meteo.com/en/docs
// https://open-meteo.com/en/docs/air-quality-api
// https://sunrise-sunset.org/api (version 2; attribution displayed beside results)

const menuToggle = document.querySelector("#menu-toggle");
const navigation = document.querySelector("#main-navigation");

if (menuToggle && navigation) {
  function closeMenu() {
    menuToggle.classList.remove("active");
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  menuToggle.addEventListener("click", function () {
    const isOpen = navigation.classList.toggle("open");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  document.addEventListener("click", function (event) {
    if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  });

  navigation.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
}

// This class is shared by all three HTML pages.
document.querySelectorAll(".current-year").forEach(function (element) {
  element.textContent = new Date().getFullYear();
});

// A transparent demonstration form: there is no backend receiving messages.
const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  const contactStatus = document.querySelector("#contact-status");
  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const name = document.querySelector("#contact-name").value.trim();
    const message = document.querySelector("#contact-message").value.trim();

    if (name.length < 2 || message.length < 10) {
      contactStatus.textContent = "Please enter a name of at least 2 characters and a message of at least 10 characters.";
      contactStatus.className = "error";
    } else {
      contactStatus.textContent = "Thanks, " + name + ". The form passed validation. This demo does not send or save your message.";
      contactStatus.className = "success";
    }
    contactStatus.hidden = false;
  });
}

// Open-Meteo weather code descriptions (WMO weather interpretation codes).
const weatherCodes = {
  0: { label: "Clear sky", icon: "fa-sun", type: "sunny" },
  1: { label: "Mainly clear", icon: "fa-cloud-sun", type: "sunny" },
  2: { label: "Partly cloudy", icon: "fa-cloud-sun", type: "cloudy" },
  3: { label: "Overcast", icon: "fa-cloud", type: "cloudy" },
  45: { label: "Fog", icon: "fa-smog", type: "foggy" },
  48: { label: "Rime fog", icon: "fa-smog", type: "foggy" },
  51: { label: "Light drizzle", icon: "fa-cloud-rain", type: "rainy" },
  53: { label: "Drizzle", icon: "fa-cloud-rain", type: "rainy" },
  55: { label: "Heavy drizzle", icon: "fa-cloud-showers-heavy", type: "rainy" },
  56: { label: "Freezing drizzle", icon: "fa-cloud-rain", type: "rainy" },
  57: { label: "Freezing drizzle", icon: "fa-cloud-rain", type: "rainy" },
  61: { label: "Light rain", icon: "fa-cloud-rain", type: "rainy" },
  63: { label: "Rain", icon: "fa-cloud-rain", type: "rainy" },
  65: { label: "Heavy rain", icon: "fa-cloud-showers-heavy", type: "rainy" },
  66: { label: "Freezing rain", icon: "fa-cloud-rain", type: "rainy" },
  67: { label: "Freezing rain", icon: "fa-cloud-rain", type: "rainy" },
  71: { label: "Light snow", icon: "fa-snowflake", type: "snowy" },
  73: { label: "Snow", icon: "fa-snowflake", type: "snowy" },
  75: { label: "Heavy snow", icon: "fa-snowflake", type: "snowy" },
  77: { label: "Snow grains", icon: "fa-snowflake", type: "snowy" },
  80: { label: "Rain showers", icon: "fa-cloud-rain", type: "rainy" },
  81: { label: "Rain showers", icon: "fa-cloud-showers-heavy", type: "rainy" },
  82: { label: "Heavy showers", icon: "fa-cloud-showers-heavy", type: "stormy" },
  85: { label: "Snow showers", icon: "fa-snowflake", type: "snowy" },
  86: { label: "Heavy snow", icon: "fa-snowflake", type: "snowy" },
  95: { label: "Thunderstorm", icon: "fa-cloud-bolt", type: "stormy" },
  96: { label: "Thunderstorm with hail", icon: "fa-cloud-bolt", type: "stormy" },
  99: { label: "Severe thunderstorm", icon: "fa-cloud-bolt", type: "stormy" }
};

const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city-input");
const unitSelect = document.querySelector("#unit-select");
const searchButton = document.querySelector("#search-button");
const statusMessage = document.querySelector("#status-message");
const resultsSection = document.querySelector("#weather-results");
const locationChoice = document.querySelector("#location-choice");
const locationSelect = document.querySelector("#location-select");

// Weather-specific listeners only run on the homepage; About/Contact stay error-free.
if (form && cityInput && unitSelect && searchButton && statusMessage && resultsSection) {
  let latestLocation = null;
  let matchingLocations = [];
  let requestVersion = 0; // Ignore late replies from older searches.

  function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
  }

  function showLoading(isLoading) {
    searchButton.disabled = isLoading;
    searchButton.innerHTML = isLoading
      ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Loading weather'
      : '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Search Weather';
  }

  // All API values are shown through textContent, never interpolated into HTML.
  function text(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function formatValue(value, suffix = "") {
    return Number.isFinite(Number(value)) && value !== null && value !== ""
      ? String(Math.round(Number(value))) + suffix : "--";
  }

  function temperature(value) {
    return formatValue(value, unitSelect.value === "fahrenheit" ? "°F" : "°C");
  }

  function getWeatherInfo(code) {
    return weatherCodes[code] || {
      label: "Conditions unavailable", icon: "fa-cloud", type: "cloudy"
    };
  }

  async function getJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("The data service is unavailable (HTTP " + response.status + ").");
    }
    return response.json();
  }

  async function findCities(city) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({
      name: city, count: "5", language: "en", format: "json"
    });
    const data = await getJSON(url);
    if (!Array.isArray(data.results) || data.results.length === 0) {
      throw new Error("No matching place was found. Check the spelling or try a more specific name.");
    }
    return data.results.filter((place) =>
      Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))
    );
  }

  async function getWeather(location) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(location.latitude), longitude: String(location.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
      daily: "uv_index_max", forecast_days: "1", timezone: "auto",
      temperature_unit: unitSelect.value, wind_speed_unit: "kmh"
    });
    return getJSON(url);
  }

  async function getAirQuality(location) {
    const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
    url.search = new URLSearchParams({
      latitude: String(location.latitude), longitude: String(location.longitude),
      current: "european_aqi,us_aqi", timezone: "auto"
    });
    return getJSON(url);
  }

  async function getSunTimes(location, weather) {
    // v2 returns local-time ISO strings for the coordinates and needs no API key.
    const url = new URL("https://api.sunrise-sunset.org/v2");
    const parameters = {
      lat: String(location.latitude), lng: String(location.longitude)
    };
    if (weather.daily && Array.isArray(weather.daily.time) && weather.daily.time[0]) {
      parameters.date = weather.daily.time[0]; // Today's date in the searched location.
    }
    if (location.timezone || weather.timezone) {
      parameters.tz = location.timezone || weather.timezone;
    }
    url.search = new URLSearchParams(parameters);
    const data = await getJSON(url);
    if (data.error) throw new Error(data.message || "Sun times unavailable");
    return data;
  }

  function labelLocation(location) {
    return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
  }

  function showChoices(locations) {
    matchingLocations = locations;
    locationSelect.replaceChildren();
    locations.forEach(function (location, index) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = labelLocation(location);
      locationSelect.appendChild(option);
    });
    locationSelect.value = "0";
    locationChoice.hidden = locations.length <= 1;
  }

  function renderWeather(location, weather) {
    if (!weather || !weather.current) {
      throw new Error("This location did not return current weather readings.");
    }
    const current = weather.current;
    const info = getWeatherInfo(current.weather_code);
    text("#location-name", location.name || "Selected location");
    text("#location-details", [location.admin1, location.country].filter(Boolean).join(", "));
    text("#current-description", info.label);
    text("#current-heading", temperature(current.temperature_2m));
    text("#feels-like", temperature(current.apparent_temperature));
    text("#stat-humidity", formatValue(current.relative_humidity_2m, "%"));
    text("#stat-wind", formatValue(current.wind_speed_10m, " km/h"));
    text("#stat-rain", Number.isFinite(Number(current.precipitation)) && current.precipitation !== null
      ? Number(current.precipitation).toFixed(1) + " mm" : "--");
    const maxUV = weather.daily && weather.daily.uv_index_max
      ? weather.daily.uv_index_max[0] : null;
    text("#stat-uv", maxUV === null || maxUV === undefined ? "--" : String(maxUV));

    const icon = document.querySelector("#current-icon");
    icon.className = "fa-solid " + info.icon + " weather-symbol";
    document.querySelector("#current-card").className = "current-card " + info.type;

    // Open-Meteo's timestamp with timezone=auto already represents location-local time.
    // Parsing it as a Date without an offset would wrongly apply the viewer's timezone.
    text("#updated-time", "Observation at " + String(current.time || "--").replace("T", " ") +
      " (" + (weather.timezone_abbreviation || weather.timezone || "local time") + ")");
    resultsSection.hidden = false;
  }

  function renderAirQuality(data) {
    if (!data || !data.current || data.current.european_aqi == null) {
      text("#air-quality", "Air quality data is currently unavailable for this location.");
      return;
    }
    const european = Number(data.current.european_aqi);
    const american = data.current.us_aqi;
    let description = "Good";
    if (european > 20) description = "Fair";
    if (european > 40) description = "Moderate";
    if (european > 60) description = "Poor";
    if (european > 80) description = "Very poor";
    if (european > 100) description = "Extremely poor";
    text("#air-quality", "European AQI: " + european + " (" + description + ")" +
      (american != null ? " | US AQI: " + american : ""));
  }

  function renderSunTimes(data) {
    // Sunrise-Sunset.org v2 times contain the correct local UTC offset.
    // Display HH:MM directly so the viewer's device timezone cannot change it.
    const isISO = (value) => typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(value);
    text("#sunrise-time", isISO(data.sunrise) ? data.sunrise.slice(11, 16) : "—");
    text("#sunset-time", isISO(data.sunset) ? data.sunset.slice(11, 16) : "—");
    if (!data.sunrise && !data.sunset) {
      text("#sun-status", "No sunrise or sunset occurs on this date at this latitude.");
    } else {
      text("#sun-status", "Local times · " + (data.tzid || "location timezone") +
        (data.date ? " · " + data.date : ""));
    }
  }

  function setExtrasLoading() {
    text("#air-quality", "Loading air-quality readings...");
    text("#sunrise-time", "--:--");
    text("#sunset-time", "--:--");
    text("#sun-status", "Loading today's sun times...");
  }

  async function loadLocation(location) {
    const currentRequest = ++requestVersion;
    showLoading(true);
    setStatus("Loading weather for " + labelLocation(location) + "...");
    setExtrasLoading();

    try {
      const weather = await getWeather(location);
      if (currentRequest !== requestVersion) return;

      renderWeather(location, weather);
      latestLocation = location;
      setStatus("Weather loaded for " + labelLocation(location) + ".", "success");

      // Extra services are optional. Weather still works if one service fails.
      const [airResult, sunResult] = await Promise.allSettled([
        getAirQuality(location), getSunTimes(location, weather)
      ]);
      if (currentRequest !== requestVersion) return;

      renderAirQuality(airResult.status === "fulfilled" ? airResult.value : null);
      if (sunResult.status === "fulfilled") {
        renderSunTimes(sunResult.value);
      } else {
        text("#sunrise-time", "—");
        text("#sunset-time", "—");
        text("#sun-status", "Sunrise and sunset times are currently unavailable.");
      }
    } catch (error) {
      if (currentRequest !== requestVersion) return;
      setStatus(error.message || "Could not load weather. Please try again.", "error");
      if (resultsSection.hidden) setExtrasLoading();
    } finally {
      if (currentRequest === requestVersion) showLoading(false);
    }
  }

  async function searchCity(city) {
    const searchRequest = ++requestVersion;
    showLoading(true);
    setStatus("Finding matching locations...");
    locationChoice.hidden = true;
    try {
      const matches = await findCities(city);
      if (searchRequest !== requestVersion) return;
      if (matches.length === 0) throw new Error("No matching place was found.");
      showChoices(matches);
      await loadLocation(matches[0]);
    } catch (error) {
      if (searchRequest !== requestVersion) return;
      setStatus(error.message || "City search failed. Please try again.", "error");
    } finally {
      if (searchRequest === requestVersion) showLoading(false);
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const city = cityInput.value.trim();
    if (city.length < 2) {
      setStatus("Please enter a place name of at least 2 characters.", "error");
      cityInput.focus();
      return;
    }
    searchCity(city);
  });

  locationSelect.addEventListener("change", function () {
    const chosen = matchingLocations[Number(locationSelect.value)];
    if (chosen) loadLocation(chosen);
  });

  unitSelect.addEventListener("change", function () {
    if (latestLocation) {
      // Re-use known coordinates; changing units must not repeat the city search.
      loadLocation(latestLocation);
    }
  });
}
