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
<p>Groups data source ID: {data.user.notionGroupsDataSourceId ?? "Not created yet"}</p>
<p>Links data source ID: {data.user.notionLinksDataSourceId ?? "Not created yet"}</p>
<form method="post" use:enhance>
	<button>Sign out</button>
</form>
