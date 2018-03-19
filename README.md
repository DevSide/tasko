<h3 align="center">
  Tasko
</h3>

<p align="center">
  Declarative task sequencer for Javascript
</p>

<p align="center">
  <a href="https://travis-ci.org/DevSide/tasko" target="_blank">
    <img src="https://img.shields.io/travis/DevSide/tasko/master.svg" alt="Build Status">
  </a>
  <a href='https://coveralls.io/github/DevSide/tasko?branch=master' target="_blank">
    <img src='https://img.shields.io/coveralls/github/DevSide/tasko/master.svg' alt='Coverage Status' />
  </a>
  <a href="https://www.npmjs.com/package/tasko" target="_blank">
    <img src="https://img.shields.io/npm/v/tasko.svg" alt="NPM Version">
  </a>
</p>

### Installation

```shell
yarn add tasko
npm install tasko
```

### Terminology

Tasko is inspired by Behavior tree' control flow. It doesn't rely on a time-based execution (tick).

### Task

A **task** is an **object** created with a create-task function.

#### Properties

| Properties | Type     | Détails                                                                   |
| ---------- | -------- | ------------------------------------------------------------------------- |
| **name**   | string   | Task name                                                                 |
| **run**    | function | Called by the parent to run the task with optional spread params          |
| **cancel** | function | Called by the parent to cancel the task, before or after running the task |

#### Usage

```js
/**
 * Create a successful task
 *
 * @param {function} success - The callback to succeed with an optional param
 * @param {function} fail - The callback to fail with an optional param
 * @param {function} message - Send a message to the parent
 *
 * @returns {object} - A task
 */
const createSuccessfulTask = (success, fail, message) => ({
  name: 'success',
  run(...params) {
    message(`the task is running with params: ${JSON.stringify(params)}`)
    success('success')
  },
  cancel: () => {
    // noop
  },
})
```

### Decorator

A **decorator** is a function which enhance the original task behavior.

#### Usage

```js
/**
 * Makes a task always succeeds
 *
 * @param {function} createTask - original create-task
 *
 * @returns {function} - Enhance create-task
 */
const alwaysSucceed = createTask => (succeed, _, message) => {
  const task = createTask(succeed, succeed, message)

  return {
    ...task,
    name: decorateName('alwaysSucceed', task.name), // @alwaysSucceed(task-name)
  }
}
```

### Composition

A **composite, or branch, task** runs other tasks

#### Exit condition

It determined how a composite task will succeed or fail based on its children.

* **selector**: this task immediately succeeds if a child has succeeded, fails if all its children have failed
* **sequence**: this task immediately fails if a child has failed, succeeds if all its children have succeeded
* **all**: this task runs all its children, it fails if a child has failed, succeeds otherwise

#### Execution mode

It determined how a composite task should run its children.

* **serie**: one task after another
* **parallel**: only works if the tasks run asynchronously (microtasks), serie otherwise

#### Api

```js
import { 
 serieSequence,
 serieSelector,
 serieAll,
 parallelSequence,
 parallelSelector,
 parallelAll
} from 'tasko/composite'
```

composite(...createTasks)

**createTasks**: spread list of createTasks to compose
**Returns**: a createTask

#### Usage

```js
import { serieSequence, parallelAll } from 'tasko/composite'
import { noop } from 'tasko/util'

const think = (success, fail, message) => ({
  name: 'think',
  run() {
    message(`I'm thinking`)
    success('Done')
  },
  cancel: noop,
})

const thinkings = serieSequence(think, think)

thinkings(
  () => console.log('Process succeeded !'),
  () => console.log('Process failed !'),
  (message, taskName) => console.log(taskName + ':', message),
)
```

Logs

```
think: I'm thinking
think: Done
think: I'm thinking
think: Done
Process succeeded !
```

### More examples
