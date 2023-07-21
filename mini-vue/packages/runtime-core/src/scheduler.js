const queue = [];
let isFlushing = false;
let isFlushPending = false;
let flushIndex = 0;

let currentFlushPromise = null;
const resolvedPromise = Promise.resolve();

export function nextTick(fn) {
  const p = currentFlushPromise;
  return fn ? p.then(fn) : p;
}
export function findInsertionIndex(id) {
  let start = flushIndex + 1;
  let end = queue.length;
  while (start < end) {
    const middle = (start + end) >>> 1;
    const middleJobId = queue[middle].id;
    middleJobId < id ? (start = middle + 1) : (end = middle);
  }
  return start;
}
export function queueJob(job) {
  if (!queue.length || !queue.includes(job, 0)) {
    if (job.id === null) {
      queue.push(job);
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job); // 确保每一个任务的id按照id升序
    }
    queueflush();
  }
}
export function queueflush() {
  if (!isFlushing && !isFlushPending) {
    isFlushing = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
export function flushJobs() {
  isFlushPending = false;
  isFlushing = true;
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job && job.active !== false) {
        job();
      }
    }
  } finally {
    flushIndex = 0;
    queue.length = 0;
    isFlushing = false;
    currentFlushPromise = null;
  }
}
