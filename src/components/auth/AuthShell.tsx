"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/constants";
import { BarChart3, Globe, Lock, Shield, Zap } from "lucide-react";

const features = [
  { icon: BarChart3, label: "Real-time Analytics" },
  { icon: Shield, label: "Bank-grade Security" },
  { icon: Lock, label: "Role-based Access" },
  { icon: Zap, label: "Instant Transfers" },
  { icon: Globe, label: "Multi-tier Network" },
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#060b18]">
      <div className="pointer-events-none absolute inset-0">
        <div className="gradient-mesh absolute inset-0 opacity-60" />
        <motion.div
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-indigo-600/20 blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="PayTrue Logo"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-50">Pay</span>
              <span className="bg-gradient-to-r from-[#0A84FF] to-[#0057D9] bg-clip-text text-transparent">
                True
              </span>
            </h1>
            <p className="text-sm text-blue-200/70">Digital Payment Solutions</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Secure Account
            <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Recovery
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">{APP_TAGLINE}</p>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="glass-card flex items-center gap-3 rounded-xl px-4 py-3"
              >
                <feature.icon className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-300">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="logo"
                className="h-7 w-7 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-50">Pay</span>
              <span className="bg-gradient-to-r from-[#0A84FF] to-[#0057D9] bg-clip-text text-transparent">
                True
              </span>
            </h1>
          </div>

          <div className="glass-card rounded-2xl p-8 shadow-2xl shadow-black/40">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
            </div>
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {footer ?? (
              <>
                Remember your password?{" "}
                <Link
                  href={ROUTES.login}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  Back to login
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
