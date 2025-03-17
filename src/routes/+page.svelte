<script lang="ts">
  import { AVAILABLE_MODELS } from '$lib/services/openrouter';
  import { GameMode, gameStore } from '$lib/stores/game-store';
  import { goto } from '$app/navigation';
  
  function startGame() {
    gameStore.reset();
    goto('/game');
  }
  
  function setGameMode(mode: GameMode) {
    gameStore.setGameMode(mode);
  }
  
  function setModel(model: string) {
    gameStore.setModel(model);
  }
</script>

<div class="container mx-auto max-w-4xl">
  <div class="card p-6 variant-glass-surface">
    <header class="card-header text-center">
      <h1 class="h1 mb-4">Prompt Engineering Game</h1>
      <p class="text-lg mb-8">Train your prompt engineering skills by building prompts word-by-word with AI</p>
    </header>
    
    <section class="p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Game Description -->
        <div>
          <h2 class="h2 mb-4">How to Play</h2>
          <ol class="list-decimal list-inside space-y-2">
            <li>You and the AI take turns adding words to build a prompt</li>
            <li>Try to create the most effective prompt possible</li>
            <li>When you're done, the AI will evaluate your prompt</li>
            <li>See which words contributed positively or negatively</li>
            <li>Learn from the feedback to improve your skills</li>
          </ol>
          
          <div class="mt-6">
            <h3 class="h3 mb-2">Benefits</h3>
            <ul class="list-disc list-inside space-y-2">
              <li>Learn prompt engineering patterns</li>
              <li>Understand how different words affect AI responses</li>
              <li>Practice creating clear, effective prompts</li>
              <li>Compare your skills with others on the leaderboard</li>
            </ul>
          </div>
        </div>
        
        <!-- Game Settings -->
        <div>
          <h2 class="h2 mb-4">Game Settings</h2>
          
          <!-- Game Mode Selection -->
          <div class="mb-6">
            <fieldset>
              <legend class="label mb-2">Game Mode</legend>
              <div class="flex flex-col gap-2">
                <button 
                  class="btn variant-{$gameStore.gameMode === GameMode.EASY ? 'filled' : 'soft'}-primary"
                  on:click={() => setGameMode(GameMode.EASY)}
                >
                  Easy Mode
                  <span class="badge ml-2">For beginners</span>
                </button>
                
                <button 
                  class="btn variant-{$gameStore.gameMode === GameMode.STANDARD ? 'filled' : 'soft'}-primary"
                  on:click={() => setGameMode(GameMode.STANDARD)}
                >
                  Standard Mode
                  <span class="badge ml-2">Balanced challenge</span>
                </button>
                
                <button 
                  class="btn variant-{$gameStore.gameMode === GameMode.EXPERT ? 'filled' : 'soft'}-primary"
                  on:click={() => setGameMode(GameMode.EXPERT)}
                >
                  Expert Mode
                  <span class="badge ml-2">Advanced prompting</span>
                </button>
              </div>
            </fieldset>
          </div>
          
          <!-- Model Selection -->
          <div class="mb-6">
            <label for="model-select" class="label mb-2">AI Model</label>
            <select 
              id="model-select"
              class="select w-full"
              value={$gameStore.selectedModel}
              on:change={(e) => setModel(e.currentTarget.value)}
            >
              <option value={AVAILABLE_MODELS.GPT35_TURBO}>GPT-3.5 Turbo</option>
              <option value={AVAILABLE_MODELS.LLAMA3}>Llama 3 (8B)</option>
              <option value={AVAILABLE_MODELS.MIXTRAL}>Mixtral 8x7B</option>
              <option value={AVAILABLE_MODELS.NEURAL_CHAT}>Neural Chat 7B</option>
            </select>
          </div>
          
          <!-- Start Game Button -->
          <button 
            class="btn variant-filled-primary w-full mt-4"
            on:click={startGame}
          >
            Start Game
          </button>
        </div>
      </div>
    </section>
  </div>
</div>
