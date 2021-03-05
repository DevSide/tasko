import * as composite from './composite'

const parseElement = (element) => {
  if (typeof element === 'function') {
    return element
  }

  if (Array.isArray(element)) {
    return parseComposite(...element)
  }

  throw new Error('Parsing failed: element should be a composite (array) or a create task (function)')
}

const parseComposite = (compositeName, ...tasks) => {
  if (typeof compositeName !== 'string' || !composite[compositeName]) {
    throw new Error(`Parsing failed: unknown composite name ${compositeName}`)
  }

  if (!tasks.length) {
    throw new Error('Parsing failed: composites need at least an element')
  }

  return composite[compositeName](...tasks.map(parseElement))
}

export default parseElement
