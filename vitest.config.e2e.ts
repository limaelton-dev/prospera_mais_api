import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['test/**/*.e2e-spec.ts'],
        setupFiles: ['./test/setup-env.ts'],
        fileParallelism: false,
        testTimeout: 15000,
        hookTimeout: 45000,
    },
});