interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class TodoService {
  private todos: Map<string, Todo> = new Map();
  private nextId = 1;

  private generateId(): string {
    return (this.nextId++).toString();
  }

  create(title: string, description?: string): Todo {
    const id = this.generateId();
    const now = new Date();
    const todo: Todo = {
      id,
      title,
      description,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.set(id, todo);
    return todo;
  }

  getAll(): Todo[] {
    return Array.from(this.todos.values());
  }

  getById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  update(
    id: string,
    updates: Partial<Pick<Todo, "title" | "description" | "completed">>
  ): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) {
      return undefined;
    }

    const updatedTodo: Todo = {
      ...todo,
      ...updates,
      updatedAt: new Date(),
    };

    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  delete(id: string): boolean {
    return this.todos.delete(id);
  }

  markCompleted(id: string): Todo | undefined {
    return this.update(id, { completed: true });
  }

  markIncomplete(id: string): Todo | undefined {
    return this.update(id, { completed: false });
  }

  getCompleted(): Todo[] {
    return this.getAll().filter((todo) => todo.completed);
  }

  getPending(): Todo[] {
    return this.getAll().filter((todo) => !todo.completed);
  }

  clear(): void {
    this.todos.clear();
  }
}

export { Todo, TodoService };
