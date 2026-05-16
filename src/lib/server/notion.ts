import { Client, isFullDatabase } from "@notionhq/client";
import { updateUserNotionPage, updateUserNotionResources } from "./user";

import type { OAuth2Tokens } from "arctic";
import type { User, UpsertUserInput } from "./user";

const notionVersion = "2026-03-11";
const appPageTitle = "Linky";
const groupsDatabaseTitle = "Linky Groups";
const linksDatabaseTitle = "Linky Links";

export async function getNotionProfile(accessToken: string): Promise<NotionProfile> {
	const notion = createNotionClient(accessToken);
	return notion.users.me({});
}

export function getUserInputFromNotion(tokens: OAuth2Tokens, profile: NotionProfile): UpsertUserInput {
	const data = tokens.data as NotionTokenData;
	const ownerUser = data.owner?.type === "user" ? data.owner.user : null;
	const notionUserId = ownerUser?.id ?? profile.id ?? data.bot_id;

	if (typeof notionUserId !== "string") {
		throw new Error("Notion did not return a user or bot id");
	}

	return {
		notionUserId,
		notionName: ownerUser?.name ?? profile.name ?? data.workspace_name ?? "Notion user",
		notionAvatarUrl: ownerUser?.avatar_url ?? profile.avatar_url ?? null,
		notionAccessToken: tokens.accessToken(),
		notionRefreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
		notionBotId: data.bot_id ?? null,
		notionWorkspaceId: data.workspace_id ?? null,
		notionWorkspaceName: data.workspace_name ?? null,
		notionPageId: null,
		notionGroupsDatabaseId: null,
		notionGroupsDataSourceId: null,
		notionLinksDatabaseId: null,
		notionLinksDataSourceId: null
	};
}

export async function ensureUserNotionDatabase(user: User): Promise<User> {
	const notion = createNotionClient(user.notionAccessToken);
	const page = user.notionPageId === null ? await createUserPage(notion, user) : user;

	if (
		page.notionGroupsDatabaseId !== null &&
		page.notionGroupsDataSourceId !== null &&
		page.notionLinksDatabaseId !== null &&
		page.notionLinksDataSourceId !== null
	) {
		return page;
	}
	if (page.notionPageId === null) {
		throw new Error("Notion page was not created");
	}

	const groups = await createGroupsDatabase(notion, page.notionPageId);
	const links = await createLinksDatabase(notion, page.notionPageId, groups.dataSourceId);

	return updateUserNotionResources(page.id, {
		groupsDatabaseId: groups.databaseId,
		groupsDataSourceId: groups.dataSourceId,
		linksDatabaseId: links.databaseId,
		linksDataSourceId: links.dataSourceId
	});
}

async function createGroupsDatabase(notion: Client, parentPageId: string): Promise<NotionDatabaseIds> {
	const database = await notion.databases.create({
		parent: {
			type: "page_id",
			page_id: parentPageId
		},
		title: [
			{
				type: "text",
				text: {
					content: groupsDatabaseTitle
				}
			}
		],
		initial_data_source: {
			properties: {
				Name: {
					type: "title",
					title: {}
				},
				Notes: {
					type: "rich_text",
					rich_text: {}
				},
				"Created at": {
					type: "created_time",
					created_time: {}
				}
			}
		}
	});

	return getDatabaseIds(database);
}

async function createLinksDatabase(
	notion: Client,
	parentPageId: string,
	groupsDataSourceId: string
): Promise<NotionDatabaseIds> {
	const database = await notion.databases.create({
		parent: {
			type: "page_id",
			page_id: parentPageId
		},
		title: [
			{
				type: "text",
				text: {
					content: linksDatabaseTitle
				}
			}
		],
		initial_data_source: {
			properties: {
				Title: {
					type: "title",
					title: {}
				},
				URL: {
					type: "url",
					url: {}
				},
				Notes: {
					type: "rich_text",
					rich_text: {}
				},
				Group: {
					type: "relation",
					relation: {
						data_source_id: groupsDataSourceId,
						type: "single_property",
						single_property: {}
					}
				},
				"Created at": {
					type: "created_time",
					created_time: {}
				}
			}
		}
	});

	return getDatabaseIds(database);
}

function getDatabaseIds(database: Awaited<ReturnType<Client["databases"]["create"]>>): NotionDatabaseIds {
	if (!isFullDatabase(database)) {
		throw new Error(`No read permissions on database: ${database.id}`);
	}
	const dataSourceId = database.data_sources[0]?.id;
	if (dataSourceId === undefined) {
		throw new Error("Notion did not return a data source id");
	}
	return {
		databaseId: database.id,
		dataSourceId
	};
}

async function createUserPage(notion: Client, user: User): Promise<User> {
	const page = await notion.pages.create({
		parent: {
			type: "workspace",
			workspace: true
		},
		properties: {
			title: {
				type: "title",
				title: [
					{
						type: "text",
						text: {
							content: appPageTitle
						}
					}
				]
			}
		},
		children: [
			{
				object: "block",
				type: "paragraph",
				paragraph: {
					rich_text: [
						{
							type: "text",
							text: {
								content: "Linky stores your link groups, group notes, links, and link notes in the databases below."
							}
						}
					]
				}
			}
		]
	});

	return updateUserNotionPage(user.id, page.id);
}

function createNotionClient(accessToken: string): Client {
	return new Client({
		auth: accessToken,
		notionVersion
	});
}

interface NotionTokenData {
	access_token?: string;
	refresh_token?: string;
	bot_id?: string;
	workspace_id?: string;
	workspace_name?: string;
	owner?: {
		type?: string;
		user?: {
			id?: string;
			name?: string;
			avatar_url?: string | null;
		};
	};
}

type NotionProfile = Awaited<ReturnType<Client["users"]["me"]>>;

interface NotionDatabaseIds {
	databaseId: string;
	dataSourceId: string;
}
