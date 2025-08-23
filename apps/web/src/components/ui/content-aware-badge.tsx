import * as React from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContentAwareBadgeProps {
  isLoading?: boolean;
  error?: Error | string | null;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function ContentAwareBadge({
  isLoading = false,
  error = null,
  children,
  className,
  variant = "secondary",
  ...props
}: ContentAwareBadgeProps) {
  // Loading state - skeleton animation
  if (isLoading) {
    return <Skeleton className="h-4 w-[150px]" />;
  }

  // Error state - show ERROR with tooltip
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="destructive"
            className={cn("cursor-help", className)}
            {...props}
          >
            ERROR
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{errorMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Normal state - display content
  return (
    <Badge variant={variant} className={className} {...props}>
      {children}
    </Badge>
  );
}
