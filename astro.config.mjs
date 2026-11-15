// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { fileURLToPath } from 'node:url';

const variables = fileURLToPath(new URL('./src/styles/variables.scss', import.meta.url));

// https://astro.build/config
export default defineConfig({
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `@use "${variables.replaceAll('\\', '/')}" as *;`
                }
            }
        }
    },
    fonts: [
        {
            provider: fontProviders.bunny(),
            name: "SN Pro",
            cssVariable: "--font-sn-pro"
        },
        {
            provider: fontProviders.bunny(),
            name: "Liter",
            cssVariable: "--font-liter"
        }
    ]
});
