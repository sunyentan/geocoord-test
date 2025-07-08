import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.REACT_APP_GRAPHQL_URI,
});

const authLink = new ApolloLink((operation, forward) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  const apiSecret = process.env.REACT_APP_API_SECRET;

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      'x-api-key': apiKey ?? '',
      'x-api-secret': apiSecret ?? '',
    },
  }));

  return forward(operation);
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
