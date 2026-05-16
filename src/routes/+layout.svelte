<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Notion OAuth example in SvelteKit</title>
</svelte:head>

{@render children()}
