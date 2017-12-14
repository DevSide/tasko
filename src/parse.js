import * as composite from './composite'

const parseElement = element => {
  if (typeof element === 'function') {
    return element
  }

  if (Array.isArray(element)) {
    return parseComposite(...element)
  }

  throw new Error(
    'Parse failed: element should be a composite (array) or a task builder (function)',
  )
}

const parseComposite = (compositeName, ...tasks) => {
  if (typeof compositeName !== 'string' || !composite[compositeName]) {
    throw new Error(`Parse failed: unknown composite name ${compositeName}`)
  }

  if (!tasks.length) {
    throw new Error('Parse failed: composites need at least an element')
  }

  return composite[compositeName](...tasks.map(parseElement))
}

export default parseElement
