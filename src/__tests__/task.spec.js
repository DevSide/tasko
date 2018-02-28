describe('task.spec', () => {
  const { createSuccessTask, createFailTask } = require('../task')

  it('should create a success task', () => {
    const success = jest.fn()
    const message = jest.fn()
    const task = createSuccessTask(success, null, message)

    expect(task.name).toBe('success')

    task.run()

    expect(message).toHaveBeenCalledWith('will success')
    expect(success).toHaveBeenCalledWith('success')
  })

  it('should create a fail task', () => {
    const fail = jest.fn()
    const message = jest.fn()
    const task = createFailTask(null, fail, message)

    expect(task.name).toBe('fail')

    task.run()

    expect(message).toHaveBeenCalledWith('will fail')
    expect(fail).toHaveBeenCalledWith('fail')
  })
})
