import { Client, isFullDatabase } from "@notionhq/client";
import { updateUserNotionDatabase, updateUserNotionPage } from "./user";

import type { OAuth2Tokens } from "arctic";
import type { User, UpsertUserInput } from "./user";

const notionVersion = "2026-03-11";
const appDatabaseTitle = "SvelteKit OAuth Example";

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
		notionDatabaseId: null,
		notionDataSourceId: null
	};
}

export async function ensureUserNotionDatabase(user: User): Promise<User> {
	const notion = createNotionClient(user.notionAccessToken);
	const page = user.notionPageId === null ? await createUserPage(notion, user) : user;

	if (page.notionDatabaseId !== null && page.notionDataSourceId !== null) {
		return page;
	}
	if (page.notionPageId === null) {
		throw new Error("Notion page was not created");
	}

	const database = await notion.databases.create({
		parent: {
			type: "page_id",
			page_id: page.notionPageId
		},
		title: [
			{
				type: "text",
				text: {
					content: appDatabaseTitle
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
				Created: {
					type: "date",
					date: {}
				}
			}
		}
	});

	if (!isFullDatabase(database)) {
		throw new Error(`No read permissions on database: ${database.id}`);
	}
	const dataSourceId = database.data_sources[0]?.id;
	if (dataSourceId === undefined) {
		throw new Error("Notion did not return a data source id");
	}

	return updateUserNotionDatabase(page.id, database.id, dataSourceId);
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
							content: `${user.notionName}'s SvelteKit OAuth Example`
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
								content: "This page was created by the SvelteKit OAuth example."
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
