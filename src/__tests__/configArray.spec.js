describe('configArray.spec', () => {
  jest.mock('../composite', () => ({
    serialSelector: jest.fn(),
    parallelSequence: jest.fn(),
  }))

  const cases = require('jest-in-case')
  const configArray = require('../configArray').default
  const composite = require('../composite')

  const errorElement = /element should be/
  const errorCompositeName = /unknown composite name/
  const errorComposite = /composites need at least/

  const createTask1 = () => {}
  const createTask2 = () => {}
  const createTask3 = () => {}

  beforeEach(() => {
    composite.serialSelector.mockClear()
    composite.parallelSequence.mockClear()
  })

  cases(
    'invalid parsing, it should throw a parsing error',
    ({ config, message }) => {
      expect(() => {
        configArray(config)
      }).toThrowError(message)
    },
    {
      null: { config: null, message: errorElement },
      '[]': { config: [], message: errorCompositeName },
      '["serialSelector"]': {
        config: ['serialSelector'],
        message: errorComposite,
      },
      '["unknown", () => {}]': {
        config: ['unknown', () => {}],
        message: errorCompositeName,
      },
      '["serialSelector", null]': {
        config: ['serialSelector', null],
        message: errorElement,
      },
      '["serialSelector", []]': {
        config: ['serialSelector', []],
        message: errorCompositeName,
      },
      '["serialSelector", ["parallelSequence"]]': {
        config: ['serialSelector', ['parallelSequence']],
        message: errorComposite,
      },
      '["serialSelector", ["unknown", () => {}]]': {
        config: ['serialSelector', ['unknown', () => {}]],
        message: errorCompositeName,
      },
      '["serialSelector", ["parallelSequence", null]]': {
        config: ['serialSelector', ['parallelSequence', null]],
        message: errorElement,
      },
      '["serialSelector", ["parallelSequence", []]]': {
        config: ['serialSelector', ['parallelSequence', []]],
        message: errorCompositeName,
      },
    },
  )

  describe('valid parsing', () => {
    it('should parse a single create task config', () => {
      expect(configArray(createTask1)).toBe(createTask1)
    })

    it('should parse a single composite config', () => {
      configArray(['serialSelector', createTask1, createTask2])

      expect(composite.serialSelector).toBeCalledWith(createTask1, createTask2)
    })

    it('should parse a two-levels composite config', () => {
      const parallelSequenceTaskBuilder = () => {}
      composite.parallelSequence.mockImplementation(() => parallelSequenceTaskBuilder)

      configArray(['serialSelector', createTask1, ['parallelSequence', createTask2, createTask3]])

      expect(composite.parallelSequence).toBeCalledWith(createTask2, createTask3)
      expect(composite.serialSelector).toBeCalledWith(createTask1, parallelSequenceTaskBuilder)
    })
  })
})
