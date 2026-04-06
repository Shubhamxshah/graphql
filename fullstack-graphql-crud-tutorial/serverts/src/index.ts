import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const todos = [
  { id: 1, title: "run 5kms", completed: false },
  { id: 2, title: "learn apollo graphql", completed: false },
  { id: 3, title: "make a websocket project", completed: false },
];

const typeDefs = `
  type Query {
    getTodos: [Todo]
    getTodoById(id: ID!): Todo
  }

  type Mutation {
    addTodo(input: InputTodo!): Todo
    updateTodo(input: InputTodo!): Todo
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

const resolvers = {
  Query: {
    getTodos: () => {
      return todos;
    },
    getTodoById: (_: any, args: { id: string }) => {
      const id = parseInt(args.id);
      return todos.find((todo) => todo.id === id);
    },
  },
  Mutation: {
    addTodo: (
      _: any,
      { input }: { input: { title: string; completed?: boolean } },
    ) => {
      const { title } = input;
      const id = todos.length + 1;

      const newTodo = {
        id,
        title,
        completed: false,
      };

      todos.push(newTodo);
      return newTodo;
    },
    updateTodo: (
      _: any,
      { input }: { input: { id: string; title?: string; completed?: boolean } },
    ) => {
      const { id, title, completed } = input;
      const todoId = parseInt(id);

      const todoIndex = todos.findIndex((todo) => todo.id === todoId);
      if (todoIndex === -1) {
        throw new Error(`Todo with id ${id} not found`);
      }

      const updatedTodo = {
        ...todos[todoIndex],
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
      };

      todos[todoIndex] = updatedTodo;
      return updatedTodo;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, {
  listen: { port: 4001 },
});

console.log(`Server running at port ${url}`);
