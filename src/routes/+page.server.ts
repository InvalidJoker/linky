import { fail, redirect } from "@sveltejs/kit";
import { deleteSessionTokenCookie, invalidateSession } from "$lib/server/session";
import { createLink, createLinkGroup, ensureUserNotionDatabase, getLinkyWorkspace } from "$lib/server/notion";

import type { Actions, RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, "/login");
	}
	const user = await ensureUserNotionDatabase(event.locals.user);
	const workspace = await getLinkyWorkspace(user);
	return {
		user,
		workspace
	};
}

export const actions: Actions = {
	createGroup,
	createLink: createLinkAction,
	signOut
};

async function createGroup(event: RequestEvent) {
	if (event.locals.user === null) {
		return fail(401);
	}
	const formData = await event.request.formData();
	const name = stringField(formData, "name").trim();
	const notes = stringField(formData, "notes").trim();

	if (name === "") {
		return fail(400, {
			createGroupError: "Group name is required."
		});
	}

	const user = await ensureUserNotionDatabase(event.locals.user);
	await createLinkGroup(user, {
		name,
		notes
	});
	return {
		createdGroup: true
	};
}

async function createLinkAction(event: RequestEvent) {
	if (event.locals.user === null) {
		return fail(401);
	}
	const formData = await event.request.formData();
	const title = stringField(formData, "title").trim();
	const url = stringField(formData, "url").trim();
	const notes = stringField(formData, "notes").trim();
	const groupId = stringField(formData, "groupId");

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
		groupId
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
