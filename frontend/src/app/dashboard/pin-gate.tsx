"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PinGate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/committee/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pin }),
          credentials: "include",
        });

        if (!res.ok) {
          const maybeJson = (await res.json().catch(() => null)) as unknown;
          const msgFromJson = getErrorMessage(maybeJson);
          throw new Error(msgFromJson || (res.status === 401 ? "Incorrect PIN. Please try again." : "Verification failed."));
        }

        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Verification failed.";
        setError(msg);
        setPin("");
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500 bg-gradient-to-br from-green-700 to-green-900 text-lg font-black text-amber-400">
            MUST
          </div>
          <CardTitle className="text-xl">Committee Dashboard</CardTitle>
          <CardDescription>
            Enter the committee PIN to access graduate analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pin" className="text-sm font-semibold">
                Committee PIN
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={cn(
                  "text-center text-lg tracking-widest",
                  error ? "border-destructive" : "",
                )}
                autoFocus
                disabled={isPending}
              />
              {error && (
                <p className="text-xs font-medium text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending || pin.length < 4}
              className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white"
            >
              {isPending ? "Verifying…" : "Access Dashboard →"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Contact the ICT department if you don&apos;t have the PIN.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">Not a committee member?</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => router.back()}
              >
                ← Go Back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => router.push("/register")}
              >
                🎓 Graduate Registration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  if (!("error" in payload)) return null;
  const error = (payload as { error?: unknown }).error;
  return typeof error === "string" && error.trim().length > 0 ? error : null;
}
