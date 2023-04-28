import { SearchWithCache } from './search_with_cache';
import * as database from './database';
import { Compat } from './core/compat';

const c = new Compat();
const searcher = new SearchWithCache(database, c);

async function start() {
  chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    const res = searcher.search(text);
    suggest(res);
  });

  chrome.omnibox.onInputEntered.addListener((content, disposition) => {
    searcher.open_tab(content, disposition);
  });
}

start().then(() => {
  console.log('Quick Search Started');
});