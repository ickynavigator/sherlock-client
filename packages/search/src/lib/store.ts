import type { UserResult } from '../types';

// TODO: use redis or some other database to store results
class Store {
  private users: Map<string, UserResult[]> = new Map();

  async addUser(username: string, results: UserResult[]) {
    this.users.set(username, results);
    return results;
  }

  async getUser(username: string) {
    return this.users.get(username);
  }

  async deleteUser(username: string) {
    return this.users.delete(username);
  }

  async isInStore(username: string) {
    return this.users.has(username);
  }
}

export default Store;
