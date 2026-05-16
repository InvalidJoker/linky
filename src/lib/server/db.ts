import { Database as SQLiteDatabase } from "bun:sqlite";
import { SyncDatabase } from "@pilcrowjs/db-query";

import type { SyncAdapter } from "@pilcrowjs/db-query";
import type { SQLQueryBindings } from "bun:sqlite";

type RunResult = {
	lastInsertRowid: number | bigint;
	changes: number;
};

const sqlite = new SQLiteDatabase("database.db", {
	create: true,
	strict: true
});

sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");

sqlite.run(`
CREATE TABLE IF NOT EXISTS user (
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

CREATE INDEX IF NOT EXISTS notion_user_id_index ON user(notion_user_id);

CREATE TABLE IF NOT EXISTS session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);
`);

const adapter: SyncAdapter<RunResult> = {
	query: (statement: string, params: unknown[]): unknown[][] => {
		return sqlite.query(statement).values(...(params as SQLQueryBindings[]));
	},
	execute: (statement: string, params: unknown[]): RunResult => {
		return sqlite.query(statement).run(...(params as SQLQueryBindings[]));
	}
};

export const db = new SyncDatabase(adapter);
