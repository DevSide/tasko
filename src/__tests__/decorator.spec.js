describe('decorator.spec', () => {
  jest.useFakeTimers()

  const { alwaysSuccess, alwaysFail, invert, immediate } = require('../decorator')
  const { createSuccessTask, createFailTask } = require('../task')
  const { noop } = require('../util')

  let success = jest.fn()
  let fail = jest.fn()
  let message = jest.fn()

  let run = jest.fn()
  let cancel = jest.fn()
  let enhanceTask

  beforeEach(() => {
    success.mockClear()
    fail.mockClear()
    message.mockClear()

    run.mockClear()
    cancel.mockClear()
  })

  describe('alwaysSuccess', () => {
    it('should success with a success task', () => {
      enhanceTask = alwaysSuccess(createSuccessTask)(success, fail, message)

      expect(enhanceTask.name).toBe('@alwaysSuccess(success)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run()

      expect(message).toHaveBeenCalledWith('will success')

      expect(success).toBeCalled()
      expect(fail).not.toBeCalled()
    })

    it('should success with a fail task', () => {
      enhanceTask = alwaysSuccess(createFailTask)(success, fail, message)

      expect(enhanceTask.name).toBe('@alwaysSuccess(fail)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run()

      expect(success).toBeCalled()
      expect(fail).not.toBeCalled()
    })
  })

  describe('alwaysFailed', () => {
    it('should fail with a success task', () => {
      enhanceTask = alwaysFail(createSuccessTask)(success, fail, message)

      expect(enhanceTask.name).toBe('@alwaysFail(success)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run()

      expect(fail).toBeCalled()
      expect(success).not.toBeCalled()
    })

    it('should fail with a fail task', () => {
      enhanceTask = alwaysFail(createFailTask)(success, fail, message)

      expect(enhanceTask.name).toBe('@alwaysFail(fail)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run()

      expect(fail).toBeCalled()
      expect(success).not.toBeCalled()
    })
  })

  describe('invert', () => {
    it('should fail with a success task', () => {
      enhanceTask = invert(createSuccessTask)(success, fail, message)

      expect(enhanceTask.name).toBe('@invert(success)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run()

      expect(fail).toBeCalled()
      expect(success).not.toBeCalled()
    })

    it('should success with a fail task', () => {
      enhanceTask = invert(createFailTask)(success, fail, message)

      expect(enhanceTask.name).toBe('@invert(fail)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run()

      expect(success).toBeCalled()
      expect(fail).not.toBeCalled()
    })
  })

  describe('immediate', () => {
    it('should success with a success task', () => {
      enhanceTask = immediate(createSuccessTask)(success, fail, message)

      expect(enhanceTask.name).toBe('@immediate(success)')
      // expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run()

      expect(success).not.toBeCalled()

      jest.runAllImmediates()

      expect(fail).not.toBeCalled()
      expect(success).toBeCalled()
    })
  })
})
