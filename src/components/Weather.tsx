import React, { useState, useEffect } from 'react';
import { WeatherData, WeatherError } from '../types/weather';
import { getWeatherByCity, getWeatherByCoords } from '../services/weatherService';
import '../styles/Weather.css';

interface WeatherProps {
  defaultCity?: string;
}

const Weather: React.FC<WeatherProps> = ({ defaultCity = 'Baku' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WeatherError | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCity, setSelectedCity] = useState(defaultCity);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  const fetchWeather = async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherByCity(city);
      setWeather(data);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to fetch weather data',
        code: 'FETCH_ERROR'
      });
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err)
        );
      });
      const data = await getWeatherByCoords(position.latitude, position.longitude);
      setWeather(data);
      setSelectedCity(data.name);
    } catch (err) {
      setError({
        message: 'Failed to get your location',
        code: 'LOCATION_ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSelectedCity(searchInput);
      setSearchInput('');
    }
  };

  return (
    <div className="weather-container">
      <div className="weather-header">
        <h1>Weather Dashboard</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
          <button type="button" onClick={fetchWeatherByCoords} className="location-btn">
            📍 Current Location
          </button>
        </form>
      </div>

      {loading && <div className="loading">Loading weather data...</div>}

      {error && (
        <div className="error-message">
          ⚠️ {error.message}
        </div>
      )}

      {weather && (
        <div className="weather-card">
          <div className="weather-main">
            <h2 className="city-name">{weather.name}, {weather.sys.country}</h2>
            <div className="weather-icon">
              {weather.weather[0].icon}
            </div>
            <div className="temperature">
              <span className="temp-value">{Math.round(weather.main.temp)}°C</span>
              <span className="temp-description">{weather.weather[0].description}</span>
            </div>
          </div>

          <div className="weather-details">
            <div className="detail-item">
              <span className="detail-label">Feels Like</span>
              <span className="detail-value">{Math.round(weather.main.feels_like)}°C</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Humidity</span>
              <span className="detail-value">{weather.main.humidity}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pressure</span>
              <span className="detail-value">{weather.main.pressure} hPa</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Wind Speed</span>
              <span className="detail-value">{weather.wind.speed} m/s</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Visibility</span>
              <span className="detail-value">{(weather.visibility / 1000).toFixed(1)} km</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">UV Index</span>
              <span className="detail-value">N/A</span>
            </div>
          </div>

          <div className="weather-footer">
            <p>Last updated: {new Date(weather.dt * 1000).toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Weather;
