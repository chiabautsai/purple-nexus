import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";

import { Music, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

const trpc = trpcClient;

interface MpvStatus {
  "playlist-pos"?: number;
  "playlist-count"?: number;
  filename?: string;
  path?: string;
  paused?: string;
  "media-title"?: string;
  duration?: number;
  volume?: number;
}

// Youtube music
const mediaUrlList: ComboboxOption[] = [
  {
    value:
      "https://www.youtube.com/playlist?list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs",
    label: "The Hit List",
  },
  {
    value:
      "https://www.youtube.com/playlist?list=RDCLAK5uy_lBNUteBRencHzKelu5iDHwLF6mYqjL-JU",
    label: "Pop Certified",
  },
  {
    value:
      "https://www.youtube.com/playlist?list=RDCLAK5uy_lBGRuQnsG37Akr1CY4SxL0VWFbPrbO4gs",
    label: "Today's Hip-Hop",
  },
  {
    value:
      "https://www.youtube.com/playlist?list=RDCLAK5uy_lJ8xZWiZj2GCw7MArjakb6b0zfvqwldps",
    label: "Country Hotlist",
  },
  {
    value:
      "https://www.youtube.com/playlist?list=RDCLAK5uy_k5vcGRXixxemtzK1eKDS7BeHys7mvYOdk",
    label: "Today's Rock Hits",
  },
  {
    value:
      "https://www.youtube.com/playlist?list=RDCLAK5uy_m0Nsi5Jnn_g6qbvc7fywPRhEv1qN0PcMM",
    label: "Indie Hits",
  },
  {
    value:
      "https://www.youtube.com/playlist?list=RDCLAK5uy_mu-BhJj3yO1OXEMzahs_aJVtNWJwAwFEE",
    label: "R&B",
  },
];

export function EntertainmentCard() {
  const [mpvStatus, setMpvStatus] = useState<MpvStatus>({});
  const [mediaUrl, setMediaUrl] = useState("");
  // Query to check if MPV is running
  const isRunningQuery = useQuery({
    queryKey: ["mpv.isRunning"],
    queryFn: () => trpc.isRunning.query(),
    retry: false, // Avoid retrying on socket errors
  });

  const allPropertiesQuery = useQuery({
    queryKey: ["mpv.allProperties"],
    queryFn: () =>
      trpc.getAllProperties.query({
        properties: [
          "media-title",
          "duration",
          "playlist-pos",
          "playlist-count",
          "path",
          "volume",
        ],
      }),
    enabled: isRunningQuery.data,
    retry: false,
  });

  useEffect(() => {
    if (isRunningQuery.data && allPropertiesQuery.isSuccess) {
      setMpvStatus(allPropertiesQuery.data);
    } else if (isRunningQuery.data === false) {
      setMpvStatus({});
    }
  }, [
    isRunningQuery.data,
    allPropertiesQuery.isSuccess,
    allPropertiesQuery.data,
  ]);

  useEffect(() => {
    const subscription = trpc.onStatus.subscribe(undefined, {
      onData: (status) => {
        const { property, value } = status;
        setMpvStatus((prev) => ({ ...prev, [property]: value }));
      },
      onError: (err) => {
        console.error("Subscription error:", err);
      },
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadMutation = useMutation({
    mutationFn: async (url: string) => await trpc.load.mutate({ content: url }),
    onSuccess: () => console.log("Loaded"),
    onError: (err) => console.error("Play error:", err),
  });

  const playMutation = useMutation({
    mutationFn: async () => await trpc.play.mutate(),
    onSuccess: () => console.log("Playback started"),
    onError: (err) => console.error("Play error:", err),
  });

  const pauseMutation = useMutation({
    mutationFn: async () => await trpc.pause.mutate(),
    onSuccess: () => console.log("Paused"),
    onError: (err) => console.error("Pause error:", err),
  });

  const nextMutation = useMutation({
    mutationFn: async () => await trpc.next.mutate(),
    onSuccess: () => console.log("Skipped to next"),
    onError: (err) => console.error("Next error:", err),
  });

  const previousMutation = useMutation({
    mutationFn: async () => await trpc.prev.mutate(),
    onSuccess: () => console.log("Skipped to previous"),
    onError: (err) => console.error("Previous error:", err),
  });

  const handlePlayNewMedia = () => {
    if (mediaUrl) {
      loadMutation.mutate(mediaUrl);
      setMediaUrl("");
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

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
          <p className="font-medium text-card-foreground mb-1">Now Playing</p>
          <p className="text-sm text-muted-foreground">
            {mpvStatus["media-title"] || "Nothing playing"}
          </p>
          <p className="text-sm text-muted-foreground">
            Duration: {formatDuration(mpvStatus.duration)}
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => previousMutation.mutate()}
            disabled={mpvStatus["playlist-pos"] === (0 | -1)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => pauseMutation.mutate()}
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => playMutation.mutate()}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => nextMutation.mutate()}
            disabled={
              mpvStatus["playlist-pos"] ===
              (mpvStatus["playlist-count"] ?? 0) - 1
            }
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Combobox
            options={mediaUrlList}
            value={mediaUrl}
            onValueChange={setMediaUrl}
            placeholder="Choose media..."
            searchPlaceholder="Search media or add custom..."
            allowCustom={true}
          />
          <Button onClick={handlePlayNewMedia} disabled={!mediaUrl}>
            Play
          </Button>
        </div>
        {/* <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Volume</span>
            <span>{mpvStatus.volume || 65}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-muted-foreground h-2 rounded-full"
              style={{ width: `${mpvStatus.volume || 65}%` }}
            ></div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}
