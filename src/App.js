import { useEffect, useState } from "react";
import { convertToFlag, getWeatherIcon, formatDay } from "./reusableFun";

export default function App() {
  const [location, setLocation] = useState(
    () => localStorage.getItem("location") || ""
  );
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchWeather() {
        try {
          setError("");
          if (location.length < 2) return;
          setIsLoading(true);
          // 1) Getting location (geocoding)
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
            { signal: controller.signal }
          );
          const geoData = await geoRes.json();

          if (!geoData.results) throw new Error("Location no found");
          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);
          console.log(`${name} ${convertToFlag(country_code)}`);
          setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

          // 2) Getting actual weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
            { signal: controller.signal }
          );
          const weatherData = await weatherRes.json();
          console.log(weatherData);
          setWeather(weatherData.daily);
        } catch (err) {
          if (err.name === "AbortError") return;
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      fetchWeather();
      localStorage.setItem("location", location);

      return () => {
        controller.abort();
      };
    },
    [location]
  );
  return (
    <div className="app">
      <h1>Weather App</h1>
      <div>
        <input
          type="text"
          placeholder="Search from location..."
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
      </div>
      {isLoading && <p className="loader">Loading...</p>}
      {!isLoading && !error && weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
      {error && <p className="error">{error}!!!</p>}
    </div>
  );
}
function Weather({ location, weather }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;
  const sunnyStyle = { backgroundColor: "#fef4a8" };
  return (
    <div>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            sunnyStyle={
              codes.at(i) >= 0 && codes.at(i) <= 2 ? sunnyStyle : null
            }
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday, sunnyStyle }) {
  return (
    <li className="day" style={sunnyStyle}>
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash;
        <strong> {Math.ceil(max)}&deg;</strong>
      </p>
      <small>
        Developed by{" "}
        <a href="https://github.com/tertcoder" target="_blank" rel="noreferrer">
          Bon Tertius T.
        </a>
      </small>
    </li>
  );
}
