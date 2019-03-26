describe('decorator.spec', () => {
  jest.useFakeTimers()

  const { alwaysSucceed, alwaysFail, invert } = require('../decorator')
  const { createSucceedfulTask, createFailureTask } = require('../task')
  const { noop } = require('../util')

  let succeed = jest.fn()
  let fail = jest.fn()
  let send = jest.fn()

  let run = jest.fn()
  let cancel = jest.fn()
  let enhanceTask

  beforeEach(() => {
    succeed.mockClear()
    fail.mockClear()
    send.mockClear()

    run.mockClear()
    cancel.mockClear()
  })

  describe('alwaysSucceed', () => {
    it('should succeed with a succeed task', () => {
      enhanceTask = alwaysSucceed(createSucceedfulTask)(succeed, fail, send)

      expect(enhanceTask.name).toBe('@alwaysSucceed(succeed)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run('foo', 'bar')

      expect(send).toHaveBeenCalledWith('will succeed with params: ["foo","bar"]')
      expect(succeed).toBeCalled()
      expect(fail).not.toBeCalled()
    })

    it('should succeed with a fail task', () => {
      enhanceTask = alwaysSucceed(createFailureTask)(succeed, fail, send)

      expect(enhanceTask.name).toBe('@alwaysSucceed(fail)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run('foo', 'bar')

      expect(send).toHaveBeenCalledWith('will fail with params: ["foo","bar"]')
      expect(succeed).toBeCalled()
      expect(fail).not.toBeCalled()
    })
  })

  describe('alwaysFailed', () => {
    it('should fail with a succeed task', () => {
      enhanceTask = alwaysFail(createSucceedfulTask)(succeed, fail, send)

      expect(enhanceTask.name).toBe('@alwaysFail(succeed)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run('foo', 'bar')

      expect(send).toHaveBeenCalledWith('will succeed with params: ["foo","bar"]')
      expect(fail).toBeCalled()
      expect(succeed).not.toBeCalled()
    })

    it('should fail with a fail task', () => {
      enhanceTask = alwaysFail(createFailureTask)(succeed, fail, send)

      expect(enhanceTask.name).toBe('@alwaysFail(fail)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run('foo', 'bar')

      expect(send).toHaveBeenCalledWith('will fail with params: ["foo","bar"]')
      expect(fail).toBeCalled()
      expect(succeed).not.toBeCalled()
    })
  })

  describe('invert', () => {
    it('should fail with a succeed task', () => {
      enhanceTask = invert(createSucceedfulTask)(succeed, fail, send)

      expect(enhanceTask.name).toBe('@invert(succeed)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run('foo', 'bar')

      expect(send).toHaveBeenCalledWith('will succeed with params: ["foo","bar"]')
      expect(fail).toBeCalled()
      expect(succeed).not.toBeCalled()
    })

    it('should succeed with a fail task', () => {
      enhanceTask = invert(createFailureTask)(succeed, fail, send)

      expect(enhanceTask.name).toBe('@invert(fail)')
      expect(enhanceTask.cancel).toBe(noop)

      enhanceTask.run('foo', 'bar')

      expect(send).toHaveBeenCalledWith('will fail with params: ["foo","bar"]')
      expect(succeed).toBeCalled()
      expect(fail).not.toBeCalled()
    })
  })
})
