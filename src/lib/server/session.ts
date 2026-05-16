import { db } from "./db";
import { dev } from "$app/environment";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import type { User } from "./user";
import type { RequestEvent } from "@sveltejs/kit";

export function validateSessionToken(token: string): SessionValidationResult {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const row = db.queryOne(
		`
SELECT
	session.id,
	session.user_id,
	session.expires_at,
	user.id,
	user.notion_user_id,
	user.notion_name,
	user.notion_avatar_url,
	user.notion_access_token,
	user.notion_refresh_token,
	user.notion_bot_id,
	user.notion_workspace_id,
	user.notion_workspace_name,
	user.notion_page_id,
	user.notion_groups_database_id,
	user.notion_groups_data_source_id,
	user.notion_links_database_id,
	user.notion_links_data_source_id
FROM session
INNER JOIN user ON session.user_id = user.id
WHERE session.id = ?
`,
		[sessionId]
	);

	if (row === null) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row.string(0),
		userId: row.number(1),
		expiresAt: new Date(row.number(2) * 1000)
	};
	const user: User = {
		id: row.number(3),
		notionUserId: row.string(4),
		notionName: row.string(5),
		notionAvatarUrl: row.stringNullable(6),
		notionAccessToken: row.string(7),
		notionRefreshToken: row.stringNullable(8),
		notionBotId: row.stringNullable(9),
		notionWorkspaceId: row.stringNullable(10),
		notionWorkspaceName: row.stringNullable(11),
		notionPageId: row.stringNullable(12),
		notionGroupsDatabaseId: row.stringNullable(13),
		notionGroupsDataSourceId: row.stringNullable(14),
		notionLinksDatabaseId: row.stringNullable(15),
		notionLinksDataSourceId: row.stringNullable(16)
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		db.execute("DELETE FROM session WHERE id = ?", [session.id]);
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		db.execute("UPDATE session SET expires_at = ? WHERE session.id = ?", [
			Math.floor(session.expiresAt.getTime() / 1000),
			session.id
		]);
	}
	return { session, user };
}

export function invalidateSession(sessionId: string): void {
	db.execute("DELETE FROM session WHERE id = ?", [sessionId]);
}

export function invalidateUserSessions(userId: number): void {
	db.execute("DELETE FROM session WHERE user_id = ?", [userId]);
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

export function createSession(token: string, userId: number): Session {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	db.execute("INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)", [
		session.id,
		session.userId,
		Math.floor(session.expiresAt.getTime() / 1000)
	]);
	return session;
}

export interface Session {
	id: string;
	expiresAt: Date;
	userId: number;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
