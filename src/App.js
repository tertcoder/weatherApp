import { useEffect, useState } from "react";
import { convertToFlag, getWeatherIcon, formatDay } from "./reusableFun";

export default function App() {
  const [location, setLocation] = useState(
    () => localStorage.getItem("location") || ""
  );
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(
    function () {
      async function fetchWeather() {
        try {
          if (location.length < 2) return;
          setIsLoading(true);
          // 1) Getting location (geocoding)
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
          );
          const geoData = await geoRes.json();

          if (!geoData.results) throw new Error("Location no found");
          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);
          setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

          // 2) Getting actual weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          const weatherData = await weatherRes.json();
          setWeather(weatherData);
        } catch (err) {
        } finally {
          setIsLoading(false);
        }
      }
      fetchWeather();
      localStorage.setItem("location", location);
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
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}
function Weather(location, weather) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;
  return (
    <div>
      <h2>Weather</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day(date, max, min, code, isToday) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash;
        <strong> {Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}
