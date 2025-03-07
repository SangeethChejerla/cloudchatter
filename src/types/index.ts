export interface WeatherResponse {
    latitude: number;
    longitude: number;
    current_units: {
      temperature_2m: string;
      relative_humidity_2m: string;
      apparent_temperature: string;
      precipitation: string;
      weather_code: string;
      wind_speed_10m: string;
    };
    current: {
      time: string;
      temperature_2m: number;
      relative_humidity_2m: number;
      apparent_temperature: number;
      precipitation: number;
      weather_code: number;
      wind_speed_10m: number;
    };
  }
  export interface GeocodingResponse {
    results?: {
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      country: string;
      country_code: string;
      admin1?: string;
    }[];
    error?: boolean;
    reason?: string;
  }
  
  export async function getLocationCoordinates(query: string): Promise<GeocodingResponse> {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching location:', error);
      return { error: true, reason: 'Failed to fetch location data' };
    }
  }
  
  export async function getWeatherData(latitude: number, longitude: number): Promise<WeatherResponse> {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather:', error);
      throw error;
    }
  }
  
  export function getWeatherDescription(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      51: 'Light drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      80: 'Slight rain showers',
      95: 'Thunderstorm',
    };
    
    return weatherCodes[code] || 'Unknown';
  }