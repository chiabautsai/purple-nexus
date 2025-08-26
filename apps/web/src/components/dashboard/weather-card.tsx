import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Droplets, Wind, MapPin } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;

  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
    apparent_temperature: string;
    precipitation: string;
    weather_code: string;
    wind_speed_10m: string;
  };

  current: {
    time: string; // ISO8601
    interval: number;
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };

  hourly_units: {
    time: string;
    temperature_2m: string;
    weather_code: string;
    apparent_temperature: string;
    precipitation_probability: string;
    precipitation: string;
    wind_speed_10m: string;
  };

  hourly: {
    time: string[]; // ISO8601 timestamps
    temperature_2m: number[];
    weather_code: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
  };
}

export function WeatherCard() {
  return <WeatherCardContent />;
}

function WeatherCardContent() {
  const { isPending, error, data } = useQuery({
    queryKey: ["weatherData"],
    queryFn: () => fetchWeatherUsingBrowserLocation(),
    refetchInterval: 1000 * 60 * 60, // 1 hour in milliseconds
    refetchOnWindowFocus: true,
  });

  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  const weatherData = data as WeatherData;
  const hourlyForecast = getNextHourlyForecast(weatherData);

  return (
    <Card className="col-span-2 md:col-span-1 bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-card-foreground text-lg font-sans">
          <Sun className="h-5 w-5 text-muted-foreground" />
          Weather
          <div className="flex items-center gap-1 ml-auto text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-primary mb-1 font-sans">
              {getWeatherIcon(weatherData.current.weather_code)}{" "}
              {Math.round(weatherData.current.temperature_2m)}°C
            </div>
            <p className="text-sm text-muted-foreground">
              Feels like {Math.round(weatherData.current.apparent_temperature)}
              °C
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {weatherData.current.weather_code === 3
                ? "Overcast"
                : "Partly Cloudy"}
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Droplets className="h-3 w-3 text-accent" />
              <span>{weatherData.current.precipitation}mm</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Wind className="h-3 w-3 text-accent" />
              <span>{Math.round(weatherData.current.wind_speed_10m)} km/h</span>
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground mb-4">Hourly Forecast</p>
          <div className="flex justify-between gap-2">
            {hourlyForecast.map((hour, index) => (
              <div key={index} className="text-center flex-1 min-w-0">
                <p className="text-tiny text-muted-foreground mb-2 font-medium whitespace-nowrap">
                  {hour.time}
                </p>
                <div className="text-lg mb-2">{hour.icon}</div>
                <p className="text-sm font-semibold mb-2 text-foreground">
                  {hour.temp}
                </p>

                <div className="mb-1">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Droplets className="h-2.5 w-2.5 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {hour.precipProb}%
                    </span>
                  </div>
                </div>

                {hour.precipAmount > 0 && (
                  <p className="text-xs text-muted-foreground font-medium">
                    {hour.precipAmount.toFixed(1)}mm
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getNextHourlyForecast(
  weatherData: WeatherData,
  numberOfForecasts = 5,
  hourStep = 1
) {
  const now = new Date();
  const {
    time,
    temperature_2m,
    precipitation_probability,
    precipitation,
    weather_code,
  } = weatherData.hourly;

  // find the first hourly slot >= current time
  const startIndex = time.findIndex((t) => new Date(t) >= now) ?? 0;

  const forecasts = [];
  for (let i = 0; i < numberOfForecasts; i++) {
    const idx = startIndex + i * hourStep;
    if (idx >= time.length) break;

    forecasts.push({
      time: new Date(time[idx]).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temp: `${temperature_2m[idx]}°C`,
      precipProb: precipitation_probability[idx],
      precipAmount: precipitation[idx],
      icon: getWeatherIcon(weather_code[idx]),
    });
  }

  return forecasts;
}

const getWeatherIcon = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: "☀️", // Clear sky
    1: "🌤️", // Mainly clear
    2: "⛅", // Partly cloudy
    3: "☁️", // Overcast
    45: "🌫️", // Fog
    48: "🌫️", // Depositing rime fog
    51: "🌦️", // Light drizzle
    53: "🌦️", // Moderate drizzle
    55: "🌦️", // Dense drizzle
    61: "🌧️", // Slight rain
    63: "🌧️", // Moderate rain
    65: "🌧️", // Heavy rain
    80: "🌦️", // Slight rain showers
    81: "🌧️", // Moderate rain showers
    82: "🌧️", // Violent rain showers
    95: "⛈️", // Thunderstorm
    96: "⛈️", // Thunderstorm with slight hail
    99: "⛈️", // Thunderstorm with heavy hail
  };
  return weatherCodes[code] || "🌤️";
};

function buildWeatherApiUrl({
  latitude,
  longitude,
  timezone,
  forecastDays = 3,
}: {
  latitude: number;
  longitude: number;
  timezone: string;
  forecastDays?: number;
}) {
  const baseUrl = "https://api.open-meteo.com/v1/forecast";

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: [
      "temperature_2m",
      "weather_code",
      "apparent_temperature",
      "precipitation_probability",
      "precipitation",
      "wind_speed_10m",
    ].join(","),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    timezone,
    forecast_days: forecastDays.toString(),
  });

  return `${baseUrl}?${params.toString()}`;
}

// Function to get forecast using browser location
async function fetchWeatherUsingBrowserLocation(forecastDays = 3) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const url = buildWeatherApiUrl({
          latitude,
          longitude,
          timezone,
          forecastDays,
        });

        try {
          const res = await fetch(url);
          const data = await res.json();
          resolve(data);
        } catch (err) {
          reject(err);
        }
      },
      (error) => reject(error)
    );
  });
}
