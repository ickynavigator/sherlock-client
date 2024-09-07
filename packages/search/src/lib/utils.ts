import Bun from 'bun';

export const runCommand = async (command: string[]) => {
  const process = Bun.spawn(command, { stdout: 'pipe' });

  const output = await new Response(process.stdout).text();

  return {
    [Symbol.dispose]() {
      process.kill();
    },
    output,
  };
};
