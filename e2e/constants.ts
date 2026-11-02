// The e2e run has its own server, on its own port, so it never collides with `npm run dev` on port 3000.
export const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;
