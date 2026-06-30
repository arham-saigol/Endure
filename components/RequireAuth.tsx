"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = db.useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="loading">
        <span className="mark" />
      </div>
    );
  }
  return <>{children}</>;
}
