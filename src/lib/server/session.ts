import { dev } from "$app/environment";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { ensureDatabase, sql } from "./db";
import { rowToUser } from "./user";

import type { User, UserRow } from "./user";
import type { RequestEvent } from "@sveltejs/kit";

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	await ensureDatabase();
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const rows = await sql<SessionUserRow[]>`
SELECT
	session.id AS session_id,
	session.user_id,
	session.expires_at,
	app_user.id,
	app_user.notion_user_id,
	app_user.notion_name,
	app_user.notion_avatar_url,
	app_user.notion_access_token,
	app_user.notion_refresh_token,
	app_user.notion_bot_id,
	app_user.notion_workspace_id,
	app_user.notion_workspace_name,
	app_user.notion_page_id,
	app_user.notion_groups_database_id,
	app_user.notion_groups_data_source_id,
	app_user.notion_links_database_id,
	app_user.notion_links_data_source_id
FROM session
INNER JOIN app_user ON session.user_id = app_user.id
WHERE session.id = ${sessionId}
`;
	const row = rows[0];

	if (row === undefined) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row.session_id,
		userId: row.user_id,
		expiresAt: new Date(row.expires_at * 1000)
	};
	const user = rowToUser(row);
	if (Date.now() >= session.expiresAt.getTime()) {
		await sql`DELETE FROM session WHERE id = ${session.id}`;
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await sql`
UPDATE session
SET expires_at = ${Math.floor(session.expiresAt.getTime() / 1000)}
WHERE id = ${session.id}
`;
	}
	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await ensureDatabase();
	await sql`DELETE FROM session WHERE id = ${sessionId}`;
}

export async function invalidateUserSessions(userId: number): Promise<void> {
	await ensureDatabase();
	await sql`DELETE FROM session WHERE user_id = ${userId}`;
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("session", token, {
		path: "/",
		secure: !dev || event.url.protocol === "https",
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set("session", "", {
		path: "/",
		secure: !dev || event.url.protocol === "https",
		maxAge: 0
	});
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32(tokenBytes).toLowerCase();
	return token;
}

export async function createSession(token: string, userId: number): Promise<Session> {
	await ensureDatabase();
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await sql`
INSERT INTO session (id, user_id, expires_at)
VALUES (${session.id}, ${session.userId}, ${Math.floor(session.expiresAt.getTime() / 1000)})
`;
	return session;
}

export interface Session {
	id: string;
	expiresAt: Date;
	userId: number;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

interface SessionUserRow extends UserRow {
	session_id: string;
	user_id: number;
	expires_at: number;
}
