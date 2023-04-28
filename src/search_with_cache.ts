import { Compat } from './core/compat';

type Data = [string, string, string | undefined];

type Suggest = chrome.omnibox.SuggestResult;

// 快速搜索
export function quick_search(key: string, list: Data[]): Suggest[] {
  const res = [];
  for (let i = 0; i < list.length; i++) {
    const [href, title, desc] = list[i];
    const name = title.toLowerCase().replace(/[-_]/gi, '');
    if (name.includes(key)) {
      res.push({
        content: href,
        description: `${title} ${desc || ''}`
      });
    }
  }
  return res;
}

export class SearchWithCache {
  host: string;
  db: Data[];
  cache: Map<string, Suggest[]>;
  c: Compat;
  q: string;
  find_list: Suggest[];

  constructor(mod: any, c: Compat) {
    this.host = mod.default.host;
    this.db = mod.default.db;
    this.cache = new Map();
    this.c = c;
    this.q = '';
    this.find_list = [];
  }

  get_default_suggest(): chrome.omnibox.Suggestion {
    if (this.q) {
      return {
        description: `Search keywords ${this.c.match(this.q)} on Google`
      };
    }
    return {
      description: 'Input some keywords and search!'
    };
  }

  set_default_suggest(): void {
    if (this.find_list.length !== 0) {
      const description = this.find_list[0].description;
      chrome.omnibox.setDefaultSuggestion({
        description
      });
      return;
    }
    const description = this.get_default_suggest().description;
    chrome.omnibox.setDefaultSuggestion({
      description
    });
  }

  get_append_suggest(query: string, is_empty = false): Suggest[] {
    const google = {
      content: `https://www.google.com/search?q=${query}`,
      description: `Search keywords ${this.c.match(query)} on Google`
    };
    const baidu = {
      content: `https://www.baidu.com/s?wd=${query}`,
      description: `Search keywords ${this.c.match(query)} on Baidu`
    };
    const bin = {
      content: `https://www.bing.com/search?q=${query}`,
      description: `Search keywords ${this.c.match(query)} on Bing`
    };
    if (is_empty) {
      return [baidu, bin];
    }
    return [google, baidu, bin];
  }

  format_suggest(s: Suggest[]): Suggest[] {
    const res = [];
    for (let i = 1; i < this.c.omniboxPageSize(); i++) {
      if (i >= s.length) {
        break;
      }
      res.push(s[i]);
    }
    return [...res, ...this.get_append_suggest(this.q, false)];
  }

  search(query: string): Suggest[] {
    let res = [];
    this.q = query;
    if (!query) {
      this.set_default_suggest();
      return res;
    }
    // 缓存
    const cache = this.cache.get(query);
    if (cache?.length > 0) {
      this.find_list = cache;
      this.set_default_suggest();
      return this.format_suggest(cache);
    }
    // 查找
    res = quick_search(query, this.db);
    if (res.length > 0) {
      this.find_list = res;
      this.set_default_suggest();
      this.cache.set(query, res);
      return this.format_suggest(res);
    }
    // 未找到
    this.find_list = [];
    this.set_default_suggest();
    return this.get_append_suggest(query, true);
  }

  format_text(text: string): string {
    if (text.startsWith('https://') || text.startsWith('http://')) {
      return text;
    }
    text.replace(/\?\d+$/ig, '');
    return `${this.host}${text}`;
  }

  open_tab(text, disposition) {
    let url = 'https://www.google.com';
    if (text) {
      // 默认建议
      if (text === this.q) {
        text = this.find_list[0].content;
      }
      // 修正链接
      url = this.format_text(text);
    }
    if (disposition === 'currentTab') {
      chrome.tabs.query({ active: true }, (tab: chrome.tabs.Tab[]) => {
        chrome.tabs.update(tab[0].id, { url });
      });
    } else {
      chrome.tabs.create({ url });
    }
  }
}