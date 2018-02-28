import { noop } from './util'

export const createSuccessTask = (success, _, message) => ({
  name: 'success',
  run(...params) {
    message(`will success with params: ${JSON.stringify(params)}`)
    success('success')
  },
  cancel: noop,
})

export const createFailTask = (_, fail, message) => ({
  name: 'fail',
  run(...params) {
    message(`will fail with params: ${JSON.stringify(params)}`)
    fail('fail')
  },
  cancel: noop,
})
