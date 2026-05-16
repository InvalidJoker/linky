# Notion OAuth example in SvelteKit

Uses Bun's native SQLite driver. Rate limiting is implemented using JavaScript `Map`.

## Initialize Project

Create a public Notion connection with the redirect URI pointed to `/login/notion/callback`.

```
http://localhost:5173/login/notion/callback
```

Enable the capabilities needed for your app to read user info and insert content, then paste the client ID and secret to a `.env` file.

```bash
NOTION_CLIENT_ID=""
NOTION_CLIENT_SECRET=""
```

Run the application:

```
bun run dev
```

## Notes

- `sqlite.db` is created automatically on startup.
- The Notion access token is stored locally so server-side routes can make Notion API requests for the signed-in user.
- On sign-in, the app creates a private Notion page for the user, then creates a Notion database named `SvelteKit OAuth Example` under that page if the signed-in user does not already have local Notion ids.
