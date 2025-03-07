

import { getLocationCoordinates, getWeatherData, getWeatherDescription } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
};

export type WeatherInfo = {
  location: string;
  temperature: number;
  unit: string;
  description: string;
  humidity: number;
  feelsLike: number;
  precipitation: number;
  windSpeed: number;
  windSpeedUnit: string;
  time: string;
  weatherCode: number;
  country: string;
  latitude: number;
  longitude: number;
};

export type WeatherActionResult = {
  success: boolean;
  message?: string;
  weatherInfo?: WeatherInfo;
  error?: {
    code: string;
    details: string;
  }
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function getWeatherByLocation(location: string): Promise<WeatherActionResult> {
  if (!location || location.trim().length < 2) {
    return {
      success: false,
      message: 'Please provide a valid location name (at least 2 characters).',
    };
  }

  try {
    // First, get coordinates for the location
    const geocodingResponse = await getLocationCoordinates(location);
    
    if (!geocodingResponse.results || geocodingResponse.results.length === 0) {
      return {
        success: false,
        message: 'Location not found. Please try with a different city or location name.',
        error: {
          code: 'LOCATION_NOT_FOUND',
          details: `No coordinates found for location: ${location}`
        }
      };
    }
    
    const { latitude, longitude, name, country, country_code, admin1 } = geocodingResponse.results[0];
    
    // Then, get weather data for those coordinates
    const weatherData = await getWeatherData(latitude, longitude);
    
    const locationDisplay = admin1 
      ? `${name}, ${admin1}, ${country}`
      : `${name}, ${country}`;
    
    const weatherInfo: WeatherInfo = {
      location: locationDisplay,
      temperature: weatherData.current.temperature_2m,
      unit: weatherData.current_units.temperature_2m,
      description: getWeatherDescription(weatherData.current.weather_code),
      humidity: weatherData.current.relative_humidity_2m,
      feelsLike: weatherData.current.apparent_temperature,
      precipitation: weatherData.current.precipitation,
      windSpeed: weatherData.current.wind_speed_10m,
      windSpeedUnit: weatherData.current_units.wind_speed_10m,
      time: weatherData.current.time,
      weatherCode: weatherData.current.weather_code,
      country: country,
      latitude: latitude,
      longitude: longitude
    };
    
    return {
      success: true,
      weatherInfo,
    };
  } catch (error) {
    console.error('Error in getWeatherByLocation:', error);
    return {
      success: false,
      message: 'Error fetching weather data. Please try again later.',
      error: {
        code: 'API_ERROR',
        details: formatError(error)
      }
    };
  }
}

export async function getRecentSearches(): Promise<string[]> {
  // In a real app, this would be fetched from a database
  // For this example, we're returning a static list
  return [
    'London',
    'New York',
    'Tokyo',
    'Paris',
    'Sydney'
  ];
}

export async function generateWeatherSummary(weatherInfo: WeatherInfo): Promise<string> {
  // Create a user-friendly summary based on the weather data
  const { temperature, description, feelsLike, humidity, precipitation, windSpeed } = weatherInfo;
  
  let summary = `The current weather in ${weatherInfo.location} is ${description.toLowerCase()} with a temperature of ${temperature}${weatherInfo.unit}.`;
  
  // Add feels like if it's significantly different from actual temperature
  if (Math.abs(temperature - feelsLike) > 2) {
    summary += ` It feels like ${feelsLike}${weatherInfo.unit} due to `;
    
    if (feelsLike < temperature) {
      summary += 'wind chill';
    } else {
      summary += 'humidity';
    }
    summary += '.';
  }
  
  // Add precipitation info if relevant
  if (precipitation > 0) {
    summary += ` There has been ${precipitation} mm of precipitation.`;
  }
  
  // Add wind info if it's windy
  if (windSpeed > 15) {
    summary += ` It's quite windy with wind speeds of ${windSpeed} ${weatherInfo.windSpeedUnit}.`;
  }
  
  // Add humidity info if it's notable
  if (humidity > 80) {
    summary += ` The humidity is high at ${humidity}%.`;
  } else if (humidity < 30) {
    summary += ` The air is quite dry with only ${humidity}% humidity.`;
  }
  
  return summary;
}

export async function getMultiDayForecast(latitude: number, longitude: number, days: number = 5): Promise<{success: boolean, message?: string, forecast?: any}> {
  // This would make a real API call to get multi-day forecast
  // For this example, we'll just return a mock response
  
  try {
    return {
      success: true,
      forecast: {
        daily: {
          time: [
            "2025-03-07", "2025-03-08", "2025-03-09", "2025-03-10", "2025-03-11"
          ],
          temperature_2m_max: [
            12.4, 13.2, 14.5, 11.8, 12.9
          ],
          temperature_2m_min: [
            8.1, 7.4, 9.3, 7.8, 6.5
          ],
          precipitation_sum: [
            0.5, 1.2, 0, 0, 2.8
          ],
          weather_code: [
            2, 61, 1, 0, 63
          ]
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get forecast: ${formatError(error)}`
    };
  }
}

export function createChatMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: uuidv4(),
    role,
    content,
    timestamp: Date.now()
  };
}

export async function processWeatherQuery(query: string): Promise<ChatMessage> {
  // This is a more advanced function that could analyze the user's query
  // and provide more specific weather information based on natural language processing
  
  const lowercaseQuery = query.toLowerCase();
  let response = '';
  
  // Handle different types of weather queries
  try {
    if (lowercaseQuery.includes('forecast') || lowercaseQuery.includes('next days')) {
      // Extract location from query - in a real app, use NLP for this
      const location = extractLocationFromQuery(query);
      
      if (!location) {
        response = "I couldn't determine which location you want a forecast for. Please specify a city or place.";
      } else {
        const locationData = await getLocationCoordinates(location);
        
        if (!locationData.results || locationData.results.length === 0) {
          response = `I couldn't find the location "${location}". Please try a different place.`;
        } else {
          const { latitude, longitude } = locationData.results[0];
          const forecast = await getMultiDayForecast(latitude, longitude);
          
          if (forecast.success) {
            response = `Here's the 5-day forecast for ${location}:\n\n`;
            
            for (let i = 0; i < 5; i++) {
              const date = forecast.forecast.daily.time[i];
              const maxTemp = forecast.forecast.daily.temperature_2m_max[i];
              const minTemp = forecast.forecast.daily.temperature_2m_min[i];
              const weatherCode = forecast.forecast.daily.weather_code[i];
              
              response += `${formatDate(date)}: ${getWeatherDescription(weatherCode)}, ${minTemp}°C to ${maxTemp}°C\n`;
            }
          } else {
            response = `Sorry, I couldn't get the forecast for ${location}.`;
          }
        }
      }
    } else {
      // Default to current weather
      const location = extractLocationFromQuery(query);
      
      if (!location) {
        response = "I couldn't determine which location you're asking about. Please specify a city or place.";
      } else {
        const weatherResult = await getWeatherByLocation(location);
        
        if (weatherResult.success && weatherResult.weatherInfo) {
          const weatherInfo = weatherResult.weatherInfo;
          response = await generateWeatherSummary(weatherInfo);
        } else {
          response = weatherResult.message || "Sorry, I couldn't get the weather information.";
        }
      }
    }
  } catch (error) {
    console.error("Error processing weather query:", error);
    response = "I encountered an error while processing your weather query. Please try again.";
  }
  
  return createChatMessage('assistant', response);
}

// Helper function to extract location from a query
function extractLocationFromQuery(query: string): string | null {
  // In a real app, this would use NLP
  // This is a very simplified version
  
  // Remove common weather-related words
  const cleanQuery = query.toLowerCase()
    .replace(/weather|forecast|temperature|humidity|rain|sunny|cloudy|wind|hot|cold|in|at|for|of|the/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanQuery.length > 2) {
    return cleanQuery;
  }
  
  return null;
}

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}