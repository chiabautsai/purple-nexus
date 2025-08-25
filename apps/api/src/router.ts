import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { on } from "events";

import { OpenWRTRouterService } from "./lib/openwrt-router-service.js";
import { TodoService } from "./lib/todo-service.js";

import { MpvService } from "./lib/mpv-service.js";

import "dotenv/config";

// Instantiate the service in the router
const openWrtService = new OpenWRTRouterService({
  baseUrl: process.env.OPENWRT_BASE_URL ?? "http://192.168.1.1",
  username: process.env.OPENWRT_USERNAME || "root",
  password: process.env.OPENWRT_PASSWORD || "",
});

const todoService = new TodoService();
const mpvService = new MpvService();

const t = initTRPC.context<{}>().create(); // Empty context

const publicProcedure = t.procedure;

export const AppRouter = t.router({
  greeting: publicProcedure
    .input(z.object({ name: z.string().nullish() }).nullish())
    .query(({ input }) => `Hello ${input?.name ?? "there"}`),
  getSystemStatus: publicProcedure.query(() =>
    openWrtService.getSystemStatus()
  ),
  rebootRouter: publicProcedure.mutation(() => openWrtService.rebootRouter()),
  isProcessRunning: publicProcedure
    .input(z.object({ processName: z.string() }))
    .query(({ input }) => openWrtService.isProcessRunning(input.processName)),
  manageInitdProcess: publicProcedure
    .input(
      z.object({
        processName: z.string(),
        action: z.enum(["start", "stop", "enable", "disable"]),
      })
    )
    .mutation(({ input }) =>
      openWrtService.manageInitdProcess(input.processName, input.action)
    ),

  // Todo routes
  createTodo: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(({ input }) =>
      todoService.create(input.title, input.description)
    ),

  getAllTodos: publicProcedure.query(() => todoService.getAll()),

  getTodoById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const todo = todoService.getById(input.id);
      if (!todo) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return todo;
    }),

  updateTodo: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...updates } = input;
      const todo = todoService.update(id, updates);
      if (!todo) {
        throw new Error(`Todo with id ${id} not found`);
      }
      return todo;
    }),

  deleteTodo: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const deleted = todoService.delete(input.id);
      if (!deleted) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return { success: true };
    }),

  markTodoCompleted: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const todo = todoService.markCompleted(input.id);
      if (!todo) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return todo;
    }),

  markTodoIncomplete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const todo = todoService.markIncomplete(input.id);
      if (!todo) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return todo;
    }),

  getCompletedTodos: publicProcedure.query(() => todoService.getCompleted()),

  getPendingTodos: publicProcedure.query(() => todoService.getPending()),

  clearAllTodos: publicProcedure.mutation(() => {
    todoService.clear();
    return { success: true };
  }),

  load: publicProcedure
    .input(
      z.object({
        content: z.string(),
        mode: z
          .enum(["replace", "append", "append-play"])
          .optional()
          .default("replace"),
        options: z.array(z.string()).optional().default(undefined),
      })
    )
    .mutation(async ({ input }) => {
      await mpvService.load(input.content, input.mode, input.options);
      return { success: true };
    }),

  play: publicProcedure.mutation(async () => {
    await mpvService.play();
    return { success: true };
  }),

  pause: publicProcedure.mutation(async () => {
    await mpvService.pause();
    return { success: true };
  }),

  togglePause: publicProcedure.mutation(async () => {
    await mpvService.togglePause();
    return { success: true };
  }),

  stop: publicProcedure.mutation(async () => {
    await mpvService.stop();
    return { success: true };
  }),

  next: publicProcedure.mutation(async () => {
    await mpvService.next();
    return { success: true };
  }),

  prev: publicProcedure.mutation(async () => {
    await mpvService.prev();
    return { success: true };
  }),

  volume: publicProcedure
    .input(z.object({ level: z.number().min(0).max(100) }))
    .mutation(async ({ input }) => {
      await mpvService.volume(input.level);
      return { success: true };
    }),

  mute: publicProcedure
    .input(z.object({ set: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      await mpvService.mute(input.set);
      return { success: true };
    }),

  getDuration: publicProcedure.query(async () => {
    return await mpvService.getDuration();
  }),

  getProperty: publicProcedure
    .input(z.object({ property: z.string() }))
    .query(async ({ input }) => {
      return await mpvService.getProperty(input.property);
    }),

  getAllProperties: publicProcedure
    .input(z.object({ properties: z.array(z.string()) }))
    .query(async ({ input }) => {
      return await mpvService.getAllProperties(input.properties);
    }),

  isRunning: publicProcedure.query(() => {
    return mpvService.isRunning();
  }),

  // Subscription for MPV's status event
  onStatus: publicProcedure.subscription(async function* (opts) {
    // Use `on` to listen for "status" and forward to client
    for await (const [status] of on(mpvService, "status", {
      signal: opts.signal,
    })) {
      yield status; // Push status update to client
    }
  }),

  // Example subscription for other MPV events (e.g., seek, pause)
  onSeek: publicProcedure.subscription(async function* (opts) {
    // Listening to the 'seek' event
    for await (const [seekData] of on(mpvService, "seek", {
      signal: opts.signal,
    })) {
      yield seekData; // Send seek event data to the client
    }
  }),
});

export type AppRouter = typeof AppRouter;
