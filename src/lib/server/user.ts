import { ensureDatabase, sql } from "./db";

export async function upsertUser(input: UpsertUserInput): Promise<User> {
	await ensureDatabase();
	const now = Math.floor(Date.now() / 1000);
	const rows = await sql<UserRow[]>`
INSERT INTO app_user (
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
VALUES (
	${input.notionUserId},
	${input.notionName},
	${input.notionAvatarUrl},
	${input.notionAccessToken},
	${input.notionRefreshToken},
	${input.notionBotId},
	${input.notionWorkspaceId},
	${input.notionWorkspaceName},
	${input.notionPageId},
	${input.notionGroupsDatabaseId},
	${input.notionGroupsDataSourceId},
	${input.notionLinksDatabaseId},
	${input.notionLinksDataSourceId},
	${now},
	${now}
)
ON CONFLICT(notion_user_id) DO UPDATE SET
	notion_name = excluded.notion_name,
	notion_avatar_url = excluded.notion_avatar_url,
	notion_access_token = excluded.notion_access_token,
	notion_refresh_token = excluded.notion_refresh_token,
	notion_bot_id = excluded.notion_bot_id,
	notion_workspace_id = excluded.notion_workspace_id,
	notion_workspace_name = excluded.notion_workspace_name,
	updated_at = excluded.updated_at
RETURNING *
`;
	const row = rows[0];
	if (row === undefined) {
		throw new Error("Unexpected error");
	}
	return rowToUser(row);
}

export async function updateUserNotionPage(userId: number, notionPageId: string): Promise<User> {
	await ensureDatabase();
	const rows = await sql<UserRow[]>`
UPDATE app_user
SET notion_page_id = ${notionPageId}, updated_at = ${Math.floor(Date.now() / 1000)}
WHERE id = ${userId}
RETURNING *
`;
	const row = rows[0];
	if (row === undefined) {
		throw new Error("Unexpected error");
	}
	return rowToUser(row);
}

export async function updateUserNotionResources(userId: number, resources: NotionResourceIds): Promise<User> {
	await ensureDatabase();
	const rows = await sql<UserRow[]>`
UPDATE app_user
SET
	notion_groups_database_id = ${resources.groupsDatabaseId},
	notion_groups_data_source_id = ${resources.groupsDataSourceId},
	notion_links_database_id = ${resources.linksDatabaseId},
	notion_links_data_source_id = ${resources.linksDataSourceId},
	updated_at = ${Math.floor(Date.now() / 1000)}
WHERE id = ${userId}
RETURNING *
`;
	const row = rows[0];
	if (row === undefined) {
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

export interface UserRow {
	id: number;
	notion_user_id: string;
	notion_name: string;
	notion_avatar_url: string | null;
	notion_access_token: string;
	notion_refresh_token: string | null;
	notion_bot_id: string | null;
	notion_workspace_id: string | null;
	notion_workspace_name: string | null;
	notion_page_id: string | null;
	notion_groups_database_id: string | null;
	notion_groups_data_source_id: string | null;
	notion_links_database_id: string | null;
	notion_links_data_source_id: string | null;
}

export function rowToUser(row: UserRow): User {
	return {
		id: row.id,
		notionUserId: row.notion_user_id,
		notionName: row.notion_name,
		notionAvatarUrl: row.notion_avatar_url,
		notionAccessToken: row.notion_access_token,
		notionRefreshToken: row.notion_refresh_token,
		notionBotId: row.notion_bot_id,
		notionWorkspaceId: row.notion_workspace_id,
		notionWorkspaceName: row.notion_workspace_name,
		notionPageId: row.notion_page_id,
		notionGroupsDatabaseId: row.notion_groups_database_id,
		notionGroupsDataSourceId: row.notion_groups_data_source_id,
		notionLinksDatabaseId: row.notion_links_database_id,
		notionLinksDataSourceId: row.notion_links_data_source_id
	};
}
