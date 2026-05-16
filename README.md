# Linky

Linky is a link management app backed by each user's Notion workspace. Bun SQLite is used only for auth sessions, OAuth tokens, and Notion resource ids. Link groups, group notes, links, and link notes are stored in Notion.

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

- `database.db` is created automatically on startup.
- The Notion access token is stored locally so server-side routes can make Notion API requests for the signed-in user.
- On sign-in, the app creates a private `Linky` page for the user, then creates `Linky Groups` and `Linky Links` Notion databases under that page if the signed-in user does not already have local Notion resource ids.
