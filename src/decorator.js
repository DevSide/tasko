import 'setimmediate';

export const immediate = task => (success, fail, message) => {
  const { name, run, cancel } = task(success, fail, message);
  let id;

  return {
    name: `@immediate(${name})`,
    run: () => {
      id = setImmediate(run, 0);
    },
    cancel: () => {
      cancel();
      clearImmediate(id);
    },
  };
};

export const alwaysSuccess = createTask => (success, _, message) => {
  const { name, run, cancel } = createTask(success, success, message);

  return {
    name: `@alwaysSuccess(${name})`,
    run,
    cancel,
  };
};

export const alwaysFail = createTask => (_, fail, message) => {
  const { name, run, cancel } = createTask(fail, fail, message);

  return {
    name: `@alwaysFail(${name})`,
    run,
    cancel,
  };
};

export const invert = createTask => (success, fail, message) => {
  const { name, run, cancel } = createTask(fail, success, message);

  return {
    name: `@invert(${name})`,
    run,
    cancel,
  };
};
