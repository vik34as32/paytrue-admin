"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { APP_NAME, ROUTES } from "@/constants";
import { VerifyOtpForm } from "./VerifyOtpForm";

export default function VerifyLoginOtpPage() {
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

      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="PayTrue Logo"
                className="h-full w-full object-contain p-1"
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
            <VerifyOtpForm />
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} {APP_NAME}.{" "}
            <Link
              href={ROUTES.login}
              className="text-slate-500 hover:text-blue-400"
            >
              Return to sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
