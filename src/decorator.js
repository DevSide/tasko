const simple = createRun => createTask => (...params) => {
  const task = createTask(...params)

  return {
    ...task,
    run: createRun(task),
  }
}

export const alwaysSuccess = simple(task => () => task.run().catch(() => Promise.resolve()))

export const alwaysFail = simple(task => () => task.run().then(() => Promise.reject()))

export const invert = simple(task => () => task.run().then(() => Promise.reject(), () => Promise.resolve()))
