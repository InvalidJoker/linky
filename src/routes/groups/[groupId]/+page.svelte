<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();

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
						<p class="text-sm text-zinc-400">Group workspace</p>
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
				<a
					class="shrink-0 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
					href="/"
				>
					All links
				</a>
				{#each data.workspace.groups as group}
					<a
						class={[
							"shrink-0 rounded-md px-3 py-2 text-sm font-medium",
							group.id === data.group.id
								? "bg-emerald-500 text-zinc-950"
								: "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
						]}
						href={`/groups/${group.id}`}
					>
						{group.name}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
		<aside class="space-y-4">
			<section class="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
				<p class="text-sm font-semibold tracking-wide text-emerald-300 uppercase">Current group</p>
				<h2 class="mt-2 text-2xl font-semibold tracking-tight">{data.group.name}</h2>
				{#if data.group.notes !== ""}
					<p class="mt-3 text-sm leading-6 text-zinc-400">{data.group.notes}</p>
				{:else}
					<p class="mt-3 text-sm text-zinc-500">No group notes yet.</p>
				{/if}
				<a
					class="mt-5 block rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
					href={data.group.url}
					target="_blank"
					rel="noreferrer"
				>
					Open group in Notion
				</a>
			</section>

			<section class="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
				<h2 class="text-base font-semibold">Add link to {data.group.name}</h2>
				<form class="mt-4 space-y-3" method="post" action="?/createLink" use:enhance>
					<label class="block">
						<span class="text-sm font-medium text-zinc-300">Title</span>
						<input
							class="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-950 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500"
							name="title"
							placeholder="Useful article"
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-zinc-300">URL</span>
						<input
							class="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-950 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500"
							name="url"
							placeholder="https://example.com"
							type="url"
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-zinc-300">Notes</span>
						<textarea
							class="mt-1 block min-h-28 w-full rounded-md border-zinc-700 bg-zinc-950 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500"
							name="notes"
							placeholder="Why does this matter for this group?"
						></textarea>
					</label>
					{#if form?.createLinkError}
						<p class="text-sm text-red-400">{form.createLinkError}</p>
					{/if}
					<button
						class="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-400"
					>
						Add to {data.group.name}
					</button>
				</form>
			</section>
		</aside>

		<section class="space-y-5">
			<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 class="text-2xl font-semibold tracking-tight">{data.group.name} links</h2>
						<p class="mt-1 text-sm text-zinc-400">
							Every link created here is automatically related to this Notion group.
						</p>
					</div>
					<div class="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-300">
						{data.links.length} saved
					</div>
				</div>
			</div>

			{#if data.links.length === 0}
				<div class="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
					<h2 class="text-lg font-semibold">No links in this group yet</h2>
					<p class="mx-auto mt-2 max-w-md text-sm text-zinc-400">
						Use the form on the left to add the first link to {data.group.name}.
					</p>
				</div>
			{:else}
				<div class="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
					<div class="divide-y divide-zinc-800">
						{#each data.links as link}
							<a class="block p-5 hover:bg-zinc-800/60" href={link.url} target="_blank" rel="noreferrer">
								<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
									<div class="min-w-0">
										<h3 class="truncate text-base font-semibold">{link.title}</h3>
										<p class="truncate text-sm text-zinc-500">{link.url}</p>
										{#if link.notes !== ""}
											<p class="mt-2 text-sm text-zinc-400">{link.notes}</p>
										{/if}
									</div>
									<span class="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">Open</span>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</section>
	</div>
</main>
