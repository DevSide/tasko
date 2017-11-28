import 'setimmediate'
import { noop } from './util'

export const decorateName = (decoratorName, taskName) =>
  `@${decoratorName}(${taskName})`

export const alwaysSuccess = createTask => (success, _, message) => {
  const task = createTask(success, success, message);

  return {
    ...task,
    name: decorateName('alwaysSuccess', task.name),
  };
}

export const alwaysFail = createTask => (_, fail, message) => {
  const task = createTask(fail, fail, message);

  return {
    ...task,
    name: decorateName('alwaysFail', task.name),
  };
}

export const invert = createTask => (success, fail, message) => {
  const task = createTask(fail, success, message);

  return {
    ...task,
    name: decorateName('invert', task.name),
  };
}

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
