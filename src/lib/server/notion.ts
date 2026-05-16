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

export async function getLinkyWorkspace(user: User): Promise<LinkyWorkspace> {
	const groupsDataSourceId = requireResourceId(user.notionGroupsDataSourceId, "groups data source");
	const linksDataSourceId = requireResourceId(user.notionLinksDataSourceId, "links data source");
	const notion = createNotionClient(user.notionAccessToken);
	const [groups, links] = await Promise.all([
		queryGroups(notion, groupsDataSourceId),
		queryLinks(notion, linksDataSourceId)
	]);

	return {
		groups,
		links
	};
}

export async function createLinkGroup(user: User, input: CreateGroupInput): Promise<void> {
	const groupsDataSourceId = requireResourceId(user.notionGroupsDataSourceId, "groups data source");
	const notion = createNotionClient(user.notionAccessToken);
	await notion.pages.create({
		parent: {
			data_source_id: groupsDataSourceId
		},
		properties: {
			Name: {
				type: "title",
				title: [
					{
						type: "text",
						text: {
							content: input.name
						}
					}
				]
			},
			Notes: {
				type: "rich_text",
				rich_text: input.notes === "" ? [] : richText(input.notes)
			}
		}
	});
}

export async function createLink(user: User, input: CreateLinkInput): Promise<void> {
	const linksDataSourceId = requireResourceId(user.notionLinksDataSourceId, "links data source");
	const notion = createNotionClient(user.notionAccessToken);
	await notion.pages.create({
		parent: {
			data_source_id: linksDataSourceId
		},
		properties: {
			Title: {
				type: "title",
				title: richText(input.title)
			},
			URL: {
				type: "url",
				url: input.url
			},
			Notes: {
				type: "rich_text",
				rich_text: input.notes === "" ? [] : richText(input.notes)
			},
			Group: {
				type: "relation",
				relation: input.groupId === "" ? [] : [{ id: input.groupId }]
			}
		}
	});
}

async function queryGroups(notion: Client, dataSourceId: string): Promise<LinkGroup[]> {
	const response = await notion.dataSources.query({
		data_source_id: dataSourceId,
		sorts: [
			{
				property: "Name",
				direction: "ascending"
			}
		]
	});

	return response.results.filter(isPageResult).map((page) => ({
		id: page.id,
		name: titleProperty(page.properties.Name),
		notes: richTextProperty(page.properties.Notes),
		url: page.url,
		createdTime: page.created_time
	}));
}

async function queryLinks(notion: Client, dataSourceId: string): Promise<LinkItem[]> {
	const response = await notion.dataSources.query({
		data_source_id: dataSourceId,
		sorts: [
			{
				timestamp: "created_time",
				direction: "descending"
			}
		]
	});

	return response.results.filter(isPageResult).map((page) => ({
		id: page.id,
		title: titleProperty(page.properties.Title),
		url: urlProperty(page.properties.URL),
		notes: richTextProperty(page.properties.Notes),
		groupIds: relationProperty(page.properties.Group),
		notionUrl: page.url,
		createdTime: page.created_time
	}));
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

function requireResourceId(value: string | null, label: string): string {
	if (value === null) {
		throw new Error(`Missing Notion ${label}`);
	}
	return value;
}

function richText(content: string): Array<{ type: "text"; text: { content: string } }> {
	return [
		{
			type: "text",
			text: {
				content
			}
		}
	];
}

function isPageResult(value: unknown): value is NotionPageResult {
	return (
		typeof value === "object" &&
		value !== null &&
		"object" in value &&
		(value as { object: unknown }).object === "page" &&
		"properties" in value
	);
}

function titleProperty(property: unknown): string {
	if (isProperty(property, "title")) {
		return property.title.map((item) => item.plain_text).join("");
	}
	return "";
}

function richTextProperty(property: unknown): string {
	if (isProperty(property, "rich_text")) {
		return property.rich_text.map((item) => item.plain_text).join("");
	}
	return "";
}

function urlProperty(property: unknown): string {
	if (isProperty(property, "url")) {
		return property.url ?? "";
	}
	return "";
}

function relationProperty(property: unknown): string[] {
	if (isProperty(property, "relation")) {
		return property.relation.map((item) => item.id);
	}
	return [];
}

function isProperty<TType extends string>(
	property: unknown,
	type: TType
): property is Extract<NotionProperty, { type: TType }> {
	return (
		typeof property === "object" &&
		property !== null &&
		"type" in property &&
		(property as { type: unknown }).type === type
	);
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

export interface LinkyWorkspace {
	groups: LinkGroup[];
	links: LinkItem[];
}

export interface LinkGroup {
	id: string;
	name: string;
	notes: string;
	url: string;
	createdTime: string;
}

export interface LinkItem {
	id: string;
	title: string;
	url: string;
	notes: string;
	groupIds: string[];
	notionUrl: string;
	createdTime: string;
}

export interface CreateGroupInput {
	name: string;
	notes: string;
}

export interface CreateLinkInput {
	title: string;
	url: string;
	notes: string;
	groupId: string;
}

interface NotionPageResult {
	object: "page";
	id: string;
	url: string;
	created_time: string;
	properties: Record<string, unknown>;
}

type NotionProperty =
	| {
			type: "title";
			title: Array<{ plain_text: string }>;
	  }
	| {
			type: "rich_text";
			rich_text: Array<{ plain_text: string }>;
	  }
	| {
			type: "url";
			url: string | null;
	  }
	| {
			type: "relation";
			relation: Array<{ id: string }>;
	  };
