<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  
  export let topic: string;
</script>

<div 
  class="w-full text-center py-3 mb-4 bg-surface-700/50 rounded-lg"
  in:fly={{ y: -20, duration: 300 }}
>
  <div class="flex flex-col items-center">
    <div class="text-sm uppercase tracking-wider text-surface-300">Current Topic</div>
    <div class="text-2xl font-bold text-primary-300">{topic}</div>
  </div>
</div> 