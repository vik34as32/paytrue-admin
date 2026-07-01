"use client";

import Link from "next/link";
import { SuperAdminLoginForm } from "@/components/forms/SuperAdminLoginForm";
import { APP_NAME } from "@/constants";
import { ROUTES } from "@/constants";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function SuperAdminLoginPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#060b18]">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />

      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
            <p className="text-sm text-slate-400">Super Admin Console</p>
          </div>

          <div className="glass-card rounded-2xl p-8 shadow-2xl shadow-black/40">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-white">Super Admin Sign In</h2>
              <p className="mt-1 text-sm text-slate-400">
                Use your super admin credentials
              </p>
            </div>
            <SuperAdminLoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
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
