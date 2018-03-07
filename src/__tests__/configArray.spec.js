describe('configArray.spec', () => {
  jest.mock('../composite', () => ({
    serieSelector: jest.fn(),
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
    composite.serieSelector.mockClear()
    composite.parallelSequence.mockClear()
  })

  cases(
    'invalid parsing, it should throw a parsing error',
    ({ config, send }) => {
      expect(() => {
        configArray(config)
      }).toThrowError(send)
    },
    {
      null: { config: null, send: errorElement },
      '[]': { config: [], send: errorCompositeName },
      '["serieSelector"]': {
        config: ['serieSelector'],
        send: errorComposite,
      },
      '["unknown", () => {}]': {
        config: ['unknown', () => {}],
        send: errorCompositeName,
      },
      '["serieSelector", null]': {
        config: ['serieSelector', null],
        send: errorElement,
      },
      '["serieSelector", []]': {
        config: ['serieSelector', []],
        send: errorCompositeName,
      },
      '["serieSelector", ["parallelSequence"]]': {
        config: ['serieSelector', ['parallelSequence']],
        send: errorComposite,
      },
      '["serieSelector", ["unknown", () => {}]]': {
        config: ['serieSelector', ['unknown', () => {}]],
        send: errorCompositeName,
      },
      '["serieSelector", ["parallelSequence", null]]': {
        config: ['serieSelector', ['parallelSequence', null]],
        send: errorElement,
      },
      '["serieSelector", ["parallelSequence", []]]': {
        config: ['serieSelector', ['parallelSequence', []]],
        send: errorCompositeName,
      },
    },
  )

  describe('valid parsing', () => {
    it('should parse a single create task config', () => {
      expect(configArray(createTask1)).toBe(createTask1)
    })

    it('should parse a single composite config', () => {
      configArray(['serieSelector', createTask1, createTask2])

      expect(composite.serieSelector).toBeCalledWith(createTask1, createTask2)
    })

    it('should parse a two-levels composite config', () => {
      const parallelSequenceTaskBuilder = () => {}
      composite.parallelSequence.mockImplementation(() => parallelSequenceTaskBuilder)

      configArray(['serieSelector', createTask1, ['parallelSequence', createTask2, createTask3]])

      expect(composite.parallelSequence).toBeCalledWith(createTask2, createTask3)
      expect(composite.serieSelector).toBeCalledWith(createTask1, parallelSequenceTaskBuilder)
    })
  })
})
