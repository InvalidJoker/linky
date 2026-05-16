import { dev } from "$app/environment";
import { getNotion } from "$lib/server/oauth";
import { redirect } from "@sveltejs/kit";
import { generateState } from "arctic";

import type { RequestEvent } from "./$types";

export function GET(event: RequestEvent): Response {
	const state = generateState();
	const notion = getNotion();
	const url = notion.createAuthorizationURL(state);

	event.cookies.set("notion_oauth_state", state, {
		maxAge: 60 * 10,
		secure: !dev || event.url.protocol === "https",
		path: "/"
	});

	redirect(307, url.toString());
}
