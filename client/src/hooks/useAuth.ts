import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meQuery.status !== "pending") {
      setLoading(false);
    }
  }, [meQuery.status]);

  return {
    user: meQuery.data,
    isAuthenticated: !!meQuery.data,
    isLoading: loading,
    loginUrl: getLoginUrl(),
    logout: () => logoutMutation.mutate(),
  };
}
