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
import { version } from './package.json';

const writeFile = promisify(fs.writeFile);
const root = path.dirname(fileURLToPath(import.meta.url));
const extension = path.join(root, 'src');
const popup = path.join(extension, 'popup.html');
const options = path.join(extension, 'options.html');
const service_worker = path.join(extension, 'service_worker.ts');
const inputs = [popup, options, service_worker];
const base = path.join(root, 'extension');
const database = path.join(root, 'src/database');

async function write_database(name: string, data: string) {
  await Promise.all([
    writeFile(path.join(database, `${name}.ts`), data),
    writeFile(path.join(database, 'index.ts'), `
  // 脚本生成
import * as database from './${name}';
export default database;
`)
  ]);
}

function build_manifest(name: string) {
  const appName = name.split('').map((c, i) => i === 0 ? c.toUpperCase() : c).join('');

  function build_manifest(name: string) {
    return `{
  "name": "${appName} Search Extension",
  "description": "The quick search extension for Developer!",
  "version": "${version}",
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

async function build_node_database() {
  const node18 = 'https://nodejs.cn/api/index.html';
  const result = [];
  const body = await fetch(node18).then(res => res.text());
  const dom = cheerio.load(body);
  const content = dom('div#apicontent').children().last();
  const $ = cheerio.load(content.html());
  $('a').each((i, el) => {
    result.push([$(el).attr('href'), $(el).text()]);
  });
  const code = `export const db = ${JSON.stringify(result)};
export const host = 'https://nodejs.cn/api/';
`;
  await write_database('node', code);
}

async function build_css_database() {
  const host = 'https://www.w3school.com.cn';
  const index = 'https://www.w3school.com.cn/cssref/index.asp';
  const result = [
    ['/cssref/css_selectors.asp', 'css selectors', 'CSS 选择器'],
    ['/cssref/css_functions.asp', 'function', 'CSS 函数']
  ];
  const body = await fetch(index).then(res => res.text());
  let $ = cheerio.load(body);
  $('div#maincontent tr').each((i, el) => {
    let title, href, desc;
    $(el).children().each((i, el) => {
      if (i === 1) {
        desc = $(el).text();
      } else {
        const a = $(el.firstChild);
        title = `${a.text()}`;
        href = a.attr('href');
      }
    });
    if (href && title) {
      result.push([href, title, desc]);
    }
  });
  const code = `export const db = ${JSON.stringify(result)};
export const host = '${host}';
`;
  await write_database('css', code);
}

async function build_database(name: string) {
  await writeFile(path.join(database, 'index.ts'), `
// 脚本生成
import * as database from './${name}';
export default database;
`);
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const current_output = path.join(base, mode);
  const app_name = build_manifest(mode);
  switch (mode) {
    case 'node':
      await build_node_database();
      break;
    case 'css':
      await build_css_database();
      break;
    case 'html':
      await build_database('html');
      break;
    case 'js':
      await build_database('js');
      break;
    case 'ts':
      await build_database('ts');
      break;
    default:
      console.log(`unknown mode: ${mode}`);
      process.exit(-1);
      return;
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
