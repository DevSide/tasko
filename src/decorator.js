import 'setimmediate'

export const decorateName = (decoratorName, taskName) => `@${decoratorName}(${taskName})`

const simple = (name, mapCallback) => createTask => (succeed, fail, send) => {
  const task = createTask(...mapCallback(succeed, fail), send)

  return {
    ...task,
    name: decorateName(name, task.name),
  }
}

export const alwaysSucceed = simple('alwaysSucceed', (succeed, _) => [succeed, succeed])

export const alwaysFail = simple('alwaysFail', (_, fail) => [fail, fail])

export const invert = simple('invert', (succeed, fail) => [fail, succeed])

export const immediate = createTask => (succeed, fail, send) => {
  const { name, run, cancel } = createTask(succeed, fail, send)
  let id

  return {
    name: decorateName('immediate', name),
    run(...params) {
      id = setImmediate(() => run(...params), 0)
    },
    cancel() {
      cancel()
      clearImmediate(id)
    },
  }
}
