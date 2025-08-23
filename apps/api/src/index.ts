import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { AppRouter } from "./router.js";
import cors from "cors";

const server = createHTTPServer({
  middleware: cors(),
  router: AppRouter,
  createContext: () => ({}), // No context needed
});

server.listen(2022);
console.log("tRPC server running on port 2022");
