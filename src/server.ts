import fs from "fs";
import { ApolloServer } from "apollo-server-express";
import express, { Request } from "express";
import { resolvers } from "./resolvers";
import http from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { GraphQLSchema } from "graphql";

// ====================== INITIALIZATION ======================

const PORT = 9000;
const path = "/graphql";

const app = express();
app.use(express.json());

const typeDefs = fs.readFileSync("./src/schema.graphql", { encoding: "utf8" });

export type AppContext = { userId: string };
export type ContextFn<Context> = (args: { req: Request }) => Context;

const context: ContextFn<AppContext> = ({ req }) => {
    return { userId: req.headers.userid as string };
};

// ====================== APOLLO STUFF ======================

// more info on subscriptions: https://www.apollographql.com/docs/apollo-server/data/subscriptions/

const properShutdownWebsocketServerPlugin = (args: { httpServer: http.Server; schema: GraphQLSchema }) => {
    const { httpServer, schema } = args;
    // Creating the WebSocket server
    const wsServer = new WebSocketServer({
        server: httpServer,
        path,
    });

    // Hand in the schema we just created and have the
    // WebSocketServer start listening.
    const serverCleanup = useServer({ schema }, wsServer);
    return {
        async serverWillStart() {
            return {
                async drainServer() {
                    await serverCleanup.dispose();
                },
            };
        },
    };
};

const properShutdownHttpServerPlugin = (args: { httpServer: http.Server }) => ApolloServerPluginDrainHttpServer(args);

const startApolloServer = async (httpServer: http.Server) => {
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const apolloServer = new ApolloServer({
        schema,
        csrfPrevention: true,
        cache: "bounded",
        context,
        plugins: [
            properShutdownHttpServerPlugin({ httpServer }),
            properShutdownWebsocketServerPlugin({ httpServer, schema }),
            ApolloServerPluginLandingPageLocalDefault({ embed: true }),
        ],
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app, path });
    return apolloServer;
};

// ====================== START SERVER ======================

const httpServer = http.createServer(app);
const apolloServer = startApolloServer(httpServer);
httpServer.listen(PORT, async () => {
    const { graphqlPath } = await apolloServer;
    console.log(`Query and mutation http://localhost:${PORT}${graphqlPath}`);
    console.log(`Subscription ws://localhost:${PORT}${graphqlPath}`);
});
