import { SearchWithCache } from './search_with_cache';
import database, { host } from './database';

async function start() {
  console.log(host);
  const search = new SearchWithCache(database);
  chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    console.log('inputChanged: ' + text);
    const result = search.search(text);
    console.log('result: ', result);
    suggest([
      { content: 'foo', description: 'you are foo' }
    ]);
  });
}

start().then(() => {
  console.log('start: ', this);
  console.log('Quick Search Extension Worker Started');
});