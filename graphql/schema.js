const { buildSchema } = require("graphql");

module.exports = buildSchema(
  `
  #graphql
   
  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
}
    type User {
        _id: ID!
        email: String!
        name: String!
        password: String
        posts: [Post!]!
    }
    input UserInputData {
        email: String!
        name: String!
        password: String!
    }
    type RootMutation {
        createUser(userInput: UserInputData): User!
    }

    type RootQuery {
        hello: String
    }
    schema {
        
    
        query: RootQuery
       mutation: RootMutation
    }
`
);
