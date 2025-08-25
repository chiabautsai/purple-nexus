import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { AppRouter } from "./router.js";
import cors from "cors";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

const server = createHTTPServer({
  middleware: cors(),
  router: AppRouter,
  createContext: () => ({}),
});

const wss = new WebSocketServer({ server });
applyWSSHandler<AppRouter>({
  wss,
  router: AppRouter,
  createContext: () => ({}),
});

server.listen(2022);
console.log("tRPC server running on port 2022");
