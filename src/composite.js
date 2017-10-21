import { noop } from './util';

const runTask = task => task.run();

const cancelTask = task => {
  if (task) {
    task.cancel();
  }
};

const composite = (branch, mode) => (...createTasks) => {
  const nbTasks = createTasks.length;

  if (!nbTasks) {
    return success => ({ run: success });
  }

  const name = `${BRANCH_NAME[branch]}(${MODE_NAME[mode]})`;
  let tasks;
  let remains = nbTasks;
  let cancelTasks;
  let failedOnce;
  let runNext;
  let runAll;

  return (success, fail, message) => {
    const successChild = i => content => {
      tasks[i] = null;
      remains--;

      if (remains === 0) {
        if (failedOnce) {
          fail(content);
        } else {
          success(content);
        }
      } else if (mode === SELECTOR) {
        cancelTasks();
        success(content);
      } else {
        runNext(i);
      }
    };

    const failChild = i => content => {
      failedOnce = true;
      tasks[i] = null;
      remains--;

      if (mode === SEQUENCE || remains === 0) {
        cancelTasks();
        fail(content);
      } else {
        runNext(i);
      }
    };

    const messageChild = i => content => {
      const task = tasks[i];

      if (tasks[i]) {
        message(content, task.name);
      }
    };

    if (branch === SERIE) {
      runNext = i => tasks[i + 1].run();
      runAll = () => runNext(-1);
    } else {
      runNext = noop;
      runAll = () => tasks.forEach(runTask);
    }

    tasks = createTasks.map((createTask, i) =>
      createTask(successChild(i), failChild(i), messageChild(i)),
    );

    cancelTasks = () => {
      tasks.forEach(cancelTask);
      tasks = null;
    };

    return {
      name,
      run: runAll,
      cancel: cancelTasks,
    };
  };
};

const SERIE = 0;
const PARALLEL = 1;

const BRANCH_NAME = {
  [SERIE]: 'serie',
  [PARALLEL]: 'parallel',
};

const SEQUENCE = 0;
const SELECTOR = 1;
const ALL = 2;

const MODE_NAME = {
  [SEQUENCE]: 'sequence',
  [SELECTOR]: 'selector',
  [ALL]: 'all',
};

export const serieSequence = composite(SERIE, SEQUENCE);
export const serieSelector = composite(SERIE, SELECTOR);
export const serieAll = composite(SERIE, ALL);

export const parallelSequence = composite(PARALLEL, SEQUENCE);
export const parallelSelector = composite(PARALLEL, SELECTOR);
export const parallelAll = composite(PARALLEL, ALL);
