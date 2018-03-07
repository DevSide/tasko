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
  } = require('../composite')

  const succeed = jest.fn()
  const fail = jest.fn()
  const send = jest.fn()

  let counterSucceedChild
  let counterFailChild

  let createSuccessfulTask
  let createFailTask

  const getCreateSuccessfulTask = (_async = false) => {
    return (succeed, _, send) => {
      let tid

      return {
        name: 'succeed',
        run: () => {
          const sync = () => {
            send('will succeed')
            counterSucceedChild++
            succeed('succeed')
          }

          _async ? (tid = setTimeout(sync)) : sync()
        },
        cancel: () => {
          clearTimeout(tid)
        },
      }
    }
  }

  const getCreateFailTask = (_async = false) => {
    return (_, fail, send) => {
      let tid

      return {
        name: 'fail',
        run: () => {
          const sync = () => {
            send('will fail')
            counterFailChild++
            fail('fail')
          }

          _async ? (tid = setTimeout(sync)) : sync()
        },
        cancel: () => {
          clearTimeout(tid)
        },
      }
    }
  }

  beforeEach(() => {
    succeed.mockClear()
    fail.mockClear()
    send.mockClear()

    counterSucceedChild = 0
    counterFailChild = 0
  })

  cases(
    'should succeed if no task provided',
    ({ composite }) => {
      const task = composite()(succeed)
      task.run()

      expect(succeed).toBeCalled()
    },
    {
      'serie sequence': { composite: serieSequence },
      'serie selector': { composite: serieSelector },
      'serie all': { composite: serieAll },
      'parallel sequence': { composite: parallelSequence },
      'parallel selector': { composite: parallelSelector },
      'parallel all': { composite: parallelAll },
    },
  )

  describe('serie', () => {
    describe('sequence', () => {
      it('should succeed when all task succeed', () => {
        createSuccessfulTask = getCreateSuccessfulTask()

        const task = serieSequence(createSuccessfulTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('serie-sequence')

        task.run()

        expect(send).toBeCalledWith('will succeed', 'succeed(0)')
        expect(send).toBeCalledWith('succeed', 'succeed(0)')
        expect(send).toBeCalledWith('will succeed', 'succeed(1)')
        expect(send).toBeCalledWith('succeed', 'succeed(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(succeed).toBeCalled()
        expect(fail).not.toBeCalled()
        expect(counterSucceedChild).toBe(2)
        expect(counterFailChild).toBe(0)
      })

      it('should fail as soon as one failed', () => {
        createSuccessfulTask = getCreateSuccessfulTask()
        createFailTask = getCreateFailTask()

        const task = serieSequence(createSuccessfulTask, createFailTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('serie-sequence')

        task.run()

        expect(send).toBeCalledWith('will succeed', 'succeed(0)')
        expect(send).toBeCalledWith('succeed', 'succeed(0)')
        expect(send).toBeCalledWith('will fail', 'fail(1)')
        expect(send).toBeCalledWith('fail', 'fail(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(succeed).not.toBeCalled()
        expect(fail).toBeCalled()

        expect(counterSucceedChild).toBe(1)
        expect(counterFailChild).toBe(1)
      })

      it('should fail as soon as one failed with async', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)
        createFailTask = getCreateFailTask(true)

        const task = serieSequence(createSuccessfulTask, createFailTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('serie-sequence')

        task.run()

        expect(counterSucceedChild).toBe(0)
        expect(counterFailChild).toBe(0)

        jest.runOnlyPendingTimers()

        expect(fail).not.toBeCalled()
        expect(counterSucceedChild).toBe(1)
        expect(counterFailChild).toBe(0)

        jest.runOnlyPendingTimers()

        expect(succeed).not.toBeCalled()
        expect(fail).toBeCalled()
        expect(counterSucceedChild).toBe(1)
        expect(counterFailChild).toBe(1)
      })
    })

    describe('selector', () => {
      it('should fail when all task failed', () => {
        createFailTask = getCreateFailTask()

        const task = serieSelector(createFailTask, createFailTask)(succeed, fail, send)
        expect(task.name).toBe('serie-selector')

        task.run()

        expect(send).toBeCalledWith('will fail', 'fail(0)')
        expect(send).toBeCalledWith('fail', 'fail(0)')
        expect(send).toBeCalledWith('will fail', 'fail(1)')
        expect(send).toBeCalledWith('fail', 'fail(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(fail).toBeCalled()
        expect(succeed).not.toBeCalled()

        expect(counterFailChild).toBe(2)
        expect(counterSucceedChild).toBe(0)
      })

      it('should succeed as soon as one succeed', () => {
        createSuccessfulTask = getCreateSuccessfulTask()
        createFailTask = getCreateFailTask()

        const task = serieSelector(createFailTask, createSuccessfulTask, createFailTask)(succeed, fail, send)
        expect(task.name).toBe('serie-selector')

        task.run()

        expect(send).toBeCalledWith('will fail', 'fail(0)')
        expect(send).toBeCalledWith('fail', 'fail(0)')
        expect(send).toBeCalledWith('will succeed', 'succeed(1)')
        expect(send).toBeCalledWith('succeed', 'succeed(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(fail).not.toBeCalled()
        expect(succeed).toBeCalled()

        expect(counterFailChild).toBe(1)
        expect(counterSucceedChild).toBe(1)
      })

      it('should fail as soon as one succeed with async', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)
        createFailTask = getCreateFailTask(true)

        const task = serieSelector(createFailTask, createSuccessfulTask, createFailTask)(succeed, fail, send)
        expect(task.name).toBe('serie-selector')

        task.run()

        expect(counterSucceedChild).toBe(0)
        expect(counterFailChild).toBe(0)

        jest.runOnlyPendingTimers()

        expect(succeed).not.toBeCalled()
        expect(counterSucceedChild).toBe(0)
        expect(counterFailChild).toBe(1)

        jest.runOnlyPendingTimers()

        expect(fail).not.toBeCalled()
        expect(succeed).toBeCalled()
        expect(counterSucceedChild).toBe(1)
        expect(counterFailChild).toBe(1)
      })
    })

    describe('all', () => {
      it('should succeed when all task succeed', () => {
        createSuccessfulTask = getCreateSuccessfulTask()

        const task = serieAll(createSuccessfulTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('serie-all')

        task.run()

        expect(succeed).toBeCalled()
        expect(fail).not.toBeCalled()

        expect(counterSucceedChild).toBe(2)
        expect(counterFailChild).toBe(0)
      })

      it('should fail if at least one failed', () => {
        createSuccessfulTask = getCreateSuccessfulTask()
        createFailTask = getCreateFailTask()

        const task = serieAll(createSuccessfulTask, createFailTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('serie-all')

        task.run()

        expect(succeed).not.toBeCalled()
        expect(fail).toBeCalled()

        expect(counterSucceedChild).toBe(2)
        expect(counterFailChild).toBe(1)
      })

      it('should fail if at least one failed with async', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)
        createFailTask = getCreateFailTask(true)

        const task = serieAll(createSuccessfulTask, createFailTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('serie-all')

        task.run()

        expect(counterSucceedChild).toBe(0)
        expect(counterFailChild).toBe(0)

        jest.runOnlyPendingTimers()

        expect(counterSucceedChild).toBe(1)
        expect(counterFailChild).toBe(0)

        jest.runOnlyPendingTimers()

        expect(succeed).not.toBeCalled()
        expect(fail).not.toBeCalled()
        expect(counterSucceedChild).toBe(1)
        expect(counterFailChild).toBe(1)

        jest.runOnlyPendingTimers()

        expect(succeed).not.toBeCalled()
        expect(fail).toBeCalled()
        expect(counterSucceedChild).toBe(2)
        expect(counterFailChild).toBe(1)
      })
    })
  })

  describe('parallel', () => {
    describe('sequence', () => {
      it('should succeed when all task succeed', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)

        const task = parallelSequence(createSuccessfulTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('parallel-sequence')

        task.run()

        expect(send).toHaveBeenCalledTimes(0)
        expect(succeed).not.toBeCalled()

        jest.runOnlyPendingTimers()

        expect(send).toBeCalledWith('will succeed', 'succeed(0)')
        expect(send).toBeCalledWith('succeed', 'succeed(0)')
        expect(send).toBeCalledWith('will succeed', 'succeed(1)')
        expect(send).toBeCalledWith('succeed', 'succeed(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(succeed).toBeCalled()
        expect(fail).not.toBeCalled()
        expect(counterSucceedChild).toBe(2)
        expect(counterFailChild).toBe(0)
      })

      it('should fail as soon as one failed', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)
        createFailTask = getCreateFailTask(true)

        const task = parallelSequence(createSuccessfulTask, createFailTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('parallel-sequence')

        task.run()

        expect(send).toHaveBeenCalledTimes(0)
        expect(fail).not.toBeCalled()

        jest.runOnlyPendingTimers()

        expect(send).toBeCalledWith('will succeed', 'succeed(0)')
        expect(send).toBeCalledWith('succeed', 'succeed(0)')
        expect(send).toBeCalledWith('will fail', 'fail(1)')
        expect(send).toBeCalledWith('fail', 'fail(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(succeed).not.toBeCalled()
        expect(fail).toBeCalled()
        expect(counterSucceedChild).toBe(1)
        expect(counterFailChild).toBe(1)
      })
    })

    describe('selector', () => {
      it('should fail when all task failed', () => {
        createFailTask = getCreateFailTask(true)

        const task = parallelSelector(createFailTask, createFailTask)(succeed, fail, send)
        expect(task.name).toBe('parallel-selector')

        task.run()

        expect(send).toHaveBeenCalledTimes(0)
        expect(fail).not.toBeCalled()

        jest.runOnlyPendingTimers()

        expect(send).toBeCalledWith('will fail', 'fail(0)')
        expect(send).toBeCalledWith('fail', 'fail(0)')
        expect(send).toBeCalledWith('will fail', 'fail(1)')
        expect(send).toBeCalledWith('fail', 'fail(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(fail).toBeCalled()
        expect(succeed).not.toBeCalled()
        expect(counterFailChild).toBe(2)
        expect(counterSucceedChild).toBe(0)
      })

      it('should succeed as soon as one succeed', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)
        createFailTask = getCreateFailTask(true)

        const task = parallelSelector(createFailTask, createSuccessfulTask, createFailTask)(succeed, fail, send)
        expect(task.name).toBe('parallel-selector')

        task.run()

        expect(send).toHaveBeenCalledTimes(0)
        expect(succeed).not.toBeCalled()

        jest.runOnlyPendingTimers()

        expect(send).toBeCalledWith('will fail', 'fail(0)')
        expect(send).toBeCalledWith('fail', 'fail(0)')
        expect(send).toBeCalledWith('will succeed', 'succeed(1)')
        expect(send).toBeCalledWith('succeed', 'succeed(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(fail).not.toBeCalled()
        expect(succeed).toBeCalled()
        expect(counterFailChild).toBe(1)
        expect(counterSucceedChild).toBe(1)
      })
    })

    describe('all', () => {
      it('should succeed when all task succeed', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)

        const task = parallelAll(createSuccessfulTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('parallel-all')

        task.run()

        expect(send).toHaveBeenCalledTimes(0)
        expect(succeed).not.toBeCalled()

        jest.runOnlyPendingTimers()

        expect(send).toBeCalledWith('will succeed', 'succeed(0)')
        expect(send).toBeCalledWith('succeed', 'succeed(0)')
        expect(send).toBeCalledWith('will succeed', 'succeed(1)')
        expect(send).toBeCalledWith('succeed', 'succeed(1)')
        expect(send).toHaveBeenCalledTimes(4)

        expect(succeed).toBeCalled()
        expect(fail).not.toBeCalled()

        expect(counterSucceedChild).toBe(2)
        expect(counterFailChild).toBe(0)
      })

      it('should fail if at least one failed', () => {
        createSuccessfulTask = getCreateSuccessfulTask(true)
        createFailTask = getCreateFailTask(true)

        const task = parallelAll(createSuccessfulTask, createFailTask, createSuccessfulTask)(succeed, fail, send)
        expect(task.name).toBe('parallel-all')

        task.run()

        expect(send).toHaveBeenCalledTimes(0)
        expect(fail).not.toBeCalled()

        jest.runOnlyPendingTimers()

        expect(send).toBeCalledWith('will succeed', 'succeed(0)')
        expect(send).toBeCalledWith('succeed', 'succeed(0)')
        expect(send).toBeCalledWith('will fail', 'fail(1)')
        expect(send).toBeCalledWith('fail', 'fail(1)')
        expect(send).toBeCalledWith('will succeed', 'succeed(2)')
        expect(send).toBeCalledWith('succeed', 'succeed(2)')
        expect(send).toHaveBeenCalledTimes(6)

        expect(succeed).not.toBeCalled()
        expect(fail).toBeCalled()

        expect(counterSucceedChild).toBe(2)
        expect(counterFailChild).toBe(1)
      })
    })
  })
})
