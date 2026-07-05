"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/useAppStore";
import { loadStoredUser } from "@/store/api/authApi";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log("AuthInitializer Running...");
    dispatch(loadStoredUser());
  }, [dispatch]);

  return null;
}