import { ApolloServer, gql, AuthenticationError, UserInputError } from "apollo-server";
import db from './db';
import { v4 as uuid } from 'uuid';

const typeDefs = gql`
    type User {
        id: ID!
        name: String!
        email: String!
        password: String!

    }

    type Board {
        id: ID!
        name: String!
        createdAt: String!
        userId: ID!
    }

    type List {
        id: ID!
        name: String!
        createdAt: String!
        boardId: ID!
    }

    type Card {
        id: ID!
        data: String!
        createdAt: String!
        listId: ID!
    }

    type Token {
        username: String!
        token: String!
    }

    interface Response {
        status: String!
        message: String!
    }

    type LoginResponse implements Response {
        data: Token!
        status: String!
        message: String!
    }

    type Query {
        boards(userId: String!): [Board]!
        lists(boardId: String!): [List]!
        cards(listId: String!): [Card]!
    }

    type Mutation {
        login(username: String!, password: String!): LoginResponse
        createBoard(name: String!, userId: String!): String
        deleteBoard(id: String!): String
        createList(name: String!, boardId: String!): String
        deleteList(id: String!): String
        createCard(data: String!, listId: String!): String
        deleteCard(id: String!): String
    }
`;

const resolvers = {
    Query: {
        boards: (parent, { userId }, { db }, info) => {
            if(!userId) {
                throw new UserInputError('No userId in request');
            }
            const boards = db.get('boards').filter({userId}).value();
            return boards;
        },
        lists: (parent, { boardId }, { db }, info) => {
            if(!boardId) {
                throw new UserInputError('No boardId in request');
            }
            const lists = db.get('lists').filter({boardId}).value();
            return lists;
        },
        cards: (parent, { listId }, { db }, info) => {
            if(!listId) {
                throw new UserInputError('No listId in request');
            }
            const cards = db.get('cards').filter({listId}).value();
            return cards;
        }
    },

    Mutation: {
        login: (parent, { username, password }, { db }, info) => {
            if(!username || !password) {
                throw new UserInputError('No username or password in request');
            }
            const isValidAccount = db.get('accounts').value().some(account => account.username === username && account.password === password);
            if(!isValidAccount) {
                throw new AuthenticationError('Authentication failed');
            }
            const response = {
                username,
                token: uuid()
            }
            return {
                status: 'success',
                message: 'Authenticated successfully',
                data: response
            }
        },
        createBoard: (parent, { userId, name }, { db }, info) => {
            if(!userId || !name) {
                throw new UserInputError('No userId or boardName in request');
            }
            const newBoard = {
                id: uuid(),
                name,
                createdAt: Date.now(),
                userId
            };
            db.get('boards').push(newBoard).write();
            return {
                status: 'sucess',
                message: 'Board created',
                data: newBoard
            }
        },
        deleteBoard: (parent, { boardId }, { db }, info) => {
            if(!boardId) {
                throw new UserInputError('No boardId in request');
            }
            if(!db.get('boards').value().some(board => board.id === boardId)) {
                throw new UserInputError('Board does not exist');
            }
            db.get('boards').remove({id: boardId}).write();
            return res.json({
                status: 'success',
                message: 'Board deleted',
                data: {boardId}
            });
        },
        createList: (parent, { boardId, name }, { db }, info) => {
            if(!boardId || !name) {
                throw new UserInputError('No boardId or listName in request');
            }
            if(!db.get('boards').value().some(board => board.id === boardId)) {
                throw new UserInputError('Board does not exist');
            }
            const newList = {
                id: uuid(),
                boardId,
                name,
                createdAt: Date.now()
            };
            db.get('lists').push(newList).write();
            return {
                status: 'sucess',
                message: 'list created',
                data: newList
            }
        },
        deleteList: (parent, { listId }, { db }, info) => {
            if(!listId) {
                throw new UserInputError('No listId in request');
            }
            if(!db.get('lists').value().some(list => list.id === listId)) {
                throw new UserInputError('list does not exist');
            }
            db.get('lists').remove({id: listId}).write();
            return res.json({
                status: 'success',
                message: 'List deleted',
                data: {listId}
            });
        },
        createCard: (parent, { listId, data }, { db }, info) => {
            if(!listId || !data) {
                throw new UserInputError('No listId or data in request');
            }
            if(!db.get('lists').value().some(list => list.id === listId)) {
                throw new UserInputError('List does not exist');
            }
            const newCard = {
                id: uuid(),
                listId,
                data,
                createdAt: Date.now()
            };
            db.get('cards').push(newCard).write();
            return {
                status: 'sucess',
                message: 'Card created',
                data: newCard
            }
        },
        deleteCard: (parent, { cardId }, { db }, info) => {
            if(!cardId) {
                throw new UserInputError('No cardId in request');
            }
            if(!db.get('cards').value().some(card => card.id === cardId)) {
                throw new UserInputError('Card does not exist');
            }
            db.get('cards').remove({id: cardId}).write();
            return res.json({
                status: 'success',
                message: 'Card deleted',
                data: {cardId}
            });
        }
    }
};

if(!db.get('accounts').value().some(item => item.username === 'sid')) {
    db.get('accounts').push({username: 'sid', password: '123'}).write();
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => {
        // should parse headers to get auth token
        return { db };
    }
});

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});