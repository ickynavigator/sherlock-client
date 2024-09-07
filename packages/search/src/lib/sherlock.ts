import { runCommand } from '~/lib/utils';
import type { UserResult } from '~/types';

class Sherlock {
  FLAGS = ['--no-color', '--site Instagram'];

  getFlags() {
    return this.FLAGS;
  }

  async search(username: string) {
    using r = await runCommand(['sherlock', ...this.getFlags(), username]);
    const { output: res } = r;

    const cleanedRes: UserResult[] = res
      .split('\n')
      .map(v => {
        const result = v.match(/\[\+\] (\w+): (https?:\/\/[^\s]+)/);

        if (result == null || result.length < 3) return null;

        const [original, org, url] = result;

        if (original == null || org == null || url == null) return null;

        return { original, org, url };
      })
      .filter(v => v != null);

    return cleanedRes;
  }
}

export default Sherlock;
