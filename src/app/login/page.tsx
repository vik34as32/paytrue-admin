"use client";

import { LoginForm } from "@/components/forms/LoginForm";
import { APP_NAME, APP_TAGLINE } from "@/constants";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-[#4318FF] via-[#7551FF] to-[#868CFF] lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="max-w-lg">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white backdrop-blur-sm">
            PT
          </div>
          <h1 className="text-4xl font-bold text-white">{APP_NAME}</h1>
          <p className="mt-4 text-lg text-white/80">{APP_TAGLINE}</p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            {["Real-time Analytics", "Secure Transfers", "Role-based Access", "Ledger Tracking"].map(
              (feature) => (
                <div
                  key={feature}
                  className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-sm"
                >
                  {feature}
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
            <p className="mt-1 text-sm text-muted">
              Enter your credentials to access the admin panel
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
