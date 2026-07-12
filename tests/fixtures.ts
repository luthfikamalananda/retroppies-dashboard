import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import { SESSION_STORAGE_FILE } from './global-setup';

// A `test` that starts every page already logged in, by replaying the
// sessionStorage captured once in global-setup.ts. Import this instead of
// '@playwright/test' in any spec that needs an authenticated session.
export const test = base.extend({
    context: async ({ context }, use) => {
        if (fs.existsSync(SESSION_STORAGE_FILE)) {
            const sessionStorage = JSON.parse(fs.readFileSync(SESSION_STORAGE_FILE, 'utf-8'));
            await context.addInitScript((storage: Record<string, string>) => {
                for (const [key, value] of Object.entries(storage)) {
                    window.sessionStorage.setItem(key, value);
                }
            }, sessionStorage);
        }
        await use(context);
    },
});

export { expect };
