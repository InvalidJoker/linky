<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();

	let groupsById = $derived(new Map(data.workspace.groups.map((group) => [group.id, group])));
	let uncategorizedLinks = $derived(data.workspace.links.filter((link) => link.groupIds.length === 0));
	let groupedLinks = $derived(
		data.workspace.groups.map((group) => ({
			group,
			links: data.workspace.links.filter((link) => link.groupIds.includes(group.id))
		}))
	);
	let linkCount = $derived(data.workspace.links.length);
	let groupCount = $derived(data.workspace.groups.length);
	let avatar = $derived(data.user.notionAvatarUrl);
</script>

<main class="min-h-screen bg-zinc-50 text-zinc-950">
	<header class="border-b border-zinc-200 bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center gap-3">
				<div class="grid size-10 place-items-center rounded-lg bg-emerald-600 text-lg font-semibold text-white">L</div>
				<div>
					<p class="text-sm text-zinc-500">Notion-backed link manager</p>
					<h1 class="text-xl font-semibold tracking-tight">Linky</h1>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="hidden text-right sm:block">
					<p class="text-sm font-medium">{data.user.notionName}</p>
					<p class="text-xs text-zinc-500">{data.user.notionWorkspaceName ?? "Notion workspace"}</p>
				</div>
				{#if avatar !== null}
					<img class="size-10 rounded-full border border-zinc-200" src={avatar} alt="" />
				{/if}
				<form method="post" action="?/signOut" use:enhance>
					<button
						class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
					>
						Sign out
					</button>
				</form>
			</div>
		</div>
	</header>

	<div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
		<aside class="space-y-4">
			<section class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
				<h2 class="text-sm font-semibold tracking-wide text-zinc-500 uppercase">Workspace</h2>
				<div class="mt-4 grid grid-cols-2 gap-3">
					<div class="rounded-md bg-zinc-100 p-3">
						<p class="text-2xl font-semibold">{groupCount}</p>
						<p class="text-sm text-zinc-500">Groups</p>
					</div>
					<div class="rounded-md bg-zinc-100 p-3">
						<p class="text-2xl font-semibold">{linkCount}</p>
						<p class="text-sm text-zinc-500">Links</p>
					</div>
				</div>
				<a
					class="mt-4 block truncate rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
					href={`https://www.notion.so/${data.user.notionPageId}`}
					target="_blank"
					rel="noreferrer"
				>
					Open Linky in Notion
				</a>
			</section>

			<section class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
				<h2 class="text-base font-semibold">New group</h2>
				<form class="mt-4 space-y-3" method="post" action="?/createGroup" use:enhance>
					<label class="block">
						<span class="text-sm font-medium text-zinc-700">Name</span>
						<input
							class="mt-1 block w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
							name="name"
							placeholder="Research, tools, ideas"
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-zinc-700">Notes</span>
						<textarea
							class="mt-1 block min-h-24 w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
							name="notes"
							placeholder="What belongs in this group?"
						></textarea>
					</label>
					{#if form?.createGroupError}
						<p class="text-sm text-red-600">{form.createGroupError}</p>
					{/if}
					<button
						class="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
					>
						Create group
					</button>
				</form>
			</section>

			<section class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
				<h2 class="text-base font-semibold">New link</h2>
				<form class="mt-4 space-y-3" method="post" action="?/createLink" use:enhance>
					<label class="block">
						<span class="text-sm font-medium text-zinc-700">Title</span>
						<input
							class="mt-1 block w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
							name="title"
							placeholder="Tailwind docs"
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-zinc-700">URL</span>
						<input
							class="mt-1 block w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
							name="url"
							placeholder="https://example.com"
							type="url"
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-zinc-700">Group</span>
						<select
							class="mt-1 block w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
							name="groupId"
						>
							<option value="">Uncategorized</option>
							{#each data.workspace.groups as group}
								<option value={group.id}>{group.name}</option>
							{/each}
						</select>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-zinc-700">Notes</span>
						<textarea
							class="mt-1 block min-h-24 w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
							name="notes"
							placeholder="Why is this worth saving?"
						></textarea>
					</label>
					{#if form?.createLinkError}
						<p class="text-sm text-red-600">{form.createLinkError}</p>
					{/if}
					<button
						class="w-full rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
					>
						Save link
					</button>
				</form>
			</section>
		</aside>

		<section class="space-y-5">
			<div class="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 class="text-2xl font-semibold tracking-tight">Library</h2>
						<p class="mt-1 text-sm text-zinc-500">
							Groups and links are read from and written to your Notion databases.
						</p>
					</div>
					<div class="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Synced with Notion</div>
				</div>
			</div>

			{#if groupCount === 0 && linkCount === 0}
				<div class="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
					<h2 class="text-lg font-semibold">Start with a group or a link</h2>
					<p class="mx-auto mt-2 max-w-md text-sm text-zinc-500">
						Create categories like Reading, Competitors, or Design Patterns. Add notes to the group, then save links
						into it.
					</p>
				</div>
			{:else}
				{#each groupedLinks as section}
					<article class="rounded-lg border border-zinc-200 bg-white shadow-sm">
						<header class="border-b border-zinc-200 p-5">
							<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<h3 class="text-lg font-semibold">{section.group.name}</h3>
									{#if section.group.notes !== ""}
										<p class="mt-1 text-sm text-zinc-500">{section.group.notes}</p>
									{/if}
								</div>
								<a
									class="text-sm font-medium text-emerald-700 hover:text-emerald-800"
									href={section.group.url}
									target="_blank"
									rel="noreferrer"
								>
									Open group
								</a>
							</div>
						</header>
						<div class="divide-y divide-zinc-100">
							{#if section.links.length === 0}
								<p class="p-5 text-sm text-zinc-500">No links in this group yet.</p>
							{:else}
								{#each section.links as link}
									<a class="block p-5 hover:bg-zinc-50" href={link.url} target="_blank" rel="noreferrer">
										<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
											<div class="min-w-0">
												<h4 class="truncate text-base font-semibold">{link.title}</h4>
												<p class="truncate text-sm text-zinc-500">{link.url}</p>
												{#if link.notes !== ""}
													<p class="mt-2 text-sm text-zinc-600">{link.notes}</p>
												{/if}
											</div>
											<span class="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">Open</span>
										</div>
									</a>
								{/each}
							{/if}
						</div>
					</article>
				{/each}

				{#if uncategorizedLinks.length > 0}
					<article class="rounded-lg border border-zinc-200 bg-white shadow-sm">
						<header class="border-b border-zinc-200 p-5">
							<h3 class="text-lg font-semibold">Uncategorized</h3>
						</header>
						<div class="divide-y divide-zinc-100">
							{#each uncategorizedLinks as link}
								<a class="block p-5 hover:bg-zinc-50" href={link.url} target="_blank" rel="noreferrer">
									<h4 class="truncate text-base font-semibold">{link.title}</h4>
									<p class="truncate text-sm text-zinc-500">{link.url}</p>
									{#if link.notes !== ""}
										<p class="mt-2 text-sm text-zinc-600">{link.notes}</p>
									{/if}
								</a>
							{/each}
						</div>
					</article>
				{/if}
			{/if}
		</section>
	</div>
</main>
