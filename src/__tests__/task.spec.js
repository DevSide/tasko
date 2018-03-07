describe('task.spec', () => {
  const { createSucceedfulTask, createFailureTask } = require('../task')

  it('should create a succeed task', () => {
    const succeed = jest.fn()
    const send = jest.fn()
    const task = createSucceedfulTask(succeed, null, send)

    expect(task.name).toBe('succeed')

    task.run({ config: 'foo' })

    expect(send).toHaveBeenCalledWith('will succeed with params: [{"config":"foo"}]')
    expect(succeed).toHaveBeenCalledWith('succeed')
  })

  it('should create a fail task', () => {
    const fail = jest.fn()
    const send = jest.fn()
    const task = createFailureTask(null, fail, send)

    expect(task.name).toBe('fail')

    task.run({ config: 'foo' })

    expect(send).toHaveBeenCalledWith('will fail with params: [{"config":"foo"}]')
    expect(fail).toHaveBeenCalledWith('fail')
  })
})
