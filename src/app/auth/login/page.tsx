import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

/** Canonical login UI lives at /login — keep /auth/login as an alias. */
export default function AuthLoginPage() {
  redirect(ROUTES.login);
}
