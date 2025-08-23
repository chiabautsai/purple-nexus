import { Music } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function EntertainmentCard() {
  return (
    <Card className="col-span-1 bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Music className="h-5 w-5 text-muted-foreground" />
          Entertainment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="font-medium text-card-foreground mb-1">Living Room</p>
          <p className="text-sm text-muted-foreground">Playing: Chill Vibes</p>
        </div>
        <div className="flex gap-2"></div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Volume</span>
            <span>65%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-muted-foreground h-2 rounded-full"
              style={{ width: "65%" }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
