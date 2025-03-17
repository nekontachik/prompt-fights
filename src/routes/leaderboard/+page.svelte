<script lang="ts">
  import { onMount } from 'svelte';
  import { getLeaderboard, type LeaderboardEntry } from '$lib/services/supabase';
  
  let leaderboardData: LeaderboardEntry[] = [];
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      loading = true;
      leaderboardData = await getLeaderboard();
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      error = 'Failed to load leaderboard data. Please try again later.';
    } finally {
      loading = false;
    }
  });
  
  // Format date for display
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
</script>

<div class="container mx-auto max-w-4xl">
  <div class="card p-6 variant-glass-surface">
    <header class="card-header">
      <h1 class="h1 mb-4">Leaderboard</h1>
      <p class="mb-4">See the top prompt engineers and their scores</p>
    </header>
    
    <section class="p-4">
      {#if loading}
        <div class="flex justify-center p-8">
          <div class="spinner-orbit-center" />
        </div>
      {:else if error}
        <div class="alert variant-filled-error">
          <span>{error}</span>
        </div>
      {:else if leaderboardData.length === 0}
        <div class="alert variant-filled-surface">
          <span>No leaderboard data available yet. Be the first to play!</span>
        </div>
      {:else}
        <div class="table-container">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Game Mode</th>
                <th>Model</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {#each leaderboardData as entry, i}
                <tr class={i < 3 ? 'variant-soft-primary' : ''}>
                  <td>{i + 1}</td>
                  <td>{entry.username || 'Anonymous'}</td>
                  <td>
                    <div class="badge variant-filled-{entry.score >= 80 ? 'success' : entry.score >= 60 ? 'warning' : 'error'}">
                      {entry.score}
                    </div>
                  </td>
                  <td>{entry.game_mode}</td>
                  <td>{entry.model.split('/').pop()}</td>
                  <td>{formatDate(entry.created_at)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
    
    <footer class="card-footer">
      <a href="/game" class="btn variant-filled-primary">Play Now</a>
    </footer>
  </div>
</div> 