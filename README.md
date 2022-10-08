# GraphQL Server

A basic graphql server developed with Apollo+Express in TypeScript

implements Query, Mutation and Subscription

## List all messsages

Operation

```graphql
query MessageQuery {
    messages {
        id
        user {
            id
            name
        }
        text
    }
}
```

## Get user details

Variables

```json
{ "id": "1" }
```

Operation

```graphql
query UserQuery($id: ID!) {
    user(id: $id) {
        id
        name
        messages {
            id
            text
        }
    }
}
```

## Add a new message

Variables

```json
{ "messageInput": { "text": "hello !" } }
```

Operation

```graphql
mutation AddMessageMutation($messageInput: MessageInput!) {
    addMessage(input: $messageInput) {
        id
        user {
            id
            name
        }
        text
    }
}
```

## Subscribe to new Messages

```graphql
subscription MessageAddedSubscription {
    messageAdded {
        id
        user {
            id
            name
        }
        text
    }
}
```
