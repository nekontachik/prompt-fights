// This is a mock implementation for browser compatibility
import type { Handle } from '@sveltejs/kit';

// Mock handle function for server hooks
export const handle: Handle = async ({ event, resolve }) => {
  // Mock authentication logic
  event.locals.getSession = async () => {
    // Return a mock session for testing
    return {
      user: {
        id: 'mock-user-id',
        email: 'user@example.com',
        app_metadata: {
          role: 'user'
        }
      }
    };
  };

  return resolve(event);
}; 