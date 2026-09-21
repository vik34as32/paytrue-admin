import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Fingerprint,
  Layers,
  Smartphone,
  Wallet,
  Zap,
} from "lucide-react";

export function getServiceIcon(serviceType: string): LucideIcon {
  const key = serviceType.toUpperCase().replace(/\s+/g, "");
  if (key.includes("DMT")) return Banknote;
  if (key.includes("AEPS")) return Fingerprint;
  if (key.includes("UPI")) return Smartphone;
  if (key.includes("WALLET")) return Wallet;
  if (key.includes("BBPS") || key.includes("RECHARGE")) return Zap;
  return Layers;
}
