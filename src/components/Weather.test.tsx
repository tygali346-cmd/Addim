import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Weather from './Weather';
import * as weatherService from '../services/weatherService';

jest.mock('../services/weatherService');

const mockWeatherData = {
  coord: { lon: 49.86, lat: 40.38 },
  weather: [
    {
      id: 801,
      main: 'Clouds',
      description: 'few clouds',
      icon: '02d'
    }
  ],
  main: {
    temp: 22,
    feels_like: 20,
    temp_min: 18,
    temp_max: 25,
    pressure: 1013,
    humidity: 65
  },
  visibility: 10000,
  wind: {
    speed: 5,
    deg: 210
  },
  clouds: {
    all: 20
  },
  dt: 1622548800,
  sys: {
    type: 2,
    id: 2019646,
    country: 'AZ',
    sunrise: 1622514600,
    sunset: 1622568000
  },
  timezone: 14400,
  id: 587084,
  name: 'Baku',
  cod: 200
};

describe('Weather Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders weather component', () => {
    (weatherService.getWeatherByCity as jest.Mock).mockResolvedValue(mockWeatherData);
    render(<Weather />);
    expect(screen.getByText('Weather Dashboard')).toBeInTheDocument();
  });

  test('loads weather data on mount', async () => {
    (weatherService.getWeatherByCity as jest.Mock).mockResolvedValue(mockWeatherData);
    render(<Weather defaultCity="Baku" />);
    
    await waitFor(() => {
      expect(weatherService.getWeatherByCity).toHaveBeenCalledWith('Baku');
    });
  });

  test('displays weather data when loaded', async () => {
    (weatherService.getWeatherByCity as jest.Mock).mockResolvedValue(mockWeatherData);
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/Baku/)).toBeInTheDocument();
      expect(screen.getByText(/22°C/)).toBeInTheDocument();
    });
  });

  test('handles search input', async () => {
    (weatherService.getWeatherByCity as jest.Mock).mockResolvedValue(mockWeatherData);
    render(<Weather />);
    
    const input = screen.getByPlaceholderText('Search city...');
    const button = screen.getByText('Search');
    
    fireEvent.change(input, { target: { value: 'London' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(weatherService.getWeatherByCity).toHaveBeenCalledWith('London');
    });
  });

  test('displays error message on fetch failure', async () => {
    const errorMessage = 'City not found';
    (weatherService.getWeatherByCity as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });
  });

  test('displays loading state', () => {
    (weatherService.getWeatherByCity as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockWeatherData), 100))
    );
    render(<Weather />);
    expect(screen.getByText('Loading weather data...')).toBeInTheDocument();
  });

  test('displays all weather details', async () => {
    (weatherService.getWeatherByCity as jest.Mock).mockResolvedValue(mockWeatherData);
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText('Feels Like')).toBeInTheDocument();
      expect(screen.getByText('Humidity')).toBeInTheDocument();
      expect(screen.getByText('Pressure')).toBeInTheDocument();
      expect(screen.getByText('Wind Speed')).toBeInTheDocument();
      expect(screen.getByText('Visibility')).toBeInTheDocument();
    });
  });
});
