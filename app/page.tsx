"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { AuthScreen } from "@/components/AuthScreen";

export default function Root() {
  const { isLoading, user } = db.useAuth();
  const router = useRouter();
  const q = db.useQuery(
    user
      ? { missions: { $: { where: { "user.id": user.id } } } }
      : null
  );

  useEffect(() => {
    if (isLoading || !user || q.isLoading) return;
    const has = !!(q.data?.missions?.length ?? 0);
    router.replace(has ? "/mission" : "/onboarding");
  }, [isLoading, user, q.isLoading, q.data, router]);

  if (isLoading || (user && q.isLoading)) {
    return (
      <div className="loading">
        <span className="mark" />
      </div>
    );
  }
  if (!user) return <AuthScreen />;

  return (
    <div className="loading">
      <span className="mark" />
    </div>
  );
}
