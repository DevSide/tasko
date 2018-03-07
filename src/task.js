import { noop } from './util'

export const createSucceedfulTask = (succeed, _, send) => ({
  name: 'succeed',
  run(...params) {
    send(`will succeed with params: ${JSON.stringify(params)}`)
    succeed('succeed')
  },
  cancel: noop,
})

export const createFailureTask = (_, fail, send) => ({
  name: 'fail',
  run(...params) {
    send(`will fail with params: ${JSON.stringify(params)}`)
    fail('fail')
  },
  cancel: noop,
})
