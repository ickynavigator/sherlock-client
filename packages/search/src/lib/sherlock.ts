import { runCommand } from '~/lib/utils';
import type { UserResult } from '~/types';

const SHERLOCK_DOCKER_IMAGE = 'sherlock';

class Sherlock {
  // TODO: maybe don't use docker for the search
  async search(username: string) {
    const res = await runCommand([
      'docker',
      'compose',
      'run',
      '--rm',
      SHERLOCK_DOCKER_IMAGE,
      username,
    ]);

    const cleanedRes: UserResult[] = res
      .split('\n')
      .map(v => {
        const result = v.match(/\[\+\] (\w+): (https?:\/\/[^\s]+)/);

        if (result == null || result.length <= 3) return null;

        const [original, org, url] = result;

        if (original == null || org == null || url == null) return null;

        return { original, org, url };
      })
      .filter(v => v != null);

    return cleanedRes;
  }
}

export default Sherlock;
