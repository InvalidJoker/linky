<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Linky</title>
</svelte:head>

{@render children()}
