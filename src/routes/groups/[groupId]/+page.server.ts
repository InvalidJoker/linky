import { fail, redirect } from "@sveltejs/kit";
import { createLink, ensureUserNotionDatabase, getLinkyWorkspace } from "$lib/server/notion";
import { deleteSessionTokenCookie, invalidateSession } from "$lib/server/session";

import type { Actions, RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, "/login");
	}
	const user = await ensureUserNotionDatabase(event.locals.user);
	const workspace = await getLinkyWorkspace(user);
	const group = workspace.groups.find((item) => item.id === event.params.groupId) ?? null;

	if (group === null) {
		return redirect(302, "/");
	}

	return {
		user,
		workspace,
		group,
		links: workspace.links.filter((link) => link.groupIds.includes(group.id))
	};
}

export const actions: Actions = {
	createLink: createLinkAction,
	signOut
};

async function createLinkAction(event: RequestEvent) {
	if (event.locals.user === null) {
		return fail(401);
	}
	const formData = await event.request.formData();
	const title = stringField(formData, "title").trim();
	const url = stringField(formData, "url").trim();
	const notes = stringField(formData, "notes").trim();

	if (title === "" || url === "") {
		return fail(400, {
			createLinkError: "Title and URL are required."
		});
	}

	try {
		new URL(url);
	} catch {
		return fail(400, {
			createLinkError: "Enter a valid URL."
		});
	}

	const user = await ensureUserNotionDatabase(event.locals.user);
	await createLink(user, {
		title,
		url,
		notes,
		groupId: event.params.groupId
	});
	return {
		createdLink: true
	};
}

async function signOut(event: RequestEvent) {
	if (event.locals.session === null) {
		return fail(401);
	}
	await invalidateSession(event.locals.session.id);
	deleteSessionTokenCookie(event);
	return redirect(302, "/login");
}

function stringField(formData: FormData, name: string): string {
	const value = formData.get(name);
	return typeof value === "string" ? value : "";
}
