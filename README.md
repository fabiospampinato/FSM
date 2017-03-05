# FSM

![Issues](https://img.shields.io/github/issues/fabiospampinato/fsm.svg)
[![NPM version](https://img.shields.io/npm/v/@fabiospampinato/fsm.svg)](https://www.npmjs.com/package/@fabiospampinato/fsm)

Finite State Machine implementation, with support for guards and enter/exit events.

## Install

```shell
$ npm install --save @fabiospampinato/fsm
```

## Usage

```js
import FSM from '@fabiospampinato/fsm';

// The keys of a `states` object are the available states
// The value assigned to each key is an object of the following shape:
//   {
//     transitions: {
//       transitionName: '*', // `*` is a special value that points to the current state
//       transitionName: 'nextState',
//       transitionName: {
//         state: 'nextState',
//         guard: 'methodToCall', // Passed if the method returns true
//         guard: '!methodToCall', // Passed if the method returns false
//         guard: 'firstMethodToCall|!secondMethodtoCall' // Passed if all the `|`-separated guards are passed
//       }
//     }
//   }

const states = {
  standing: {
    transitions: {
      walk: {
        state: 'walking',
        guard: '!isLazy'
      }
    }
  },
  walking: {
    transitions: {
      smile: '*',
      stop: 'standing',
      speedUp: 'running'
    }
  },
  running: {
    transitions: {
      slowDown: 'walking'
    }
  }
};

// A model is an object defining some methods that will be called by the state machine:
//   transition: a method with the same name of a transition will be called when that transition happens
//   enter handlers: a method with a name of `myStateEnter` will be called when the `myState` state is entered
//   exit handlers: a method with a name of `myStateExit` will be called when the `myState` state is exited
//   guards: a method with the same name of a guard will be called before doing a transition

const Model = new class {
  isLazy () {
    return false;
  }
  smile () {
    console.log ( ':D' );
  }
  walkingEnter () {
    console.log ( 'Now I\'m walking' );
  }
  walkingExit () {
    console.log ( 'Now I\'n not walking anymore' );
  }
};

const machine = new FSM ( Model, states, 'standing' );

machine.transition ( 'walk' );
machine.transition ( 'smile' );
machine.transition ( 'speedUp' );
machine.transition ( 'slowDown' );
machine.transition ( 'stop' );
```

## API

### `new FSM ( model, states, initial )`

Given a model where to look for handlers, a `states` object describing the shape of the machine, and an initial state, it returns an instance of FSM.

### `.get (): string`

Returns the current state.

### `.set ( state: string ): this`

Replaces the current state with `state`.

### `.reset (): this`

Replaces the current state with the initial state.

### `.is ( state: string ): boolean`

Checks if the current state is `state`.

### `.isDoable ( transition: string ): boolean`

Checks if a particular transition could be done.

### `.do ( ...args ): this`

An alias of `.transition`.

### `.transition ( transition: string, ...args ): this`

If the transition is not doable, or if the next state is invalid it will throw an exception.

Otherwise it will perform the transition, basically: triggers `exit` events, if exists calls model's method that have the same name as this transition, triggers `enter` events.

## Related

- [HSM](https://github.com/fabiospampinato/HSM) - Hierarchical State Machine implementation, with support for guards and enter/exit events.

## License

MIT © Fabio Spampinato
