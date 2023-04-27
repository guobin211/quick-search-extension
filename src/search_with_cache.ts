export class SearchWithCache {
  database: string[][];

  constructor(database: string[][]) {
    this.database = database;
  }

  search(key: string): string[] {
    console.log('search', key);
    return [];
  }
}