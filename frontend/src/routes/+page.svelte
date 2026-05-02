<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    goto("/login", { replaceState: true });
  });
</script>

<div class="flex min-h-[80vh] items-center justify-center">
  <span class="loading loading-spinner loading-lg text-primary"></span>
</div>
