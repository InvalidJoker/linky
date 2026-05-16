import { db } from "./db";

import type { Row } from "@pilcrowjs/db-query";

export function upsertUser(input: UpsertUserInput): User {
	const now = Math.floor(Date.now() / 1000);
	const row = db.queryOne(
		`
INSERT INTO user (
	notion_user_id,
	notion_name,
	notion_avatar_url,
	notion_access_token,
	notion_refresh_token,
	notion_bot_id,
	notion_workspace_id,
	notion_workspace_name,
	notion_page_id,
	notion_groups_database_id,
	notion_groups_data_source_id,
	notion_links_database_id,
	notion_links_data_source_id,
	created_at,
	updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(notion_user_id) DO UPDATE SET
	notion_name = excluded.notion_name,
	notion_avatar_url = excluded.notion_avatar_url,
	notion_access_token = excluded.notion_access_token,
	notion_refresh_token = excluded.notion_refresh_token,
	notion_bot_id = excluded.notion_bot_id,
	notion_workspace_id = excluded.notion_workspace_id,
	notion_workspace_name = excluded.notion_workspace_name,
	updated_at = excluded.updated_at
RETURNING
	id,
	notion_user_id,
	notion_name,
	notion_avatar_url,
	notion_access_token,
	notion_refresh_token,
	notion_bot_id,
	notion_workspace_id,
	notion_workspace_name,
	notion_page_id,
	notion_groups_database_id,
	notion_groups_data_source_id,
	notion_links_database_id,
	notion_links_data_source_id
`,
		[
			input.notionUserId,
			input.notionName,
			input.notionAvatarUrl,
			input.notionAccessToken,
			input.notionRefreshToken,
			input.notionBotId,
			input.notionWorkspaceId,
			input.notionWorkspaceName,
			input.notionPageId,
			input.notionGroupsDatabaseId,
			input.notionGroupsDataSourceId,
			input.notionLinksDatabaseId,
			input.notionLinksDataSourceId,
			now,
			now
		]
	);
	if (row === null) {
		throw new Error("Unexpected error");
	}
	return rowToUser(row);
}

export function updateUserNotionPage(userId: number, notionPageId: string): User {
	const row = db.queryOne(
		`
UPDATE user
SET notion_page_id = ?, updated_at = ?
WHERE id = ?
RETURNING
	id,
	notion_user_id,
	notion_name,
	notion_avatar_url,
	notion_access_token,
	notion_refresh_token,
	notion_bot_id,
	notion_workspace_id,
	notion_workspace_name,
	notion_page_id,
	notion_groups_database_id,
	notion_groups_data_source_id,
	notion_links_database_id,
	notion_links_data_source_id
`,
		[notionPageId, Math.floor(Date.now() / 1000), userId]
	);
	if (row === null) {
		throw new Error("Unexpected error");
	}
	return rowToUser(row);
}

export function updateUserNotionResources(userId: number, resources: NotionResourceIds): User {
	const row = db.queryOne(
		`
UPDATE user
SET
	notion_groups_database_id = ?,
	notion_groups_data_source_id = ?,
	notion_links_database_id = ?,
	notion_links_data_source_id = ?,
	updated_at = ?
WHERE id = ?
RETURNING
	id,
	notion_user_id,
	notion_name,
	notion_avatar_url,
	notion_access_token,
	notion_refresh_token,
	notion_bot_id,
	notion_workspace_id,
	notion_workspace_name,
	notion_page_id,
	notion_groups_database_id,
	notion_groups_data_source_id,
	notion_links_database_id,
	notion_links_data_source_id
`,
		[
			resources.groupsDatabaseId,
			resources.groupsDataSourceId,
			resources.linksDatabaseId,
			resources.linksDataSourceId,
			Math.floor(Date.now() / 1000),
			userId
		]
	);
	if (row === null) {
		throw new Error("Unexpected error");
	}
	return rowToUser(row);
}

export interface User {
	id: number;
	notionUserId: string;
	notionName: string;
	notionAvatarUrl: string | null;
	notionAccessToken: string;
	notionRefreshToken: string | null;
	notionBotId: string | null;
	notionWorkspaceId: string | null;
	notionWorkspaceName: string | null;
	notionPageId: string | null;
	notionGroupsDatabaseId: string | null;
	notionGroupsDataSourceId: string | null;
	notionLinksDatabaseId: string | null;
	notionLinksDataSourceId: string | null;
}

export interface UpsertUserInput {
	notionUserId: string;
	notionName: string;
	notionAvatarUrl: string | null;
	notionAccessToken: string;
	notionRefreshToken: string | null;
	notionBotId: string | null;
	notionWorkspaceId: string | null;
	notionWorkspaceName: string | null;
	notionPageId: string | null;
	notionGroupsDatabaseId: string | null;
	notionGroupsDataSourceId: string | null;
	notionLinksDatabaseId: string | null;
	notionLinksDataSourceId: string | null;
}

export interface NotionResourceIds {
	groupsDatabaseId: string;
	groupsDataSourceId: string;
	linksDatabaseId: string;
	linksDataSourceId: string;
}

function rowToUser(row: Row): User {
	return {
		id: row.number(0),
		notionUserId: row.string(1),
		notionName: row.string(2),
		notionAvatarUrl: row.stringNullable(3),
		notionAccessToken: row.string(4),
		notionRefreshToken: row.stringNullable(5),
		notionBotId: row.stringNullable(6),
		notionWorkspaceId: row.stringNullable(7),
		notionWorkspaceName: row.stringNullable(8),
		notionPageId: row.stringNullable(9),
		notionGroupsDatabaseId: row.stringNullable(10),
		notionGroupsDataSourceId: row.stringNullable(11),
		notionLinksDatabaseId: row.stringNullable(12),
		notionLinksDataSourceId: row.stringNullable(13)
	};
}
