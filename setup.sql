CREATE TABLE user (
    id INTEGER NOT NULL PRIMARY KEY,
    notion_user_id TEXT NOT NULL UNIQUE,
    notion_name TEXT NOT NULL,
    notion_avatar_url TEXT,
    notion_access_token TEXT NOT NULL,
    notion_refresh_token TEXT,
    notion_bot_id TEXT,
    notion_workspace_id TEXT,
    notion_workspace_name TEXT,
    notion_page_id TEXT,
    notion_database_id TEXT,
    notion_data_source_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX notion_user_id_index ON user(notion_user_id);

CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);
