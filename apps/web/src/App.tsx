import { ClockCard } from "@/components/dashboard/clock-card";
import { EntertainmentCard } from "@/components/dashboard/entertainment-card";
import { SystemStatusCard } from "@/components/dashboard/system-status-card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { ReminderCard } from "@/components/dashboard/reminder-card";
import { WorldClockCard } from "@/components/dashboard/world-clock-card";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
export const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-4">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1 font-sans">
                Home Hub
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here's your home overview
              </p>
            </div>
            <div className="flex items-center gap-4"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto space-y-4">
          <ClockCard />
          <EntertainmentCard />
          <SystemStatusCard />
          <WorldClockCard />
          <WeatherCard />
          <ReminderCard />
          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* <QuickControlsCard />
          <SystemStatusCard />
          <ScheduleCard /> */}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
