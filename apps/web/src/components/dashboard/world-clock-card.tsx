import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Globe } from "lucide-react";

interface TimeZone {
  city: string;
  timezone: string;
  flag: string;
}

const timeZones: TimeZone[] = [
  { city: "New York", timezone: "America/New_York", flag: "🇺🇸" },
  { city: "London", timezone: "Europe/London", flag: "🇬🇧" },
  { city: "Los Angeles", timezone: "America/Los_Angeles", flag: "🇺🇸" },
  { city: "Sydney", timezone: "Australia/Sydney", flag: "🇦🇺" },
  { city: "Dubai", timezone: "Asia/Dubai", flag: "🇦🇪" },
];

export function WorldClockCard() {
  const [times, setTimes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: { [key: string]: string } = {};
      timeZones.forEach(({ city, timezone }) => {
        const time = new Date().toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
        newTimes[city] = time;
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-2 md:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5" />
          World Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col space-y-2">
          {timeZones.map(({ city, flag }) => (
            <div
              key={city}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{flag}</span>
                <span className="text-sm font-medium text-foreground">
                  {city}
                </span>
              </div>
              <span className="text-sm font-mono font-semibold">
                {times[city] || "--:--"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
