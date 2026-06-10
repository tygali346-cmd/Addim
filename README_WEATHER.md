# Weather Dashboard

A modern, responsive weather dashboard application built with React and TypeScript that fetches real-time weather data from the OpenWeatherMap API.

## Features

- 🌍 **Real-time Weather Data**: Fetch current weather conditions for any city worldwide
- 📍 **Location-based Weather**: Get weather for your current location using geolocation
- 🔍 **City Search**: Search for weather information by city name
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- ⚡ **Error Handling**: User-friendly error messages and loading states
- 🧪 **Unit Tests**: Comprehensive test coverage for the component

## Installation

### Prerequisites
- Node.js 14+ and npm/yarn
- A free API key from [OpenWeatherMap](https://openweathermap.org/api)

### Steps

1. **Clone or navigate to the repository**
   ```bash
   cd Addim
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Add your OpenWeatherMap API key**
   ```
   REACT_APP_WEATHER_API_KEY=your_api_key_here
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## Usage

### Basic Usage

```tsx
import Weather from './components/Weather';

function App() {
  return <Weather defaultCity="New York" />;
}

export default App;
```

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultCity` | string | "Baku" | Initial city to display weather for |

## API Integration

The dashboard uses the free tier of [OpenWeatherMap API](https://openweathermap.org/api).

### Endpoints Used

- **Current Weather by City**: `/weather?q={city}&units=metric&appid={API_KEY}`
- **Current Weather by Coordinates**: `/weather?lat={lat}&lon={lon}&units=metric&appid={API_KEY}`
- **5 Day Forecast**: `/forecast?q={city}&units=metric&appid={API_KEY}`

## File Structure

```
src/
├── components/
│   ├── Weather.tsx           # Main Weather component
│   └── Weather.test.tsx      # Unit tests
├── services/
│   └── weatherService.ts     # API service functions
├── types/
│   └── weather.ts            # TypeScript type definitions
├── styles/
│   └── Weather.css           # Component styles
└── ...
```

## Component Architecture

### Weather.tsx
Main React component that handles:
- User interface rendering
- State management (weather data, loading, errors)
- Search and geolocation functionality
- Display of weather information

### weatherService.ts
Service module providing:
- `getWeatherByCity(city)` - Fetch weather by city name
- `getWeatherByCoords(lat, lon)` - Fetch weather by coordinates
- `getWeatherForecast(city)` - Fetch 5-day forecast

### weather.ts
TypeScript type definitions for:
- WeatherData
- MainWeather
- Wind
- System
- WeatherError
- And more...

## Styling

The component uses CSS with:
- CSS variables for consistent theming
- Responsive grid layout
- Flexbox for alignment
- Smooth animations and transitions
- Mobile-first design approach

## Testing

Run tests with:
```bash
npm test
# or
yarn test
```

Tests cover:
- Component rendering
- Weather data loading
- Search functionality
- Error handling
- Display of weather details
- Loading states

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance

- Optimized re-renders using React hooks
- Efficient API calls with error boundaries
- CSS animations using GPU acceleration
- Responsive images and optimized assets

## Troubleshooting

### "City not found" error
- Ensure the city name is spelled correctly
- Try using a more specific location (City, Country code)

### Location not working
- Check browser permissions for geolocation
- Ensure you're using HTTPS (required for geolocation)

### API Key errors
- Verify your API key is correct
- Check that your API key is active on OpenWeatherMap
- Ensure the API key has permission to access weather data

## Future Enhancements

- [ ] 5-day forecast visualization
- [ ] Weather alerts and notifications
- [ ] Favorite cities management
- [ ] Hourly weather breakdown
- [ ] Weather maps integration
- [ ] Dark mode theme
- [ ] Multiple language support

## License

This project is part of the Addim repository.

## Resources

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
