// noinspection JSUnusedGlobalSymbols

import * as cheerio from 'cheerio';
import fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import postcssPresetEnv from 'postcss-preset-env';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const root = path.dirname(fileURLToPath(import.meta.url));
const extension = path.join(root, 'src');
const popup = path.join(extension, 'popup.html');
const options = path.join(extension, 'options.html');
const service_worker = path.join(extension, 'service_worker.ts');
const inputs = [popup, options, service_worker];
const base = path.join(root, 'extension');
const database = path.join(root, 'src/database');

async function write__database(name: string, data: string) {
  await Promise.all([
    writeFile(path.join(database, `${name}.ts`), data),
    writeFile(path.join(database, 'index.ts'), `
  // 脚本生成
import * as database from './${name}';
export default database;
`)
  ]);
}

async function build_node_database() {
  const node18 = 'https://nodejs.cn/api/index.html';
  const result = [];
  const body = await fetch(node18).then(res => res.text());
  const dom = cheerio.load(body);
  const content = dom('div#apicontent').children().last();
  const $ = cheerio.load(content.html());
  $('a').each((i, el) => {
    result.push([$(el).text(), $(el).attr('href')]);
  });
  const code = `const database = ${JSON.stringify(result)};
export const host = 'https://nodejs.cn/api/';
export default database;
`;
  await write__database('node', code);
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
      console.log(`unknown mode: ${mode}`);
      process.exit(-1);
      return ;
  }
  return {
    define: {
      '__mode__': JSON.stringify(mode),
      '__app_name__': JSON.stringify(app_name)
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
          dir: current_output
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
