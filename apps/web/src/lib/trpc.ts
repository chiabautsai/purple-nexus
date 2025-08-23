import { createTRPCClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "@purple-nexus/api/router";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "http://localhost:2022" })],
});
