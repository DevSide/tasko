import { noop } from './util'

const cancelTask = task => {
  if (task) {
    task.cancel()
  }
}

const composite = (branch, mode) => (...createTasks) => {
  const nbTasks = createTasks.length

  if (!nbTasks) {
    return success => ({ run: success })
  }

  const name = `${BRANCH_NAME[branch]}(${MODE_NAME[mode]})`
  let tasks
  let remains = nbTasks
  let failedOnce
  let runNext
  let runAll

  return (success, fail, message) => {
    const successChild = i => content => {
      if (--remains === 0) {
        cancelTasks()
        if (failedOnce) {
          fail(content)
        } else {
          success(content)
        }
      } else if (mode === SELECTOR) {
        cancelTasks()
        success(content)
      } else {
        runNext(i)
      }
    }

    const failChild = i => content => {
      if (--remains === 0 || mode === SEQUENCE) {
        cancelTasks()
        fail(content)
      } else {
        failedOnce = true
        runNext(i)
      }
    }

    const messageChild = i => content => {
      if (tasks) {
        message(content, tasks[i].name)
      }
    }

    if (branch === SERIE) {
      runNext = (i, ...params) => tasks[i + 1].run(...params)
      runAll = (...params) => runNext(-1, ...params)
    } else {
      runNext = noop
      runAll = (...params) => tasks.forEach(task => task.run(...params))
    }

    tasks = createTasks.map((createTask, i) =>
      createTask(successChild(i), failChild(i), messageChild(i)),
    )

    function cancelTasks() {
      tasks.forEach(cancelTask)
      tasks = null
    }

    return {
      name,
      run: runAll,
      cancel: cancelTasks,
    }
  }
}

const SERIE = 0
const PARALLEL = 1

const BRANCH_NAME = {
  [SERIE]: 'serie',
  [PARALLEL]: 'parallel',
}

const SEQUENCE = 0
const SELECTOR = 1
const ALL = 2

const MODE_NAME = {
  [SEQUENCE]: 'sequence',
  [SELECTOR]: 'selector',
  [ALL]: 'all',
}

export const serieSequence = composite(SERIE, SEQUENCE)
export const serieSelector = composite(SERIE, SELECTOR)
export const serieAll = composite(SERIE, ALL)

export const parallelSequence = composite(PARALLEL, SEQUENCE)
export const parallelSelector = composite(PARALLEL, SELECTOR)
export const parallelAll = composite(PARALLEL, ALL)
