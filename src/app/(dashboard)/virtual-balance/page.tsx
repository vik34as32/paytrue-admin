"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { updateUser } from "@/store/slices/authSlice";
import { formatCurrency } from "@/lib/utils";

export default function VirtualBalancePage() {
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);

  const [amount, setAmount] = useState(
    String(user?.balance || 0)
  );

  const handleUpdate = () => {
   const value = Number(amount);

const currentBalance = user?.balance || 0;

dispatch(
  updateUser({
    balance: currentBalance + value,
  })
);
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Virtual Balance Management
        </h1>

        <p className="text-muted">
          Update Super Admin virtual wallet balance
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">

        <div className="mb-6">
          <p className="text-sm text-muted">
            Current Balance
          </p>

          <h2 className="mt-2 text-4xl font-bold text-primary">
            {formatCurrency(user?.balance || 0)}
          </h2>
        </div>

        <div className="space-y-3">
          <label className="font-medium">
            Add Balance
          </label>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border p-3"
            placeholder="Enter amount to add"
          />
        </div>

        <button
          onClick={handleUpdate}
          className="mt-6 rounded-xl bg-violet-600 px-6 py-3 text-white hover:bg-violet-700"
        >
          Update Balance
        </button>

      </div>
    </div>
  );
}