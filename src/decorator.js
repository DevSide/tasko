import 'setimmediate'

export const decorateName = (decoratorName, taskName) => `@${decoratorName}(${taskName})`

const simple = (name, mapCallback) => createTask => (success, fail, message) => {
  const task = createTask(...mapCallback(success, fail), message)

  return {
    ...task,
    name: decorateName(name, task.name),
  }
}

export const alwaysSuccess = simple('alwaysSuccess', (success, _) => [success, success])

export const alwaysFail = simple('alwaysFail', (_, fail) => [fail, fail])

export const invert = simple('invert', (success, fail) => [fail, success])

export const immediate = createTask => (success, fail, message) => {
  const { name, run, cancel } = createTask(success, fail, message)
  let id

  return {
    name: decorateName('immediate', name),
    run() {
      id = setImmediate(run, 0)
    },
    cancel() {
      cancel()
      clearImmediate(id)
    },
  }
}
