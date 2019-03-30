describe('decorator.spec', () => {
  const { alwaysSuccess, alwaysFail, invert } = require('../decorator')
  const param = {}
  let enhanceTask

  const createSuccessTask = p => {
    expect(p).toBe(param)

    return {
      run() {
        return Promise.resolve()
      },
    }
  }

  const createFailTask = p => {
    expect(p).toBe(param)

    return {
      run() {
        return Promise.reject()
      },
    }
  }

  describe('alwaysSuccess', () => {
    it('should succeed with a success task', () => {
      expect.assertions(2)
      enhanceTask = alwaysSuccess(createSuccessTask)(param)

      return expect(enhanceTask.run()).resolves.toEqual()
    })

    it('should succeed with a fail task', () => {
      expect.assertions(2)
      enhanceTask = alwaysSuccess(createFailTask)(param)

      return expect(enhanceTask.run()).resolves.toEqual()
    })
  })

  describe('alwaysFailed', () => {
    it('should fail with a success task', () => {
      expect.assertions(2)
      enhanceTask = alwaysFail(createSuccessTask)(param)

      return expect(enhanceTask.run()).rejects.toEqual()
    })

    it('should fail with a fail task', () => {
      expect.assertions(2)
      enhanceTask = alwaysFail(createFailTask)(param)

      return expect(enhanceTask.run()).rejects.toEqual()
    })
  })

  describe('invert', () => {
    it('should fail with a success task', () => {
      expect.assertions(2)
      enhanceTask = invert(createSuccessTask)(param)

      return expect(enhanceTask.run()).rejects.toEqual()
    })

    it('should succeed with a fail task', () => {
      expect.assertions(2)
      enhanceTask = invert(createFailTask)(param)

      return expect(enhanceTask.run()).resolves.toEqual()
    })
  })
})
