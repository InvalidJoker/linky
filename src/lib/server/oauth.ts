import { env } from "$env/dynamic/private";
import { Notion } from "arctic";

const defaultRedirectURI = "http://localhost:5173/login/notion/callback";

export function getNotion(): Notion {
	const { NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI } = env;

	if (NOTION_CLIENT_ID === undefined || NOTION_CLIENT_SECRET === undefined) {
		throw new Error("Missing NOTION_CLIENT_ID or NOTION_CLIENT_SECRET");
	}

	return new Notion(NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI ?? defaultRedirectURI);
}
