# Hipocampo

![CI](https://github.com/cramkle/hipocampo/workflows/CI/badge.svg)

Hipocampo is the [GraphQL](https://graphql.org) API for the [Cramkle](https://cramkle.com/) project.

## Getting started

To setup this project, run the following commands:

```sh
git clone https://github.com/cramkle/hipocampo
cd hipocampo

# Install dependencies
yarn
```

This project also depends on [MongoDB](https://www.mongodb.com/) (for persistent storage) and [Redis](https://redis.io/)
(for session storage), so you will need to install those as well. If you use [Homebrew](https://brew.sh/), you can run
the following commands to install them:

```sh
brew update
brew install mongodb-community redis
```

### Development

Now that you've setup all the project dependencies, you can start developing by running:

```sh
yarn dev
```

This will start the API on [http://localhost:5000/](http://localhost:5000). You can access
GraphiQL by accessing the [/graphql](http://localhost:5000/graphql) route.
