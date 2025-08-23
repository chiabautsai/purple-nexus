import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function ClockCard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };
  return (
    <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 dark:from-primary/20 dark:to-accent/20">
      <CardHeader className="pb-3 lg:pb-0">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Clock className="h-6 w-6" />
          Current Time
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center lg:p-6">
        <div className="text-8xl font-bold text-primary mb-4">
          {formatTime(currentTime)}
        </div>
        <div className="text-xl text-muted-foreground">
          {formatDate(currentTime)}
        </div>
      </CardContent>
    </Card>
  );
}
