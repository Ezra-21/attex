import { defineConfig } from 'vitest/config'

// Standalone Vitest config. The unit tests cover pure logic in src/lib, so no
// Vite/React plugins or DOM environment are required.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/store/**/*.ts'],
      exclude: ['src/lib/api.ts', 'src/lib/supabase.ts'],
    },
  },
})
