import { promisify } from './utils'

function runTask(task) {
  return promisify(task.run()).then(() => cleanTask(task), () => cleanTask(task).then(() => Promise.reject()))
}

function cleanTask(task) {
  if (!task.cleaned && task.clean) {
    return promisify(task.clean()).then(
      () => {
        task.cleaned = true
      },
      error => {
        task.cleaned = true
        console.error('Clean task failed', error)
        return Promise.reject(error)
      },
    )
  }

  return Promise.resolve()
}

const successTask = {
  run() {
    return Promise.resolve()
  },
}

function cleanRemainingTasks(tasks) {
  return Promise.all(tasks.filter(task => !task.cleaned).map(cleanTask))
}

function createParallelComposite(mode) {
  return function composite(...createTasks) {
    return function compositeTaskCreator(...params) {
      let tasks = createTasks.map(createTask => createTask(...params))
      let failedOnce = false

      if (!tasks.length) {
        return successTask
      }

      return {
        run() {
          return new Promise((resolve, reject) => {
            const allPromises = tasks.map((task, i) => {
              function onTaskSucceed() {
                tasks = tasks.filter(t => t !== task)

                if (mode === SELECTOR || mode === RACE) {
                  return cleanRemainingTasks(tasks).then(resolve, reject)
                }

                if (!tasks.length) {
                  return cleanRemainingTasks(tasks).then(failedOnce ? reject : resolve, reject)
                }

                return Promise.resolve()
              }

              function onTaskFailed() {
                tasks = tasks.filter(t => t !== task)

                if (mode === SEQUENCE || mode === RACE || !tasks.length) {
                  return cleanRemainingTasks(tasks).then(reject, reject)
                }

                failedOnce = true

                return Promise.resolve()
              }

              return runTask(task).then(onTaskSucceed, onTaskFailed)
            })

            Promise.all(allPromises)
          })
        },
        clean() {
          return cleanRemainingTasks(tasks)
        },
      }
    }
  }
}

function createSerieComposite(mode) {
  return function composite(...createTasks) {
    return function compositeTaskCreator(...params) {
      let tasks = createTasks.map(createTask => createTask(...params))
      let failedOnce = false

      if (!tasks.length) {
        return successTask
      }

      return {
        run() {
          return new Promise((resolve, reject) => {
            function runNext() {
              return runTask(tasks.shift()).then(onTaskSucceed, onTaskFailed)
            }

            function onTaskSucceed() {
              if (mode === SELECTOR) {
                return cleanRemainingTasks(tasks).then(resolve, reject)
              }

              if (!tasks.length) {
                return cleanRemainingTasks(tasks).then(failedOnce ? reject : resolve, reject)
              }

              return runNext()
            }

            function onTaskFailed() {
              if (mode === SEQUENCE || !tasks.length) {
                return cleanRemainingTasks(tasks).then(reject, reject)
              }

              failedOnce = true

              return runNext()
            }

            runNext()
          })
        },
        clean() {
          return cleanRemainingTasks(tasks)
        },
      }
    }
  }
}

const SEQUENCE = 'sequence'
const SELECTOR = 'selector'
const ALL = 'all'
const RACE = 3

export const serieSequence = createSerieComposite(SEQUENCE)
export const serieSelector = createSerieComposite(SELECTOR)
export const serieAll = createSerieComposite(ALL)

export const parallelSequence = createParallelComposite(SEQUENCE)
export const parallelSelector = createParallelComposite(SELECTOR)
export const parallelAll = createParallelComposite(ALL)
export const parallelRace = createParallelComposite(RACE)
