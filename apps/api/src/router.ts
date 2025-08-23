import { initTRPC } from "@trpc/server";
import { z } from "zod";

import { OpenWRTRouterService } from "./lib/openwrt-router-service.js";
import { TodoService } from "./lib/todo-service.js";

import "dotenv/config";

// Instantiate the service in the router
const openWrtService = new OpenWRTRouterService({
  baseUrl:
    process.env.OPENWRT_BASE_URL ?? "http://192.168.1.1/cgi-bin/luci/rpc",
  username: process.env.OPENWRT_USERNAME || "root",
  password: process.env.OPENWRT_PASSWORD || "",
});

const todoService = new TodoService();

const t = initTRPC.context<{}>().create(); // Empty context
export const AppRouter = t.router({
  greeting: t.procedure
    .input(z.object({ name: z.string().nullish() }).nullish())
    .query(({ input }) => `Hello ${input?.name ?? "there"}`),
  getSystemStatus: t.procedure.query(() => openWrtService.getSystemStatus()),
  rebootRouter: t.procedure.mutation(() => openWrtService.rebootRouter()),
  isProcessRunning: t.procedure
    .input(z.object({ processName: z.string() }))
    .query(({ input }) => openWrtService.isProcessRunning(input.processName)),
  manageInitdProcess: t.procedure
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
  createTodo: t.procedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(({ input }) =>
      todoService.create(input.title, input.description)
    ),

  getAllTodos: t.procedure.query(() => todoService.getAll()),

  getTodoById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const todo = todoService.getById(input.id);
      if (!todo) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return todo;
    }),

  updateTodo: t.procedure
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

  deleteTodo: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const deleted = todoService.delete(input.id);
      if (!deleted) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return { success: true };
    }),

  markTodoCompleted: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const todo = todoService.markCompleted(input.id);
      if (!todo) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return todo;
    }),

  markTodoIncomplete: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const todo = todoService.markIncomplete(input.id);
      if (!todo) {
        throw new Error(`Todo with id ${input.id} not found`);
      }
      return todo;
    }),

  getCompletedTodos: t.procedure.query(() => todoService.getCompleted()),

  getPendingTodos: t.procedure.query(() => todoService.getPending()),

  clearAllTodos: t.procedure.mutation(() => {
    todoService.clear();
    return { success: true };
  }),
});

export type AppRouter = typeof AppRouter;
