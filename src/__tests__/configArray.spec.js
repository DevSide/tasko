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
    [
      { name: 'null', config: null, send: errorElement },
      { name: '[]', config: [], send: errorCompositeName },
      { name: '["serieSelector"]', config: ['serieSelector'], send: errorComposite },
      { name: '["unknown", () => {}]', config: ['unknown', () => {}], send: errorCompositeName },
      { name: '["serieSelector", null]', config: ['serieSelector', null], send: errorElement },
      { name: '["serieSelector", []]', config: ['serieSelector', []], send: errorCompositeName },
      {
        name: '["serieSelector", ["parallelSequence"]]',
        config: ['serieSelector', ['parallelSequence']],
        send: errorComposite,
      },
      {
        name: '["serieSelector", ["unknown", () => {}]]',
        config: ['serieSelector', ['unknown', () => {}]],
        send: errorCompositeName,
      },
      {
        name: '["serieSelector", ["parallelSequence", null]]',
        config: ['serieSelector', ['parallelSequence', null]],
        send: errorElement,
      },
      {
        name: '["serieSelector", ["parallelSequence", []]]',
        config: ['serieSelector', ['parallelSequence', []]],
        send: errorCompositeName,
      },
    ],
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
