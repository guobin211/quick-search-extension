import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const node18 = 'https://nodejs.cn/api/index.html';
const file = path.join(__dirname, '../extension/database/index.ts');

async function build_database(name) {
  console.log(`build database: ${name}`);
  const result = [];
  const body = await fetch(node18).then(res => res.text());
  const dom = cheerio.load(body);
  const content = dom('div#apicontent').children().last();
  const $ = cheerio.load(content.html());
  $('a').each((i, el) => {
    result.push([$(el).text(), $(el).attr('href')]);
  });
  const code = ` const ${name} = ${JSON.stringify(result, null, 2)};
  export const host = 'https://nodejs.cn/api/';
  export default ${name};`;
  fs.writeFileSync(file, code);
}

build_database('node').then();
