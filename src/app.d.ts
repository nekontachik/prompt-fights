// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			getSession: () => Promise<{
				user: {
					id: string;
					email?: string;
					app_metadata?: {
						role?: string;
					};
				} | null;
			}>;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
