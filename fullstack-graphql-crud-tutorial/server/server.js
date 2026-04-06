// index.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import { PubSub } from "graphql-subscriptions";

const users = [
  { id: "1", name: "John Doe", age: 30, isMarried: true },
  { id: "2", name: "Jane Smith", age: 25, isMarried: false },
  { id: "3", name: "Alice Johnson", age: 28, isMarried: false },
];

const posts = [
  { id: "101", title: "mountain", content: "is fireball", userId: "1" },
  { id: "102", title: "car", content: "is nice", userId: "1" },
  { id: "103", title: "bike", content: "is vroom", userId: "2" },
];

const pubsub = new PubSub();
const TODO_ADDED = "TODO_ADDED";
const TODO_UPDATED = "TODO_UPDATED";

const typeDefs = `
  type Query {
    getTodos: [Todo]
    getTodoById(id: ID!): Todo
  }

  type Mutation {
    addTodo(input: InputTodo!): Todo
    updateTodo(input: InputTodo!): Todo
  }

  type Subscription {
    todoAdded: Todo
    todoUpdated: Todo
  }

  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
  }

  input InputTodo {
    id: ID
    title: String!
    completed: Boolean
  }
`;

const todos = [
  { id: 1, title: "run 5kms", completed: false },
  { id: 2, title: "learn apollo graphql", completed: false },
  { id: 3, title: "make a websocket project", completed: false },
];

const resolvers = {
  Query: {
    getTodos: () => todos,
    getTodoById: (_, args) =>
      todos.find((todo) => todo.id === parseInt(args.id)),
  },

  Mutation: {
    addTodo: (_, { input }) => {
      const newTodo = {
        id: todos.length + 1,
        title: input.title,
        completed: input.completed ?? false,
      };
      todos.push(newTodo);
      pubsub.publish(TODO_ADDED, { todoAdded  : newTodo });
      return newTodo;
    },
    updateTodo: (_, { input }) => {
      const todoId = parseInt(input.id);
      const todo = todos.find((t) => t.id === todoId);
      if (!todo) throw new Error("Todo not found");

      if (input.title !== undefined) todo.title = input.title;
      if (input.completed !== undefined) todo.completed = input.completed;

      pubsub.publish(TODO_UPDATED, { todoUpdated: todo });
      return todo;
    },
  },

  Subscription: {
    todoAdded: {
      subscribe: () => pubsub.asyncIterableIterator([TODO_ADDED]),
    },
    todoUpdated: {
      subscribe: () => pubsub.asyncIterableIterator([TODO_UPDATED]),
    },
  },
};

const app = express();
const httpServer = createServer(app);

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
useServer({ schema }, wsServer);

const server = new ApolloServer({ schema });
await server.start();

app.use("/graphql", express.json(), expressMiddleware(server));

httpServer.listen(4001, () => {
  console.log("Server running on http://localhost:4001/graphql");
  console.log("Subscriptions at ws://localhost:4001/graphql");
});

///// Query, Mutation
//// typeDefs, resolvers
