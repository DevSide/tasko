import { noop } from './util'

const cancelTask = task => {
  task.cancel()
}

const composite = (branch, mode) => (...createTasks) => {
  const nbTasks = createTasks.length

  if (!nbTasks) {
    return succeed => ({ run: succeed })
  }

  const name = `${BRANCH_NAME[branch]}-${MODE_NAME[mode]}`
  let tasks
  let remains = nbTasks
  let failedOnce
  let runNext
  let runAll

  return (succeed, fail, send) => {
    const succeedChild = i => content => {
      if (content) {
        send(content, getTaskName(i))
      }

      if (--remains === 0) {
        cancelTasks()
        if (failedOnce) {
          fail()
        } else {
          succeed()
        }
      } else if (mode === SELECTOR) {
        cancelTasks()
        succeed()
      } else {
        runNext(i)
      }
    }

    const failChild = i => content => {
      if (content) {
        send(content, getTaskName(i))
      }

      if (--remains === 0 || mode === SEQUENCE) {
        cancelTasks()
        fail()
      } else {
        failedOnce = true
        runNext(i)
      }
    }

    const sendChild = i => content => {
      send(content, getTaskName(i))
    }

    if (branch === SERIE) {
      runNext = (i, ...params) => tasks[i + 1].run(...params)
      runAll = (...params) => runNext(-1, ...params)
    } else {
      runNext = noop
      runAll = (...params) => tasks.forEach(task => task.run(...params))
    }

    tasks = createTasks.map((createTask, i) => createTask(succeedChild(i), failChild(i), sendChild(i)))

    function getTaskName(i) {
      return `${tasks[i].name}(${i})`
    }

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
