import { WeatherData } from '../types/weather';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetch weather data by city name
 * @param city - City name to search for
 * @returns Weather data for the city
 */
export const getWeatherByCity = async (city: string): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`City "${city}" not found`);
      }
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data: WeatherData = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch weather data by geographical coordinates
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Weather data for the coordinates
 */
export const getWeatherByCoords = async (
  lat: number,
  lon: number
): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data: WeatherData = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get weather forecast for 5 days
 * @param city - City name to search for
 * @returns Forecast data
 */
export const getWeatherForecast = async (city: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
