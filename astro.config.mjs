import { defineConfig } from 'astro/config';
export default defineConfig({ site: process.env.SITE_URL || 'https://toolhype.dev', output: 'static', trailingSlash: 'never', build: { format: 'file' } });
