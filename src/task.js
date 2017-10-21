import { noop } from './util';

export const createSuccessTask = (success, _, message) => ({
  name: 'success',
  run() {
    message('will success');
    success('success');
  },
  cancel: noop,
});

export const createFailTask = (_, fail, message) => ({
  name: 'fail',
  run() {
    message('will fail');
    fail('fail');
  },
  cancel: noop,
});
