import { defineConfig } from "vite";
import vituum from "vituum";
import eslint from "vite-plugin-eslint";
import { config } from 'dotenv';

// Charger les variables d'environnement du fichier .env
config();

// Récupère le token GitHub depuis les variables d'environnement
const githubToken = process.env.GITHUB_TOKEN;

export default defineConfig({
    base: "./",
    plugins: [
        vituum({
            pages: {
                dir: "./src",
                root: "./",
                normalizeBasePath: true
            },
        }),
        eslint({
            include: "./src/**/*.js",
            failOnError: false,
        }),
    ],
    build: {
        target: "esnext",
        rollupOptions: {
            input: ["src/index.html"],
        },
    },
    define: {
        "import.meta.env.VERSION": JSON.stringify(
            process.env.npm_package_version
        ),
        "import.meta.env.GITHUB_TOKEN": JSON.stringify(githubToken),
    },
    server: {
        host: true,
        open: true,
    },
    test: {
        exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/cypress/**",
            "**/worklets/**",
            "**/.{idea,git,cache,output,temp}/**",
            "**/e2e/**",
        ],
        environment: 'happy-dom',
        css: false,
    },
});
