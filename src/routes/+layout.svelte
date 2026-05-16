<script lang="ts">
	import "./layout.css";

	let { children } = $props();
</script>

<svelte:head><title>Linky</title></svelte:head>
{@render children()}
