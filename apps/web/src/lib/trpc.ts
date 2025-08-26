import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  wsLink,
} from "@trpc/client";

import type { AppRouter } from "@purple-nexus/api/router";

const getApiBaseUrl = () => {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}`;
};

const wsClient = createWSClient({
  url: `${getApiBaseUrl().replace(/^http/, "ws")}:2022`,
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
    httpBatchLink({ url: `${getApiBaseUrl()}:2022` }),
  ],
});
