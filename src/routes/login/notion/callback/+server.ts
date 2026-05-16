import { getNotion } from "$lib/server/oauth";
import { ensureUserNotionDatabase, getNotionProfile, getUserInputFromNotion } from "$lib/server/notion";
import { upsertUser } from "$lib/server/user";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/session";
import { error, redirect } from "@sveltejs/kit";

import type { OAuth2Tokens } from "arctic";
import type { RequestEvent } from "./$types";

export async function GET(event: RequestEvent): Promise<Response> {
	const storedState = event.cookies.get("notion_oauth_state") ?? null;
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const oauthError = event.url.searchParams.get("error");

	if (oauthError !== null) {
		error(400, {
			message: "Notion authorization was cancelled."
		});
	}
	if (storedState === null || code === null || state === null) {
		error(400, {
			message: "Please restart the process."
		});
	}
	if (storedState !== state) {
		error(400, {
			message: "Please restart the process."
		});
	}

	let tokens: OAuth2Tokens;
	try {
		const notion = getNotion();
		tokens = await notion.validateAuthorizationCode(code);
	} catch (e) {
		error(400, {
			message: "Please restart the process."
		});
	}

	try {
		const accessToken = tokens.accessToken();
		const profile = await getNotionProfile(accessToken);
		const userInput = getUserInputFromNotion(tokens, profile);
		const user = await ensureUserNotionDatabase(upsertUser(userInput));
		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} catch (e) {
		console.error(e);
		error(400, {
			message: "Notion setup failed. Make sure the connection can insert content."
		});
	}
	redirect(307, "/");
}
