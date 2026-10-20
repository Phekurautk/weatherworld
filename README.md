# WeatherWorld

WeatherWorld is a responsive, three-page web application for searching worldwide weather, air quality, and local sunrise/sunset times. Built with semantic HTML, original external CSS, and external vanilla JavaScript for the Web Technologies project.

## Files

- `index.html` - searchable weather dashboard
- `about.html` - explanation of the project and its data sources
- `contact.html` - **demonstration-only** feedback form with client-side validation (nothing is transmitted or saved)
- `css/style.css` - mobile-first styles, layout, focus states, form styling, and media queries
- `js/app.js` - navigation, validation, geocoding, weather/air-quality/sun-time API calls, rendering, and error handling
- `assets/logo.png` - image included with the original project (verify any external image rights/credit before publication)

## Run and publish

No build step, private API key or database is required. Open the folder in Visual Studio Code and run a local static server (e.g. Live Server) to preview. For GitHub Pages, create a new public repository and upload the **contents** of this directory, keeping `index.html` in the repository root and the relative folder paths unchanged. Enable GitHub Pages using the `main` branch, `/ (root)`.

External internet access is needed for API responses and Font Awesome icons. The contact form **does not send messages** because this static website has no message-receiving backend.

## How the app works

1. Enter a city or place name and choose Celsius or Fahrenheit.
2. WeatherWorld searches the Open-Meteo geocoding API and displays up to five matches if names are ambiguous. Choosing a match updates the results.
3. It fetches current weather, humidity, wind, precipitation, and the **daily maximum** UV index from Open-Meteo's forecast API.
4. It fetches air-quality readings from Open-Meteo and requests today's local sunrise/sunset times from the **Sunrise-Sunset.org v2 API** using the selected coordinates and timezone.
5. Missing air-quality or sun-time data shows a helpful message without preventing the main weather result from displaying.
6. Changing the temperature unit reuses the coordinates instead of repeating the geocoding request.

The timestamps displayed are local to the searched location, not automatically converted to the visitor's computer timezone. The sun-time API's ISO 8601 timestamps already contain the local offset.

## Accessibility and technical choices

Semantic `<header>`, `<nav>`, `<main>`, `<section>`, `<article>` and `<footer>` elements; labels and native validation for form elements; skip-to-main link; `aria-current` on the active page; `aria-expanded` on the mobile menu; keyboard Escape behaviour; visible focus styles; and live feedback/error regions. Weather and location data are inserted with `textContent` to avoid treating untrusted API values as HTML. Mobile-first CSS includes element/class/ID, pseudo-class, and attribute selectors.

## Verification

The updated project was exercised in Chromium using simulated responses at 320, 375, 820, and 1440 pixel widths. The test covered all pages, navigation, footer year, location selection, unit switching, correct sun-time formatting, API failures, invalid city input, and honest contact-form validation. These tests **do not replace checking real requests from the publicly hosted site**. After publishing, search for at least two real cities (for example London and Kolkata), confirm both optional APIs respond, and test your browser's DevTools Console and Network tabs. The current availability of third-party APIs is outside this project's control.

## External documentation and credits

API structures were implemented for this project with reference to the providers' documentation:

- Open-Meteo Geocoding: https://open-meteo.com/en/docs/geocoding-api
- Open-Meteo Weather Forecast: https://open-meteo.com/en/docs
- Open-Meteo Air Quality: https://open-meteo.com/en/docs/air-quality-api
- Sunrise-Sunset.org API v2: https://sunrise-sunset.org/api - **visible credit appears alongside sunrise/sunset results**, as required by the provider.
- Font Awesome free icon CSS (third-party visual assets): https://fontawesome.com/ (served through cdnjs)

Before submission, confirm the provenance and permitted use of `assets/logo.png`, which was carried over unchanged from the original project archive. Do not remove source credits or third-party licences if you add any further externally sourced material.
