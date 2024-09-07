class Queue {
  private queue: Set<string> = new Set();

  async enqueue(username: string) {
    this.queue.add(username);
  }

  async dequeue(username: string) {
    this.queue.delete(username);
  }

  async isInQueue(username: string) {
    return this.queue.has(username);
  }

  async debug() {
    return Array.from(this.queue);
  }
}

export default Queue;
