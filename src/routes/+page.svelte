<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();

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

<main class="min-h-screen bg-zinc-950 text-zinc-100">
	<header class="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between gap-4">
				<a class="flex items-center gap-3" href="/">
					<div class="grid size-10 place-items-center rounded-lg bg-emerald-500 text-lg font-semibold text-zinc-950">
						L
					</div>
					<div>
						<p class="text-sm text-zinc-400">Notion-backed link manager</p>
						<h1 class="text-xl font-semibold tracking-tight">Linky</h1>
					</div>
				</a>
				<div class="flex items-center gap-3">
					<div class="hidden text-right sm:block">
						<p class="text-sm font-medium">{data.user.notionName}</p>
						<p class="text-xs text-zinc-500">{data.user.notionWorkspaceName ?? "Notion workspace"}</p>
					</div>
					{#if avatar !== null}
						<img class="size-10 rounded-full border border-zinc-700" src={avatar} alt="" />
					{/if}
					<form method="post" action="?/signOut" use:enhance>
						<button
							class="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
						>
							Sign out
						</button>
					</form>
				</div>
			</div>

			<nav class="mt-4 flex gap-2 overflow-x-auto pb-1">
				<a class="shrink-0 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950" href="/"
					>All links</a
				>
				{#each data.workspace.groups as group}
					<a
						class="shrink-0 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
						href={`/groups/${group.id}`}
					>
						{group.name}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
		<aside class="space-y-4">
			<section class="rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
				<h2 class="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Workspace</h2>
				<div class="mt-4 grid grid-cols-2 gap-3">
					<div class="rounded-md bg-zinc-950 p-3">
						<p class="text-2xl font-semibold">{groupCount}</p>
						<p class="text-sm text-zinc-500">Groups</p>
					</div>
					<div class="rounded-md bg-zinc-950 p-3">
						<p class="text-2xl font-semibold">{linkCount}</p>
						<p class="text-sm text-zinc-500">Links</p>
					</div>
				</div>
				<a
					class="mt-4 block truncate rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
					href={`https://www.notion.so/${data.user.notionPageId}`}
					target="_blank"
					rel="noreferrer"
				>
					Open Linky in Notion
				</a>
			</section>

			<section class="rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
				<h2 class="text-base font-semibold">New group</h2>
				<form class="mt-4 space-y-3" method="post" action="?/createGroup" use:enhance>
					<label class="block">
						<span class="text-sm font-medium text-zinc-300">Name</span>
						<input
							class="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-950 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500"
							name="name"
							placeholder="Research, tools, ideas"
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-zinc-300">Notes</span>
						<textarea
							class="mt-1 block min-h-24 w-full rounded-md border-zinc-700 bg-zinc-950 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500"
							name="notes"
							placeholder="What belongs in this group?"
						></textarea>
					</label>
					{#if form?.createGroupError}
						<p class="text-sm text-red-400">{form.createGroupError}</p>
					{/if}
					<button
						class="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-400"
					>
						Create group
					</button>
				</form>
			</section>
		</aside>

		<section class="space-y-5">
			<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 class="text-2xl font-semibold tracking-tight">All links</h2>
						<p class="mt-1 text-sm text-zinc-400">Switch to a group tab to add links directly into that group.</p>
					</div>
					<div class="rounded-md bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
						Synced with Notion
					</div>
				</div>
			</div>

			{#if groupCount === 0 && linkCount === 0}
				<div class="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
					<h2 class="text-lg font-semibold">Start with a group</h2>
					<p class="mx-auto mt-2 max-w-md text-sm text-zinc-400">
						Create a category like Reading, Competitors, or Design Patterns. Then open the group page to add links.
					</p>
				</div>
			{:else}
				{#each groupedLinks as section}
					<article class="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
						<header class="border-b border-zinc-800 p-5">
							<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<h3 class="text-lg font-semibold">{section.group.name}</h3>
									{#if section.group.notes !== ""}
										<p class="mt-1 text-sm text-zinc-400">{section.group.notes}</p>
									{/if}
								</div>
								<a
									class="text-sm font-medium text-emerald-300 hover:text-emerald-200"
									href={`/groups/${section.group.id}`}
								>
									Open group page
								</a>
							</div>
						</header>
						<div class="divide-y divide-zinc-800">
							{#if section.links.length === 0}
								<p class="p-5 text-sm text-zinc-500">No links in this group yet.</p>
							{:else}
								{#each section.links as link}
									<a class="block p-5 hover:bg-zinc-800/60" href={link.url} target="_blank" rel="noreferrer">
										<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
											<div class="min-w-0">
												<h4 class="truncate text-base font-semibold">{link.title}</h4>
												<p class="truncate text-sm text-zinc-500">{link.url}</p>
												{#if link.notes !== ""}
													<p class="mt-2 text-sm text-zinc-400">{link.notes}</p>
												{/if}
											</div>
											<span class="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">Open</span>
										</div>
									</a>
								{/each}
							{/if}
						</div>
					</article>
				{/each}

				{#if uncategorizedLinks.length > 0}
					<article class="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
						<header class="border-b border-zinc-800 p-5">
							<h3 class="text-lg font-semibold">Uncategorized</h3>
						</header>
						<div class="divide-y divide-zinc-800">
							{#each uncategorizedLinks as link}
								<a class="block p-5 hover:bg-zinc-800/60" href={link.url} target="_blank" rel="noreferrer">
									<h4 class="truncate text-base font-semibold">{link.title}</h4>
									<p class="truncate text-sm text-zinc-500">{link.url}</p>
									{#if link.notes !== ""}
										<p class="mt-2 text-sm text-zinc-400">{link.notes}</p>
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
