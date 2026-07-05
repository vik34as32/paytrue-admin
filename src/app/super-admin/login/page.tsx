"use client";

import Link from "next/link";
import { SuperAdminLoginForm } from "@/components/forms/SuperAdminLoginForm";
import { ROUTES } from "@/constants";
import { motion } from "framer-motion";

export default function SuperAdminLoginPage() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[#060b18]">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />

      <div className="relative flex h-full w-full flex-col items-center justify-center px-4 py-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-md flex-col"
        >
          <div className="mb-5 flex flex-col items-center gap-2.5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xl">
              <img
                src="/images/logo.png"
                alt="PayTrue Logo"
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-50">Pay</span>
              <span className="bg-gradient-to-r from-[#0A84FF] to-[#0057D9] bg-clip-text text-transparent">
                True
              </span>
            </h1>
            <p className="text-sm text-slate-400">Super Admin Console</p>
          </div>

          <div className="glass-card rounded-2xl p-6 shadow-2xl shadow-black/40 sm:p-7">
            <div className="mb-5 text-center">
              <h2 className="text-xl font-bold text-white">Super Admin Sign In</h2>
              <p className="mt-1 text-sm text-slate-400">
                Use your super admin credentials
              </p>
            </div>
            <SuperAdminLoginForm />
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Admin user?{" "}
            <Link href={ROUTES.login} className="text-blue-400 hover:text-blue-300">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
