import { PubSub } from "graphql-subscriptions";
import { AppContext } from "./server";

const pubSub = new PubSub();
const MESSAGE_ADDED = "MESSAGE_ADDED";

type UserDef = {
    id: string;
    name: string;
};

type MessageDef = {
    id: string;
    userId: string;
    text: string;
};
// ====================== DATA ======================
let MID = 1;
const messages: MessageDef[] = [
    {
        id: `${MID++}`,
        userId: "1",
        text: "what",
    },
    {
        id: `${MID++}`,
        userId: "2",
        text: "who",
    },
];
let UID = 1;
const users: UserDef[] = [
    { id: `${UID++}`, name: "John Doe" },
    { id: `${UID++}`, name: "Jane Doe" },
];

// ====================== FUNCTIONS ======================
const requireAuth = (userId: string) => {
    if (!userId) throw new Error("Unauthorized");
};
const getAllMessages = (): MessageDef[] => messages;
const getMessagesOfUser = (userId: string): MessageDef[] =>
    getAllMessages().filter(({ userId: uid }) => uid === userId);
const getUser = (userId: string): UserDef | undefined => users.find(({ id }) => id === userId);
const saveMessage = (userId: string, text: string): MessageDef => {
    const message = { id: `${MID++}`, userId, text };
    messages.push(message);
    return message;
};
// ====================== RESOLVERS ======================
type UserResolvers = {
    messages: (user: UserDef) => MessageDef[];
};

type MessageResolver = {
    user: (message: MessageDef) => UserDef | undefined;
};

const User: UserResolvers = {
    messages: (user) => getMessagesOfUser(user.id),
};

const Message: MessageResolver = {
    user: (message) => getUser(message.userId),
};

// ====================== QUERY ======================
type QueryResolvers = {
    messages: (parent: unknown, args: never, context: AppContext) => MessageDef[];
    user: (parent: unknown, args: { id: string }, context: AppContext) => UserDef | undefined;
};

const Query: QueryResolvers = {
    messages: (_parent, _args, { userId }) => {
        requireAuth(userId);
        return getAllMessages();
    },
    user: (_parent, { id }, { userId }) => {
        requireAuth(userId);
        return getUser(id);
    },
};

// ====================== MUTATION ======================
type MessageInput = {
    input: {
        text: string;
    };
};

type MutationResolvers = {
    addMessage: (parent: unknown, args: MessageInput, context: AppContext) => MessageDef;
};

const Mutation: MutationResolvers = {
    addMessage: (_root, { input: { text } }, { userId }) => {
        console.log({ text, userId });
        requireAuth(userId);
        const message = saveMessage(userId, text);
        pubSub.publish(MESSAGE_ADDED, { messageAdded: message });
        return message;
    },
};

// ====================== SUBSCRIPTION ======================
const Subscription = {
    messageAdded: {
        subscribe: () => pubSub.asyncIterator(MESSAGE_ADDED),
    },
};

// ====================== EXPORTS ======================

export const resolvers = { Query, Mutation, Subscription, User, Message };
