<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	let image = $derived(data.user.notionAvatarUrl);
</script>

<h1>Hi, {data.user.notionName}!</h1>
{#if image !== null}
	<img src={image} height="100" width="100" alt="profile" />
{/if}
<p>Workspace: {data.user.notionWorkspaceName ?? "Unknown workspace"}</p>
<p>Page ID: {data.user.notionPageId ?? "Not created yet"}</p>
<p>Database ID: {data.user.notionDatabaseId ?? "Not created yet"}</p>
<p>Data source ID: {data.user.notionDataSourceId ?? "Not created yet"}</p>
<form method="post" use:enhance>
	<button>Sign out</button>
</form>
