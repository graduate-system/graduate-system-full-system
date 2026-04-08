import { AlertTriangle, ServerCrash, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackendError } from "@/lib/backend-api";

type Props = {
  error: unknown;
  title?: string;
  onRetry?: () => void;
};

export function BackendErrorView({ error, title, onRetry }: Props) {
  const { icon: Icon, heading, message, variant } = resolveError(error, title);

  return (
    <Card className={`border-${variant}-200 bg-${variant}-50 dark:border-${variant}-900 dark:bg-${variant}-950/30`}>
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-${variant}-100 dark:bg-${variant}-900/40`}>
          <Icon className={`h-7 w-7 text-${variant}-600 dark:text-${variant}-400`} />
        </div>
        <div className="space-y-1">
          <h3 className={`text-base font-bold text-${variant}-800 dark:text-${variant}-300`}>{heading}</h3>
          <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 mt-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function resolveError(error: unknown, title?: string) {
  if (error instanceof BackendError) {
    if (error.isOffline) {
      return {
        icon: WifiOff,
        heading: title ?? "Backend Unreachable",
        message: "The backend server is not running or cannot be reached. Start it with `dotnet run` and refresh.",
        variant: "amber",
      };
    }
    if (error.isUnauthorized) {
      return {
        icon: AlertTriangle,
        heading: title ?? "Session Expired",
        message: "Your session has expired. Please log in again.",
        variant: "amber",
      };
    }
    if (error.isServerError) {
      return {
        icon: ServerCrash,
        heading: title ?? "Server Error",
        message: error.message || "An unexpected server error occurred. Please try again.",
        variant: "red",
      };
    }
    return {
      icon: AlertTriangle,
      heading: title ?? "Something went wrong",
      message: error.message,
      variant: "red",
    };
  }

  return {
    icon: ServerCrash,
    heading: title ?? "Unexpected Error",
    message: error instanceof Error ? error.message : "An unexpected error occurred.",
    variant: "red",
  };
}
