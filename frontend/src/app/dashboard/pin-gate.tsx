"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyPin } from "@/lib/auth";
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
      const result = await verifyPin(pin);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Verification failed.");
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
              disabled={isPending || pin.length === 0}
              className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white"
            >
              {isPending ? "Verifying…" : "Access Dashboard →"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Contact the ICT department if you don&apos;t have the PIN.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
