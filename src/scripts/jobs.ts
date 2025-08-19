// import { isMainThread, workerData } from 'worker_threads';

import { fileURLToPath } from 'url';

import { Job, Jobs } from '../lib/jobs.js';

const __filename = fileURLToPath(import.meta.url);

main().catch(console.error);

async function main() {
  // const { postId } = workerData;
  const postId = process.argv[2];
  const isMainThread = !postId;

  console.log('Running ', process.argv);
  if (isMainThread) {
    const jobs = new Jobs({ maxWorkers: 10, cmdFile: __filename });
    await jobs.run();
  } else {
    console.log('Running job', postId);
    const job = await Job.fromId(postId);
    await job.run();
  }
}
