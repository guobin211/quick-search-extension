// noinspection JSUnusedGlobalSymbols

import fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import postcssPresetEnv from 'postcss-preset-env';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const root = path.dirname(fileURLToPath(import.meta.url));
const extension = path.join(root, 'src');
const popup = path.join(extension, 'popup.html');
const options = path.join(extension, 'options.html');
const serviceWorker = path.join(extension, 'service_worker.ts');
const inputs = [popup, options, serviceWorker];
const base = path.join(root, 'extension');

async function build_node_database() {

}

function build_manifest(name: string) {
  const appName = name.split('').map((c, i) => i === 0 ? c.toUpperCase() : c).join('');
  function build_manifest(name: string) {
    return `{
  "name": "${appName} Search Extension",
  "description": "The quick search extension for Developer!",
  "version": "0.1.0",
  "manifest_version": 3,
  "icons": {
    "128": "assets/${name}.png"
  },
  "permissions": ["storage", "unlimitedStorage"],
  "action": {
    "default_title": "${appName} Search Extension",
    "default_icon": "assets/${name}.png",
    "default_popup": "src/popup.html"
  },
  "background": {
    "service_worker": "service_worker.js"
  },
  "omnibox": {
    "keyword": "${name}"
  },
  "options_ui": {
    "open_in_tab": true,
    "page": "src/options.html"
  },
  "content_scripts": []
}`;
  }
  const manifest = build_manifest(name);
  function save(name, content) {
    fs.writeFileSync('manifest.json', content);
  }
  save(name, manifest);
  return appName;
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const current_output = path.join(base, mode);
  const app_name = build_manifest(mode);
  switch (mode) {
    case 'node':
      await build_node_database();
      break;
    default:
      console.log(`unknown mode: ${mode}`)
      break;
  }
  return {
    define: {
      '__mode__': JSON.stringify(mode),
      '__app_name__': JSON.stringify(app_name),
    },
    css: {
      postcss: {
        plugins: [postcssPresetEnv()]
      }
    },
    build: {
      rollupOptions: {
        input: inputs,
        output: {
          chunkFileNames: '[name].[hash].js',
          assetFileNames: '[name].[hash].[ext]',
          entryFileNames: '[name].js',
          dir: current_output,
        }
      }
    },
    plugins: [
      svelte(),
      viteStaticCopy({
        targets: [
          {
            src: 'src/assets/**',
            dest: path.join(current_output, 'assets')
          },
          {
            src: 'manifest.json',
            dest: path.join(current_output)
          }
        ]
      })
    ]
  };
});
