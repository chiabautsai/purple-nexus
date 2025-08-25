import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  wsLink,
} from "@trpc/client";

import type { AppRouter } from "@purple-nexus/api/router";

const wsClient = createWSClient({
  url: "ws://localhost:2022",
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
    httpBatchLink({ url: "http://localhost:2022" }),
  ],
});
