To install dependencies:
```sh
bun install
```

To generate database migrations:
```sh
bun run generate
```

To apply database migrations:
```sh
bun run migrate
```

To run the development server:
```sh
bun run dev
```

## Authentication

This API uses Better Auth with username + password authentication. The authentication system is integrated with Hono.js using the context pattern.

### Authentication Endpoints

- `/api/auth/*` - Authentication endpoints provided by Better Auth
- `/api/protected` - Example protected route that requires authentication

### How to Use

1. Register a new user with a username and password
2. Login with your username and password
3. Access protected routes with the authentication token

open http://localhost:3000
