import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const prevIdentityRef = useRef<string | undefined>(undefined);
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken =
        getSecretParameter("adminSecret") ||
        getSecretParameter("caffeineAdminToken") ||
        localStorage.getItem("adminSecret") ||
        "";
      if (adminToken !== "") {
        await (actor as any)._initializeAccessControlWithSecret(adminToken);
      }
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When identity changes, invalidate ALL queries (including role queries)
  // so getCallerUserRole is called again with the new identity
  useEffect(() => {
    const currentIdentity = identity?.getPrincipal().toString();
    if (currentIdentity !== prevIdentityRef.current) {
      prevIdentityRef.current = currentIdentity;
      // Invalidate everything so role and all data re-fetches with the new identity
      queryClient.invalidateQueries();
    }
  }, [identity, queryClient]);

  // When the actor data is ready, refetch all dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
