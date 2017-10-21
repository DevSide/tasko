import cases from "jest-in-case";

import {
  serieSelector,
  serieSequence,
  serieAll,
  parallelSequence,
  parallelSelector,
  parallelAll,
} from '../composite';

jest.mock('../task');

jest.useFakeTimers();

describe('composite.spec', () => {
  const success = jest.fn();
  const fail = jest.fn();
  const message = jest.fn();

  let counterSuccessChild;
  let counterFailChild;
  
  let createSuccessTask;
  let createFailTask;

  const getCreateSuccessTask = (async = false) => {
    return (success, _, message) => {
      let tid;

      return {
        name: 'success',
        run: () => {
          const sync = () => {
            message('will success');
            counterSuccessChild++;
            success('success');
          };

          async ? (tid = setTimeout(sync)) : sync();
        },
        cancel: () => {
          clearTimeout(tid);
        },
      };
    };
  };

  const getCreateFailTask = (async = false) => {
    return (_, fail, message) => {
      let tid;

      return {
        name: 'fail',
        run: () => {
          const 
            sync = () => {
            message('will fail');
            counterFailChild++;
            fail('fail');
          };

          async ? (tid = setTimeout(sync)) : sync();
        },
        cancel: () => {
          clearTimeout(tid);
        },
      };
    };
  };

  beforeEach(() => {
    success.mockClear();
    fail.mockClear();
    message.mockClear();

    counterSuccessChild = 0;
    counterFailChild = 0;
  });

  cases("should success if no task provided", ({ composite }) => {
    const task = composite()(success);
    task.run()

    expect(success).toBeCalled();
  }, {
    "serie sequence": { composite: serieSequence },
    "serie selector": { composite: serieSelector },
    "serie all": { composite: serieAll },
    "parallel sequence": { composite: parallelSequence },
    "parallel selector": { composite: parallelSelector },
    "parallel all": { composite: parallelAll },
  });

  describe('serie', () => {
    describe('sequence', () => {;
      it('should success when all task succeed', () => {
        createSuccessTask = getCreateSuccessTask();

        const task = serieSequence(createSuccessTask, createSuccessTask)(
          success,
          fail,
          message,
        );
        expect(task.name).toBe('serie(sequence)');

        task.run();

        expect(success).toBeCalledWith('success');
        expect(fail).not.toBeCalled();

        expect(message).toBeCalledWith('will success', 'success');

        expect(counterSuccessChild).toBe(2);
        expect(counterFailChild).toBe(0);
      });

      it('should fail as soon as one failed', () => {
        createSuccessTask = getCreateSuccessTask();
        createFailTask = getCreateFailTask();

        const task = serieSequence(
          createSuccessTask,
          createFailTask,
          createSuccessTask,
        )(success, fail, message);
        expect(task.name).toBe('serie(sequence)');

        task.run();

        expect(success).not.toBeCalled();
        expect(fail).toBeCalled();

        expect(counterSuccessChild).toBe(1);
        expect(counterFailChild).toBe(1);
      });

      it('should fail as soon as one failed with async', () => {
        createSuccessTask = getCreateSuccessTask(true);
        createFailTask = getCreateFailTask(true);

        const task = serieSequence(
          createSuccessTask,
          createFailTask,
          createSuccessTask,
        )(success, fail, message);
        expect(task.name).toBe('serie(sequence)');

        task.run();

        expect(counterSuccessChild).toBe(0);
        expect(counterFailChild).toBe(0);

        jest.runOnlyPendingTimers();

        expect(fail).not.toBeCalled();
        expect(counterSuccessChild).toBe(1);
        expect(counterFailChild).toBe(0);

        jest.runOnlyPendingTimers();

        expect(success).not.toBeCalled();
        expect(fail).toBeCalled();
        expect(counterSuccessChild).toBe(1);
        expect(counterFailChild).toBe(1);
      });
    });

    describe('selector', () => {
      it('should fail when all task failed', () => {
        createFailTask = getCreateFailTask();

        const task = serieSelector(createFailTask, createFailTask)(
          success,
          fail,
          message,
        );
        expect(task.name).toBe('serie(selector)');

        task.run();

        expect(fail).toBeCalledWith('fail');
        expect(success).not.toBeCalled();

        expect(message).toBeCalledWith('will fail', 'fail');

        expect(counterFailChild).toBe(2);
        expect(counterSuccessChild).toBe(0);
      });

      it('should success as soon as one succeed', () => {
        createSuccessTask = getCreateSuccessTask();
        createFailTask = getCreateFailTask();

        const task = serieSelector(
          createFailTask,
          createSuccessTask,
          createFailTask,
        )(success, fail, message);
        expect(task.name).toBe('serie(selector)');

        task.run();

        expect(fail).not.toBeCalled();
        expect(success).toBeCalled();

        expect(counterFailChild).toBe(1);
        expect(counterSuccessChild).toBe(1);
      });

      it('should fail as soon as one succeed with async', () => {
        createSuccessTask = getCreateSuccessTask(true);
        createFailTask = getCreateFailTask(true);

        const task = serieSelector(
          createFailTask,
          createSuccessTask,
          createFailTask,
        )(success, fail, message);
        expect(task.name).toBe('serie(selector)');

        task.run();

        expect(counterSuccessChild).toBe(0);
        expect(counterFailChild).toBe(0);

        jest.runOnlyPendingTimers();

        expect(success).not.toBeCalled();
        expect(counterSuccessChild).toBe(0);
        expect(counterFailChild).toBe(1);

        jest.runOnlyPendingTimers();

        expect(fail).not.toBeCalled();
        expect(success).toBeCalled();
        expect(counterSuccessChild).toBe(1);
        expect(counterFailChild).toBe(1);
      });
    });

    describe('all', () => {
      it('should success when all task succeed', () => {
        createSuccessTask = getCreateSuccessTask();

        const task = serieAll(createSuccessTask, createSuccessTask)(
          success,
          fail,
          message,
        );
        expect(task.name).toBe('serie(all)');

        task.run();

        expect(success).toBeCalled();
        expect(fail).not.toBeCalled();

        expect(counterSuccessChild).toBe(2);
        expect(counterFailChild).toBe(0);
      });

      it('should fail if at least one failed', () => {
        createSuccessTask = getCreateSuccessTask();
        createFailTask = getCreateFailTask();

        const task = serieAll(
          createSuccessTask,
          createFailTask,
          createSuccessTask,
        )(success, fail, message);
        expect(task.name).toBe('serie(all)');

        task.run();

        expect(success).not.toBeCalled();
        expect(fail).toBeCalled();

        expect(counterSuccessChild).toBe(2);
        expect(counterFailChild).toBe(1);
      });

      it('should fail if at least one failed with async', () => {
        createSuccessTask = getCreateSuccessTask(true);
        createFailTask = getCreateFailTask(true);

        const task = serieAll(
          createSuccessTask,
          createFailTask,
          createSuccessTask,
        )(success, fail, message);
        expect(task.name).toBe('serie(all)');

        task.run();

        expect(counterSuccessChild).toBe(0);
        expect(counterFailChild).toBe(0);

        jest.runOnlyPendingTimers();

        expect(counterSuccessChild).toBe(1);
        expect(counterFailChild).toBe(0);

        jest.runOnlyPendingTimers();

        expect(success).not.toBeCalled();
        expect(fail).not.toBeCalled();
        expect(counterSuccessChild).toBe(1);
        expect(counterFailChild).toBe(1);

        jest.runOnlyPendingTimers();

        expect(success).not.toBeCalled();
        expect(fail).toBeCalled();
        expect(counterSuccessChild).toBe(2);
        expect(counterFailChild).toBe(1);
      });
    });
  });

  describe('parallel', () => {
    describe('sequence', () => {
      it('should success when all task succeed', () => {
        createSuccessTask = getCreateSuccessTask(true);

        const task = parallelSequence(createSuccessTask, createSuccessTask)(
          success,
          fail,
          message,
        );
        expect(task.name).toBe('parallel(sequence)');

        task.run();

        expect(success).not.toBeCalled();

        jest.runOnlyPendingTimers();

        expect(success).toBeCalled();
        expect(fail).not.toBeCalled();
        expect(counterSuccessChild).toBe(2);
        expect(counterFailChild).toBe(0);
      });

      it('should fail as soon as one failed', () => {
        createSuccessTask = getCreateSuccessTask(true);
        createFailTask = getCreateFailTask(true);

        const task = parallelSequence(
          createSuccessTask,
          createFailTask,
          createSuccessTask,
        )(success, fail, message);
        expect(task.name).toBe('parallel(sequence)');

        task.run();

        expect(fail).not.toBeCalled();

        jest.runOnlyPendingTimers();

        expect(success).not.toBeCalled();
        expect(fail).toBeCalled();
        expect(counterSuccessChild).toBe(1);
        expect(counterFailChild).toBe(1);
      });
    });

    describe('selector', () => {
      it('should fail when all task failed', () => {
        createFailTask = getCreateFailTask(true);

        const task = parallelSelector(createFailTask, createFailTask)(
          success,
          fail,
          message,
        );
        expect(task.name).toBe('parallel(selector)');

        task.run();

        expect(fail).not.toBeCalled();

        jest.runOnlyPendingTimers();

        expect(fail).toBeCalled();
        expect(success).not.toBeCalled();
        expect(counterFailChild).toBe(2);
        expect(counterSuccessChild).toBe(0);
      });

      it('should success as soon as one succeed', () => {
        createSuccessTask = getCreateSuccessTask(true);
        createFailTask = getCreateFailTask(true);

        const task = parallelSelector(
          createFailTask,
          createSuccessTask,
          createFailTask,
        )(success, fail, message);
        expect(task.name).toBe('parallel(selector)');

        task.run();

        expect(success).not.toBeCalled();

        jest.runOnlyPendingTimers();

        expect(fail).not.toBeCalled();
        expect(success).toBeCalled();
        expect(counterFailChild).toBe(1);
        expect(counterSuccessChild).toBe(1);
      });
    });

    describe('all', () => {
      it('should success when all task succeed', () => {
        createSuccessTask = getCreateSuccessTask(true);

        const task = parallelAll(createSuccessTask, createSuccessTask)(
          success,
          fail,
          message,
        );
        expect(task.name).toBe('parallel(all)');

        task.run();

        expect(success).not.toBeCalled();

        jest.runOnlyPendingTimers();

        expect(success).toBeCalled();
        expect(fail).not.toBeCalled();

        expect(counterSuccessChild).toBe(2);
        expect(counterFailChild).toBe(0);
      });

      it('should fail if at least one failed', () => {
        createSuccessTask = getCreateSuccessTask(true);
        createFailTask = getCreateFailTask(true);

        const task = parallelAll(
          createSuccessTask,
          createFailTask,
          createSuccessTask,
        )(success, fail, message);
        expect(task.name).toBe('parallel(all)');

        task.run();

        expect(fail).not.toBeCalled();

        jest.runOnlyPendingTimers();

        expect(success).not.toBeCalled();
        expect(fail).toBeCalled();

        expect(counterSuccessChild).toBe(2);
        expect(counterFailChild).toBe(1);
      });
    });
  });
});
