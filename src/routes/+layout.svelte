<script lang="ts">
  // Import polyfills first
  import '$lib/polyfills';
  
  import '../app.postcss';
  import { AppShell, AppBar } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { storePopup } from '@skeletonlabs/skeleton';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { initAnalytics, trackPageView } from '$lib/services/analytics';
  
  // Initialize Skeleton stores
  initializeStores();
  
  // Register floating UI for popups
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  
  // Initialize analytics
  onMount(() => {
    initAnalytics();
    
    // Track page views when route changes
    const unsubscribe = page.subscribe(($page) => {
      trackPageView($page.url.pathname);
    });
    
    return () => {
      unsubscribe();
    };
  });
</script>

<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <AppBar>
      <svelte:fragment slot="lead">
        <a href="/" class="flex items-center">
          <strong class="text-xl">Prompt Engineering Game</strong>
        </a>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <a href="/" class="btn btn-sm variant-ghost-surface">Home</a>
        <a href="/game" class="btn btn-sm variant-ghost-surface">Play</a>
        <a href="/leaderboard" class="btn btn-sm variant-ghost-surface">Leaderboard</a>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  
  <!-- Page Content -->
  <main class="container mx-auto p-4">
    <slot />
  </main>
  
  <!-- Footer -->
  <svelte:fragment slot="footer">
    <div class="container mx-auto p-4 text-center">
      <p>© 2023 Prompt Engineering Game - MVP Version</p>
    </div>
  </svelte:fragment>
</AppShell>

<style>
  /* Removed dropdown styles as they're no longer needed */
</style> 