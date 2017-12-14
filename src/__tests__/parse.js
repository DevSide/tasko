import cases from 'jest-in-case'
import parse from '../parse'
import * as composite from '../composite'

jest.mock('../composite', () => ({
  serieSelector: jest.fn(),
  parallelSequence: jest.fn(),
}))

describe('parse.spec', () => {
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
    'invalid parsing, it should throw a parse error',
    ({ config, message }) => {
      expect(() => {
        parse(config)
      }).toThrowError(message)
    },
    {
      null: { config: null, message: errorElement },
      '[]': { config: [], message: errorCompositeName },
      '["serieSelector"]': {
        config: ['serieSelector'],
        message: errorComposite,
      },
      '["unknown", () => {}]': {
        config: ['unknown', () => {}],
        message: errorCompositeName,
      },
      '["serieSelector", null]': {
        config: ['serieSelector', null],
        message: errorElement,
      },
      '["serieSelector", []]': {
        config: ['serieSelector', []],
        message: errorCompositeName,
      },
      '["serieSelector", ["parallelSequence"]]': {
        config: ['serieSelector', ['parallelSequence']],
        message: errorComposite,
      },
      '["serieSelector", ["unknown", () => {}]]': {
        config: ['serieSelector', ['unknown', () => {}]],
        message: errorCompositeName,
      },
      '["serieSelector", ["parallelSequence", null]]': {
        config: ['serieSelector', ['parallelSequence', null]],
        message: errorElement,
      },
      '["serieSelector", ["parallelSequence", []]]': {
        config: ['serieSelector', ['parallelSequence', []]],
        message: errorCompositeName,
      },
    },
  )

  describe('valid parsing', () => {
    it('should parse a single task builder config', () => {
      expect(parse(createTask1)).toBe(createTask1)
    })

    it('should parse a single composite config', () => {
      parse(['serieSelector', createTask1, createTask2])

      expect(composite.serieSelector).toBeCalledWith(createTask1, createTask2)
    })

    it('should parse a two-levels composite config', () => {
      const parallelSequenceTaskBuilder = () => {}
      composite.parallelSequence.mockImplementation(
        () => parallelSequenceTaskBuilder,
      )

      parse([
        'serieSelector',
        createTask1,
        ['parallelSequence', createTask2, createTask3],
      ])

      expect(composite.parallelSequence).toBeCalledWith(
        createTask2,
        createTask3,
      )
      expect(composite.serieSelector).toBeCalledWith(
        createTask1,
        parallelSequenceTaskBuilder,
      )
    })
  })
})
