import { rm } from 'node:fs/promises';

for (const path of ['dist', 'dist-server', 'server.js']) {
  await rm(path, { recursive: true, force: true });
}
