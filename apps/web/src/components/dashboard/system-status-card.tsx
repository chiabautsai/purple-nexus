import { useMutation, useQuery } from "@tanstack/react-query";

import { trpcClient } from "@/lib/trpc";

import { Settings, Power, Clock, Thermometer, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ContentAwareBadge } from "@/components/ui/content-aware-badge";

const trpc = trpcClient;

export function SystemStatusCard() {
  return <SystemStatusCardContent />;
}

function SystemStatusCardContent() {
  function useOpenWrtData() {
    const {
      data: routerStatus,
      error: routerError,
      isLoading: routerLoading,
    } = useQuery({
      queryKey: ["getSystemStatus"],
      queryFn: () => trpc.getSystemStatus.query(),
      refetchInterval: 1000 * 5,
      retry: false,
    });

    const {
      data: vpnProcStatus,
      error: vpnError,
      isLoading: vpnLoading,
    } = useQuery({
      queryKey: ["getProcessStatus"],
      queryFn: () => trpc.isProcessRunning.query({ processName: "sing-box" }),
      refetchInterval: 1000 * 5,
      retry: false,
    });

    return {
      routerStatus,
      vpnProcStatus,
      routerError,
      vpnError,
      isLoading: routerLoading || vpnLoading,
      hasError: !!routerError || !!vpnError,
    };
  }

  const {
    routerStatus,
    vpnProcStatus,
    routerError,
    vpnError,
    isLoading,
    // hasError,
  } = useOpenWrtData();

  const vpnStatusMutation = useMutation({
    mutationFn: (action: "start" | "stop" | "enable" | "disable") =>
      trpc.manageInitdProcess.mutate({ processName: "sing-box", action }),
    onError: (error) => {
      console.error("VPN status change failed:", error);
    },
  });

  return (
    <Card className="col-span-1 bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Settings className="h-5 w-5 text-muted-foreground" />
          Router
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* System Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uptime</span>
            </div>
            <ContentAwareBadge
              isLoading={isLoading}
              error={routerError}
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              {routerStatus &&
                (() => {
                  const uptimeSeconds = parseFloat(routerStatus.uptime);
                  const days = Math.floor(uptimeSeconds / 86400);
                  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
                  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
                  return `${days}d ${hours}h ${minutes}m`;
                })()}
            </ContentAwareBadge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Temperature</span>
            </div>
            <ContentAwareBadge
              isLoading={isLoading}
              error={routerError}
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              {routerStatus?.temperature.toFixed(1)}°C
            </ContentAwareBadge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Load Average
              </span>
            </div>
            <ContentAwareBadge
              isLoading={isLoading}
              error={routerError}
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              {routerStatus &&
                `${routerStatus.load.avg1.toFixed(
                  2
                )} / ${routerStatus.load.avg5.toFixed(
                  2
                )} / ${routerStatus.load.avg15.toFixed(2)}`}
            </ContentAwareBadge>
          </div>
        </div>

        {/* Status Indicators */}
        {/* VPN Status - Show even if there's an error, but disable controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                vpnStatusMutation.mutate(vpnProcStatus ? "stop" : "start")
              }
              disabled={vpnStatusMutation.isPending || !!vpnError}
              className={`
                rounded-md transition-all duration-200 ease-in-out
                hover:bg-muted hover:scale-110 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  vpnProcStatus && !vpnError
                    ? "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
              title={
                vpnError
                  ? "VPN control unavailable"
                  : vpnProcStatus
                  ? "Click to stop VPN"
                  : "Click to start VPN"
              }
            >
              <Power className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground">VPN</span>
          </div>
          <ContentAwareBadge
            isLoading={isLoading}
            error={vpnError}
            variant="secondary"
            className={
              vpnError
                ? "bg-muted text-muted-foreground"
                : vpnProcStatus
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }
          >
            {vpnProcStatus ? "Running" : "Stopped"}
          </ContentAwareBadge>
        </div>

        {/* Mutation Error Display */}
        {/* {vpnStatusMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to change VPN status: {vpnStatusMutation.error.message}
            </AlertDescription>
          </Alert>
        )} */}
      </CardContent>
    </Card>
  );
}
