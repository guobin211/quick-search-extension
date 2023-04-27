import { SearchWithCache } from './search_with_cache';
import * as database from './database';

async function start() {
  console.log(database);
  const search = new SearchWithCache();
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