"use client";

import * as React from "react";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => signIn(formData),
    undefined,
  );
  const prevPendingRef = React.useRef(false);

  React.useEffect(() => {
    if (prevPendingRef.current && !isPending && state === undefined) {
      prevPendingRef.current = false;
      window.location.href = "/admin";
    }
    prevPendingRef.current = isPending;
  }, [isPending, state]);

  return (
    <div className="flex h-full items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm"
      >
        <Card className="border-border/50 bg-background/60 shadow-primary/5 shadow-2xl backdrop-blur-2xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="bg-primary shadow-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-lg">
                <span className="text-primary-foreground text-xl font-bold">A</span>
              </div>
            </motion.div>
            <CardTitle className="text-xl">Admin Login</CardTitle>
            <CardDescription>Sign in to manage your portfolio.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {state?.error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
                >
                  {state.error}
                </motion.p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
