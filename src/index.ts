
/* IMPORT */

import * as _ from 'lodash';
import FIFO from '@fabiospampinato/fifo';
import Lockable from '@fabiospampinato/lockable';
import {guard, model, state, states, transition, transitionObj, statesObj} from './types';

/* FSM */

//TODO: Add support for actions on submodules, like `history.start`: 'end'
//TODO: Add support for an `action` key on the transition object, that would be the executed action

class FSM {

  /* PROPERTIES */

  model: model;
  states: statesObj;
  queue: FIFO;
  initial: state;
  processing: Lockable;
  state: state;

  /* CONSTRUCTOR */

  constructor ( model: model, states: statesObj, initial: state ) {

    this.model = model;
    this.states = states;
    this.queue = new FIFO ();
    this.initial = initial;
    this.processing = new Lockable ();

    this.set ( this.initial );

  }

  /* UTILITIES */

  _isValidState ( state: state ): boolean {

    return this.states.hasOwnProperty ( state );

  }

  _isValidTransition ( state: state, transition: transition ): boolean {

    return this._isValidState ( state ) && !!this._getTransitionState ( state, transition ) && this._isValidTransitionGuard ( state, transition );

  }

  _isValidTransitionGuard ( state: state, transition: transition ): boolean {

    const guards = this._getTransitionGuard ( state, transition );

    if ( !guards ) return true;

    for ( let guard of guards.split ( '|' ) ) {

      const parts = guard.match ( /^(!?)(\w+)(?:\.(\w+))?$/ );

      if ( !parts ) throw new Error ( '[fsm] Invalid guard' );

      const affirmative = ( parts[1] !== '!' ),
            method = _.compact ( parts.slice ( 2 ) ).join ( '.' );

      if ( !!this._callModel ( method ) !== affirmative ) return false;

    }

    return true;

  }

  _getTransition ( state: state, transition: transition ): transitionObj | undefined {

    const stateObj = this.states[state];

    if ( !stateObj.hasOwnProperty ( 'transitions' ) ) return;

    return stateObj.transitions[transition];

  }

  _getTransitionState ( state: state, transition: transition ): state | undefined {

    const transitionObj = this._getTransition ( state, transition );

    if ( _.isUndefined ( transitionObj ) || _.isString ( transitionObj ) ) return transitionObj;

    return transitionObj.state;

  }

  _getTransitionGuard ( state: state, transition: transition ): guard | undefined {

    const transitionObj = this._getTransition ( state, transition );

    if ( _.isUndefined ( transitionObj ) || _.isString ( transitionObj ) ) return;

    return transitionObj.guard;

  }

  _getExistsEnters ( prevState: state, nextState: state ): [states, states] { // Exists just to provide a DRYer implementation of HSM

    if ( prevState === nextState ) return [[], []];

    return [[prevState], [nextState]];

  }

  _callModel ( path: string, args: any[] = [] ) {

    const method = _.get ( this.model, path );

    if ( !_.isFunction ( method ) ) return;

    const context = _.includes ( path, '.' ) ? _.get ( this.model, path.split ( '.' ).slice ( 0, -1 ).join ( '.' ) ) : this.model;

    return method.apply ( context, args );

  }

  /* GET */

  get (): state {

    return this.state;

  }

  /* SET */

  set ( state: state ): this {

    if ( !this._isValidState ( state ) ) throw new Error ( `[fsm] Invalid state "${state}"` );

    this.state = state;

    return this;

  }

  /* RESET */

  reset (): this {

    return this.set ( this.initial );

  }

  /* IS */

  is ( state: state ): boolean {

    return this.state === state;

  }

  isDoable ( transition: transition ): boolean {

    return this._isValidTransition ( this.state, transition );

  }

  /* TRANSITION */

  do ( ...args ): this { // Just an alias of `transition`

    return this.transition.call ( this, ...args );

  }

  transition ( transition: transition ): this;
  transition ( transition: transition, ...args ): this;
  transition ( transition: transition, ...args ): this {

    this.queue.add ( [transition, ...args] );

    if ( this.processing.isLocked () ) return this;

    this.processing.lock ();

    while ( true ) {

      const next = this.queue.next ();

      if ( !next ) break;

      this._transition.apply ( this, next );

    }

    this.processing.unlock ();

    return this;

  }

  _transition ( transition: string, ...args ) {

    if ( !this.isDoable ( transition ) ) throw new Error ( `[fsm] Invalid transition "${transition}" from state "${this.state}"` );

    let nextState = this._getTransitionState ( this.state, transition );

    if ( !nextState ) throw new Error ( `[fsm] Invalid transition "${transition}" from state "${this.state}"` );

    if ( nextState === '*' ) nextState = this.state; // `*` states always point to the current state

    const [exits, enters] = this._getExistsEnters ( this.state, nextState );

    exits.forEach ( this._exit.bind ( this ) );

    this._callModel ( transition, args );

    enters.forEach ( this._enter.bind ( this ) );

    this.set ( nextState );

  }

  /* EVENTS */

  _exit ( state: state ): void {

    this._callModel ( `${state}Exit` );

  }

  _enter ( state: state ): void {

    this.set ( state );

    this._callModel ( `${state}Enter` );

  }

}

/* EXPORT */

export default FSM;
