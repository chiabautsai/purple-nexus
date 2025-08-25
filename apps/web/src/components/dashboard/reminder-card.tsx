import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, CheckCircle, Circle, Plus, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { trpcClient } from "@/lib/trpc";

export function ReminderCard() {
  const queryClient = useQueryClient();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(true);

  const {
    data: todos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todos", showPendingOnly ? "pending" : "all"],
    queryFn: () =>
      showPendingOnly
        ? trpcClient.getPendingTodos.query()
        : trpcClient.getAllTodos.query(),
  });

  const createTodoMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      trpcClient.createTodo.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTodoTitle("");
      setNewTodoDescription("");
      setDialogOpen(false);
    },
    onError: (err) => {
      console.error("Error creating todo:", err);
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: string;
      completed: boolean;
    }) => {
      if (completed) {
        return trpcClient.markTodoIncomplete.mutate({ id });
      } else {
        return trpcClient.markTodoCompleted.mutate({ id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (err) => {
      console.error("Error toggling todo:", err);
    },
  });

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    createTodoMutation.mutate({
      title: newTodoTitle.trim(),
      description: newTodoDescription.trim() || undefined,
    });
  };

  const toggleTodo = (id: string, completed: boolean) => {
    toggleTodoMutation.mutate({ id, completed });
  };

  return (
    <Card className="col-span-2 bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Todo List
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              pressed={showPendingOnly}
              onPressedChange={setShowPendingOnly}
              size="sm"
              variant="outline"
              aria-label="Filter pending todos"
            >
              <Filter className="h-4 w-4 mr-1" />
              {showPendingOnly ? "Pending" : "All"}
            </Toggle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Todo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Todo</DialogTitle>
                  <DialogDescription>
                    Enter the title and description for your new todo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTodo} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Todo title..."
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Description (optional)"
                      value={newTodoDescription}
                      onChange={(e) => setNewTodoDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !newTodoTitle.trim() || createTodoMutation.isPending
                      }
                    >
                      {createTodoMutation.isPending
                        ? "Creating..."
                        : "Create Todo"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Todo list */}
        {isLoading ? (
          <p className="text-muted-foreground">Loading todos...</p>
        ) : error ? (
          <p className="text-muted-foreground">Failed to load todos</p>
        ) : todos.length === 0 ? (
          <p className="text-muted-foreground">
            {showPendingOnly ? "No pending todos found" : "No todos found"}
          </p>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {todo.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-1">
                  <p
                    className={`font-medium text-card-foreground ${
                      todo.completed ? "line-through opacity-60" : ""
                    }`}
                  >
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p
                      className={`text-sm text-muted-foreground ${
                        todo.completed ? "line-through opacity-60" : ""
                      }`}
                    >
                      {todo.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(todo.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
