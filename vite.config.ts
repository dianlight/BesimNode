import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        root: './',
    },
    plugins: [
        // This is required to build the test files with SWC
        swc.vite({
            // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
            module: { type: 'es6' },
        }),
    ],
});
/*
import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';
import swc from 'rollup-plugin-swc';

// import typescript from "rollup-plugin-typescript2";

const swcPlugin = (() => {
    const plugin = swc({
        test: 'ts',
        jsc: {
            parser: {
                syntax: 'typescript',
                dynamicImport: true,
                decorators: true,
            },
            target: 'es2021',
            transform: {
                decoratorMetadata: true,
            },
        },
    });

    const originalTransform = plugin.transform!;

    const transform = function (...args: Parameters<typeof originalTransform>) {
        if (!args[1].endsWith('html')) return originalTransform.apply(this, args);
    };

    return { ...plugin, transform };
})();

export default defineConfig({
    plugins: [swcPlugin],
    // esbuild: false,
    build: {},
});
*/
