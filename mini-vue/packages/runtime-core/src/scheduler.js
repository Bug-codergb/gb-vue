import { isArray } from '../../shared/src/general.js';

const queue = [];
let isFlushing = false;
let isFlushPending = false;
let flushIndex = 0;

const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;

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
export function flushJobs(seen) {
  isFlushPending = false;
  isFlushing = true;

  seen = seen || new Map();
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

    flushPostFlushCbs(seen);

    isFlushing = false;
    currentFlushPromise = null;
  }
}
// 后置队列
export function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    if (!activePostFlushCbs || !activePostFlushCbs.includes(cb, cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex)) {
      pendingPostFlushCbs.push(cb);
    }
  } else {
    pendingPostFlushCbs.push(...cb);
  }
  queueflush();
}
export function flushPostFlushCbs(seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)];
    pendingPostFlushCbs.length = 0;

    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped);
      return;
    }
    activePostFlushCbs = deduped;

    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      activePostFlushCbs[postFlushIndex]();
    }
  }
  activePostFlushCbs = null;
  postFlushIndex = 0;
}
const getId = (job) => (job.id === null ? Infinity : job.id);
