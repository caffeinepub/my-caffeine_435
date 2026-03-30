import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useInternetIdentity } from "./useInternetIdentity";

interface ActorWithAuth {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
}

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        return await createActorWithConfig();
      }

      const actorOptions = { agentOptions: { identity } };

      // Read admin token:
      // 1. URL hash (direct visit with token)
      // 2. sessionStorage (stored by App.tsx before II redirect)
      // 3. localStorage (stored manually via token input field)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlToken =
        hashParams.get("adminSecret") ??
        hashParams.get("caffeineAdminToken") ??
        null;
      const sessionToken =
        sessionStorage.getItem("adminSecret") ??
        sessionStorage.getItem("caffeineAdminToken") ??
        null;
      const localToken = localStorage.getItem("adminSecret") ?? null;
      const adminToken = urlToken ?? sessionToken ?? localToken ?? "";

      const actor = await createActorWithConfig(actorOptions);
      await (
        actor as unknown as ActorWithAuth
      )._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
