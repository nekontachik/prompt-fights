import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	define: {
		// Polyfill for Node.js globals
		global: 'window',
	},
	
	resolve: {
		alias: {
			// Handle Node.js modules in the browser
			'node-fetch': 'isomorphic-fetch',
		}
	},

	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [],
		globals: true
	}
});
