// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import Icons from 'unplugin-icons/vite'
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
        },
        plugins: [
            Icons({ compiler: 'astro' }),
        ],
    },
    fonts: [
        {
            provider: fontProviders.bunny(),
            name: "SN Pro",
            cssVariable: "--font-sn-pro",
            weights: ["200 900"]
        },
        {
            provider: fontProviders.bunny(),
            name: "Liter",
            cssVariable: "--font-liter"
        }
    ]
});
