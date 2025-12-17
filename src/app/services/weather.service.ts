import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { WeatherResponse, WeatherData } from '../models/weather.model';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly apiUrl = 'https://api.open-meteo.com/v1/forecast';

  constructor(private http: HttpClient) {}

  getWeather(latitude: number, longitude: number): Observable<WeatherData> {
    const url = `${this.apiUrl}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

    return this.http.get<WeatherResponse>(url).pipe(
      map((response) => {
        const currentTemp = response.current_weather.temperature;
        const dailyHigh = response.daily.temperature_2m_max[0];
        const dailyLow = response.daily.temperature_2m_min[0];
        const weatherCode = response.current_weather.weathercode;

        return {
          currentTemperature: currentTemp,
          dailyHigh: dailyHigh,
          dailyLow: dailyLow,
          weatherCode: weatherCode,
          weatherIcon: this.getWeatherIcon(weatherCode)
        };
      }),
      catchError((error) => {
        console.error('Error fetching weather:', error);
        return throwError(() => new Error('Failed to fetch weather data. Please try again later.'));
      })
    );
  }

  private getWeatherIcon(weatherCode: number): string {
    // Weather code mapping based on WMO Weather interpretation codes
    // 0: Clear sky, 1-3: Mainly clear/partly cloudy, 45-48: Fog, 51-67: Drizzle/Rain, 71-77: Snow, 80-99: Rain showers/Thunderstorm
    if (weatherCode === 0) {
      return '☀️'; // Clear sky
    } else if (weatherCode >= 1 && weatherCode <= 3) {
      return '⛅'; // Partly cloudy
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      return '🌫️'; // Fog
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      return '🌧️'; // Rain
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      return '❄️'; // Snow
    } else if (weatherCode >= 80 && weatherCode <= 99) {
      return '⛈️'; // Thunderstorm
    } else {
      return '☁️'; // Default cloudy
    }
  }
}

