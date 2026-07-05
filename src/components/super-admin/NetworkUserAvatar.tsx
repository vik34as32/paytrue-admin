"use client";

import { cn, getInitials, resolveMediaUrl } from "@/lib/utils";
import { NetworkUserRecord } from "@/types/superAdmin";
import { getNetworkUserName } from "@/store/selectors/superAdminSelectors";

interface NetworkUserAvatarProps {
  user: Pick<
    NetworkUserRecord,
    "profileImage" | "firstName" | "lastName" | "name" | "email" | "profile"
  >;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function NetworkUserAvatar({
  user,
  size = "sm",
  className,
}: NetworkUserAvatarProps) {
  const name = getNetworkUserName(user);
  const profileImage =
    user.profileImage ||
    (user.profile &&
    typeof user.profile === "object" &&
    "profileImage" in user.profile
      ? (user.profile as { profileImage?: string }).profileImage
      : undefined);
  const imageUrl = resolveMediaUrl(profileImage);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-border",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ring-2 ring-border",
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {getInitials(name !== "—" ? name : "U")}
    </div>
  );
}
