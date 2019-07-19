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

## What is Tasko ?

Tasko is a declarative task orchestrator. The control flow is inspired by Behavior trees's.<br/>
You define how tasks will perform based on their status (success or failure).<br/>
It can be used for any kind of job execution like Continuous Integration/Deployment, robot system, ...

## Installation

```shell
yarn add tasko
npm install tasko
```

## Simple example

Section

## Example with continuous integration on a frontend project

```js
import { serieSequence, serieSelector, parallelRace } from 'tasko/composite'

const npm = command => logger => ({
  run() {
    logger(`[start] npm run ${command} before run`)
    // No implementation of launching NPM script is provided here
    // ...
    logger(`[end] npm run ${command} done`)
  },
  clean() {
    // ...
  },
})

const createOrchestratorCI = serieSequence(
  // These tasks immediately break the CI if they failed
  npm(`lint`),
  npm(`format`),
  npm(`check-repository`),
  npm(`unit-tests`),

  // Functional tests
  // parallelRace is useful in conjunction with spawn processes which don't immediately return a success status
  parallelRace(
    npm(`chromedriver`),
    serieSequence(npm(`build`), npm(`serve`)),
    serieSequence(
      npm(`chromedriver:isReady`),
      npm(`serve:isReady`),
      // We want to rerun our tests if the first pass failed
      serieSelector(npm(`functional-tests`), npm(`rerun-functional-tests`)),
    ),
  ),
)

const orchestratorCI = createOrchestratorCI(console.log)

orchestratorCI
  .run() // This is the only explicit run you have to do
  .then(() => console.log('\nCI succeeded'), () => console.log('\nCI failed'))
```

#### Logs example for information

We consider that the spawn process inside tasks are killed by on clean phase

```
[start] npm run lint
[start] npm run format
[start] npm run check-repository
[start] npm run unit-tests
[start] npm run chromedriver
[start] npm run build
[start] npm run chromedriver:isReady
[end] npm run chromedriver:isReady
[start] npm run serve:isReady
[end] npm run build
[start] npm run serve
[end] npm run serve:isReady
[start] npm run functional-tests
[end] npm run functional-tests
[end] npm run chromedriver
[end] npm run serve

CI succeeded
```

## Api

### Task creators

A task creator is a function that creates a task.

#### Parameters

| Properties | Type   | Details                                                              |
| ---------- | ------ | -------------------------------------------------------------------- |
| **params** | spread | [Optional] Global params lift down from the main task to every tasks |

### Tasks

A task is an object which can be run a process and/or be cleaned.

#### Properties

| Properties | Type     | Details                                                                                                                                                                                                    |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **run**    | function | [Required] Called by the parent to run the task, it can return a **Promise**, nothing or throw an Error                                                                                                    |
| **clean**  | function | [Optional] Called by the parent to clean the task, before, during or after running the task to eventually cleanup data you initialized in the task, it can return a **Promise**, nothing or throw an Error |

### Composites

A **composite (or branch)** is a task which orchestrates other tasks with an execution mode and an exit condition.

#### Execution modes

It determined how a composite task should run its children.

- **serie**: one task after another
- **parallel**: the tasks run in parallel

#### Exit conditions

It determined how a composite task will succeed or fail based on its children.

- **selector**: it immediately succeeds if a child has succeeded, fails if all its children have failed
- **sequence**: it immediately fails if a child has failed, succeeds if all its children have succeeded
- **all**: it runs all its children, it fails if at least one child has failed, succeeds otherwise
- **race**: (only on parallel mode) as soon as a child has finished, it immediately finishes with the child status

If the **clean** function failed, the task too.

#### Parameter

A (spread) list of task creators to execute.

#### Returns

A task creators.

#### Available composites

```js
import {
  serieSequence,
  serieSelector,
  serieAll,
  parallelSequence,
  parallelSelector,
  parallelAll,
  parallelRace,
} from 'tasko/composite'
```

### Decorators

A **decorator** is a function which enhances the original task behavior.
You can eventually compose your decorators with the compose function of your choice.

See existing decoractors you can import https://github.com/DevSide/tasko/blob/master/src/decorator.js

#### Examples

```js
import { alwaysFail } from 'tasko/decorator'
import { parallelSequence } from 'tasko/composite'
import { compose } from '...'

const dummyJob = () => ({
  run() {
    console.log('dummy')
  },
})

// Delay any task with a number of milliseconds
const createDelayDecorator = ms => createTask => (...params) => {
  const task = createTask(...params)
  let timeout

  return {
    run: () =>
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          task.run().then(resolve, reject)
        }, ms)
      }),
    clean() {
      if (timeout) {
        clearTimeout(timeout)
      }

      if (task.clean) {
        return task.clean()
      }
    },
  }
}

const startAfter1s = createDelayDecorator(1000)
const startAfter5s = createDelayDecorator(5000)

const createSequencer = parallelSequence(
  dummyJob,
  startAfter1s(dummyJob),
  alwaysFail(dummyJob),
  compose(
    startAfter5s,
    alwaysFail,
  )(dummyJob),
)

createSequencer().run.then(() => console.log('never happens'), () => console.log('job failed'))
```
