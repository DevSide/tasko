describe('composite.spec', () => {
  jest.useFakeTimers()

  const cases = require('jest-in-case')

  const {
    serieSelector,
    serieSequence,
    serieAll,
    parallelSequence,
    parallelSelector,
    parallelAll,
    parallelRace,
  } = require('../composite')

  const param = {}
  let counterTasks = 0
  let runDone = []
  let cleanDone = []
  let task = null

  const PROMISE_PENDING = 0
  const PROMISE_RESOLVED = 1
  const PROMISE_REJECTED = 2

  const createInstantSuccessTask = p => {
    const name = 'S' + ++counterTasks
    expect(p).toBe(param)

    return {
      run() {
        runDone.push(name)
        return Promise.resolve()
      },
      clean() {
        cleanDone.push(name)
      },
    }
  }

  const createInstantFailTask = p => {
    const name = 'F' + ++counterTasks
    expect(p).toBe(param)

    return {
      run() {
        runDone.push(name)
        return Promise.reject()
      },
      clean() {
        cleanDone.push(name)
      },
    }
  }

  const createDeferredSuccessTask = defer => p => {
    const name = 'S' + ++counterTasks
    expect(p).toBe(param)

    return {
      async run() {
        await defer.promise
        runDone.push(name)
      },
      clean() {
        cleanDone.push(name)
      },
    }
  }

  const createDeferredFailTask = defer => p => {
    const name = 'F' + ++counterTasks
    expect(p).toBe(param)

    return {
      async run() {
        try {
          await defer.promise
        } catch (_) {
          runDone.push(name)
          return Promise.reject()
        }
      },
      clean() {
        cleanDone.push(name)
      },
    }
  }

  function Defer() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  function getPromiseStatus(promise) {
    return process.binding('util').getPromiseDetails(promise)[0]
  }

  const withCancelFailure = createTask => p => {
    const task = createTask(p)

    return {
      ...task,
      async clean() {
        await task.clean()
        throw new Error('Cancel failed')
      },
    }
  }

  const withNoCancel = createTask => p => {
    const task = createTask(p)

    return {
      run() {
        return task.run()
      },
    }
  }

  beforeEach(() => {
    counterTasks = 0
    task = null
    runDone = []
    cleanDone = []
  })

  describe('no task', () => {
    cases(
      'should succeed if no task provided',
      ({ composite }) => {
        expect.assertions(1)
        const task = composite()(param)

        return expect(task.run()).resolves.toEqual()
      },
      [
        { name: 'serie sequence', composite: serieSequence },
        { name: 'serie selector', composite: serieSelector },
        { name: 'serie all', composite: serieAll },
        { name: 'parallel sequence', composite: parallelSequence },
        { name: 'parallel selector', composite: parallelSelector },
        { name: 'parallel all', composite: parallelAll },
      ],
    )
  })

  cases(
    'serie',
    async ({ composite, createTasks, status, done, clean }) => {
      expect.assertions(createTasks.length + 2)

      task = composite(...createTasks)(param)

      if (status === 'S') {
        await task.run()

        expect(runDone).toEqual(done)
        expect(cleanDone).toEqual(clean)
      } else {
        try {
          await task.run()
        } catch (_) {
          expect(runDone).toEqual(done)
          expect(cleanDone).toEqual(clean)
        }
      }
    },
    [
      // ################################
      // Sequence
      {
        name: 'sequence should succeed when all task succeeded',
        composite: serieSequence,
        createTasks: [createInstantSuccessTask],
        status: 'S',
        done: ['S1'],
        clean: ['S1'],
      },
      {
        name: 'sequence should succeed when all task succeeded',
        composite: serieSequence,
        createTasks: [withNoCancel(createInstantSuccessTask)],
        status: 'S',
        done: ['S1'],
        clean: [],
      },
      {
        name: 'sequence should succeed when all task succeeded',
        composite: serieSequence,
        createTasks: [createInstantSuccessTask, createInstantSuccessTask],
        status: 'S',
        done: ['S1', 'S2'],
        clean: ['S1', 'S2'],
      },
      {
        name: 'sequence should fail as soon as one failed',
        composite: serieSequence,
        createTasks: [withNoCancel(createInstantFailTask)],
        status: 'F',
        done: ['F1'],
        clean: [],
      },
      {
        name: 'sequence should fail as soon as one failed',
        composite: serieSequence,
        createTasks: [createInstantFailTask, createInstantFailTask],
        status: 'F',
        done: ['F1'],
        clean: ['F1', 'F2'],
      },
      {
        name: 'sequence should fail as soon as one failed',
        composite: serieSequence,
        createTasks: [createInstantSuccessTask, createInstantFailTask],
        status: 'F',
        done: ['S1', 'F2'],
        clean: ['S1', 'F2'],
      },
      {
        name: 'sequence should fail as soon as one failed',
        composite: serieSequence,
        createTasks: [createInstantSuccessTask, createInstantSuccessTask, createInstantFailTask],
        status: 'F',
        done: ['S1', 'S2', 'F3'],
        clean: ['S1', 'S2', 'F3'],
      },
      {
        name: 'sequence should fail as soon as one failed',
        composite: serieSequence,
        createTasks: [createInstantSuccessTask, createInstantFailTask, createInstantFailTask],
        status: 'F',
        done: ['S1', 'F2'],
        clean: ['S1', 'F2', 'F3'],
      },
      {
        name: 'sequence should fail as soon as one failed',
        composite: serieSequence,
        createTasks: [withCancelFailure(createInstantSuccessTask)],
        status: 'F',
        done: ['S1'],
        clean: ['S1'],
      },
      {
        name: 'sequence should fail as soon as one failed',
        composite: serieSequence,
        createTasks: [createInstantSuccessTask, withCancelFailure(createInstantSuccessTask)],
        status: 'F',
        done: ['S1', 'S2'],
        clean: ['S1', 'S2'],
      },

      // ################################
      // Selector
      {
        name: 'selector should fail when all task failed',
        composite: serieSelector,
        createTasks: [createInstantFailTask],
        status: 'F',
        done: ['F1'],
        clean: ['F1'],
      },
      {
        name: 'selector should fail when all task failed',
        composite: serieSelector,
        createTasks: [createInstantFailTask, createInstantFailTask],
        status: 'F',
        done: ['F1', 'F2'],
        clean: ['F1', 'F2'],
      },
      {
        name: 'selector should fail when all task failed',
        composite: serieSelector,
        createTasks: [createInstantFailTask, withCancelFailure(createInstantSuccessTask)],
        status: 'F',
        done: ['F1', 'S2'],
        clean: ['F1', 'S2'],
      },
      {
        name: 'selector should succeed as soon as one succeeded',
        composite: serieSelector,
        createTasks: [createInstantSuccessTask],
        status: 'S',
        done: ['S1'],
        clean: ['S1'],
      },
      {
        name: 'selector should succeed as soon as one succeeded',
        composite: serieSelector,
        createTasks: [createInstantSuccessTask, createInstantSuccessTask],
        status: 'S',
        done: ['S1'],
        clean: ['S1', 'S2'],
      },
      {
        name: 'selector should succeed as soon as one succeeded',
        composite: serieSelector,
        createTasks: [createInstantFailTask, createInstantSuccessTask],
        status: 'S',
        done: ['F1', 'S2'],
        clean: ['F1', 'S2'],
      },

      // ################################
      // All
      {
        name: 'all should succeed when all task succeeded',
        composite: serieAll,
        createTasks: [createInstantSuccessTask],
        status: 'S',
        done: ['S1'],
        clean: ['S1'],
      },
      {
        name: 'all should succeed when all task succeeded',
        composite: serieAll,
        createTasks: [createInstantSuccessTask, createInstantSuccessTask],
        status: 'S',
        done: ['S1', 'S2'],
        clean: ['S1', 'S2'],
      },
      {
        name: 'all should fail if at least one failed',
        composite: serieAll,
        createTasks: [createInstantFailTask],
        status: 'F',
        done: ['F1'],
        clean: ['F1'],
      },
      {
        name: 'all should fail if at least one failed',
        composite: serieAll,
        createTasks: [withCancelFailure(createInstantSuccessTask)],
        status: 'F',
        done: ['S1'],
        clean: ['S1'],
      },
      {
        name: 'all should fail if at least one failed',
        composite: serieAll,
        createTasks: [createInstantFailTask, createInstantFailTask],
        status: 'F',
        done: ['F1', 'F2'],
        clean: ['F1', 'F2'],
      },
      {
        name: 'all should fail if at least one failed',
        composite: serieAll,
        createTasks: [createInstantSuccessTask, createInstantFailTask],
        status: 'F',
        done: ['S1', 'F2'],
        clean: ['S1', 'F2'],
      },
      {
        name: 'all should fail if at least one failed',
        composite: serieAll,
        createTasks: [createInstantSuccessTask, createInstantFailTask, createInstantSuccessTask],
        status: 'F',
        done: ['S1', 'F2', 'S3'],
        clean: ['S1', 'F2', 'S3'],
      },
    ],
  )

  describe('parallel', () => {
    describe('sequence', () => {
      it('should succeed when all task succeeded', async () => {
        expect.assertions(4)

        const task = parallelSequence(createInstantSuccessTask, createInstantSuccessTask)(param)

        await task.run()

        expect(runDone).toEqual(['S1', 'S2'])
        expect(cleanDone).toEqual(['S1', 'S2'])
      })

      it('should fail as soon as one failed', async () => {
        expect.assertions(5)

        const failDefer = new Defer()
        const successDefer = new Defer()

        const task = parallelSequence(
          createInstantSuccessTask,
          createDeferredFailTask(failDefer),
          createDeferredSuccessTask(successDefer),
        )(param)

        failDefer.reject()

        try {
          await task.run()
        } catch (_) {
          expect(runDone).toEqual(['S1', 'F2'])
          expect(cleanDone).toEqual(['S1', 'F2', 'S3'])
        }
      })
    })

    describe('selector', () => {
      it('should fail when all task failed', async () => {
        expect.assertions(4)

        const task = parallelSelector(createInstantFailTask, createInstantFailTask)(param)

        try {
          await task.run()
        } catch (_) {
          expect(runDone).toEqual(['F1', 'F2'])
          expect(cleanDone).toEqual(['F1', 'F2'])
        }
      })

      it('should succeed as soon as one succeeded', async () => {
        expect.assertions(5)

        const successDefer = new Defer()
        const failDefer = new Defer()

        const task = parallelSelector(
          createInstantFailTask,
          createDeferredSuccessTask(successDefer),
          createDeferredFailTask(failDefer),
        )(param)

        const promise = task.run()

        successDefer.resolve()

        await promise

        expect(runDone).toEqual(['F1', 'S2'])
        expect(cleanDone).toEqual(['F1', 'S2', 'F3'])
      })
    })

    describe('all', () => {
      it('should succeed when all task succeeded', async () => {
        expect.assertions(5)

        const successDefer = new Defer()

        const task = parallelAll(createDeferredSuccessTask(successDefer), createInstantSuccessTask)(param)

        const promise = task.run()
        expect(getPromiseStatus(promise)).toEqual(PROMISE_PENDING)
        successDefer.resolve()

        await promise

        expect(runDone).toEqual(['S2', 'S1'])
        expect(cleanDone).toEqual(['S2', 'S1'])
      })

      it('should fail if at least one failed', async () => {
        expect.assertions(6)

        const successDefer = new Defer()
        const failDefer = new Defer()

        const task = parallelAll(
          createInstantSuccessTask,
          createDeferredFailTask(failDefer),
          createDeferredSuccessTask(successDefer),
        )(param)

        const promise = task.run()

        failDefer.reject()
        expect(getPromiseStatus(promise)).toEqual(PROMISE_PENDING)
        successDefer.resolve()

        try {
          await promise
        } catch (_) {
          expect(runDone).toEqual(['S1', 'F2', 'S3'])
          expect(cleanDone).toEqual(['S1', 'S3', 'F2'])
        }
      })
    })

    describe('race', () => {
      it('should succeed as soon as the first done succeed', async () => {
        expect.assertions(4)

        const successDefer = new Defer()
        const failDefer = new Defer()

        const task = parallelRace(createDeferredFailTask(failDefer), createDeferredSuccessTask(successDefer))(param)

        const promise = task.run()

        successDefer.resolve()

        await promise

        expect(runDone).toEqual(['S2'])
        expect(cleanDone).toEqual(['S2', 'F1'])
      })

      it('should fail as soon as the first done failed', async () => {
        expect.assertions(4)

        const failDefer = new Defer()
        const successDefer = new Defer()

        const task = parallelRace(createDeferredSuccessTask(successDefer), createDeferredFailTask(failDefer))(param)

        failDefer.reject()

        try {
          await task.run()
        } catch (_) {
          expect(runDone).toEqual(['F2'])
          expect(cleanDone).toEqual(['F2', 'S1'])
        }
      })
    })
  })
})
