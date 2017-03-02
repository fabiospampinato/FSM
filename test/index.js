
/* IMPORT */

import * as _ from 'lodash';
import {describe} from 'ava-spec';
import callSpy from 'call-spy'
import FIFO from '@fabiospampinato/fifo';
import FSM from '../dist';
import {Model, states, initialState} from './mocks';

/* FSM */

describe ( 'FSM', it => {

  it.beforeEach ( t => {

    t.context.M = new Model ();
    t.context.F = new FSM ( t.context.M, _.cloneDeep ( states ), initialState );

  });

  describe ( 'constructor', it => {

    it ( 'Creates a queue', t => {

      t.true ( t.context.F.queue instanceof FIFO );

    });

    it ( 'Sets queue processing to false', t => {

      t.false ( t.context.F.processing.isLocked () );

    });

    it ( 'Sets the initial state', t => {

      t.is ( t.context.F.get (), initialState );

    });

  });

  describe ( '_isValidState', it => {

    it ( 'Checks if a state is a known state', t => {

      const keys = _.keys ( states );

      for ( let state in keys ) {

        if ( !states.hasOwnProperty ( state ) ) continue;

        t.true ( t.context.F._isValidState ( state ) );

      }

      t.false ( t.context.F._isValidState ( '__test__' ) );

    });

  });

  describe ( '_isValidTransition', it => {

    it ( 'Checks if a transition is possible from the current state', t => {

      const keys = _.keys ( states );

      for ( let state in keys ) {

        if ( !states.hasOwnProperty ( state ) ) continue;

        const transitions = _.keys ( states[state] );

        for ( let transition of transitions ) {

          t.true ( t.context.F._isValidTransition ( state, transition ) );

        }

        t.false ( t.context.F._isValidTransition ( state, '__test__' ) );

      }

    });

  });

  describe ( '_isValidTransitionGuard', it => {

    it.todo ( 'Checks that a guard from a state with a transition avaluates to true' );

  });

  describe ( '_getTransitionState', it => {

    it ( 'Gets the next state given the starting state and a transition', t => {

      t.is ( t.context.F._getTransitionState ( 'a', 'toStar' ), '*' );
      t.is ( t.context.F._getTransitionState ( 'a', 'toInvalid' ), 'a' );
      t.is ( t.context.F._getTransitionState ( 'b', 'toB2' ), 'b2' );

    });

    it ( 'Returns undefined if none is found', t => {

      t.is ( t.context.F._getTransitionState ( 'a', '__test__' ), undefined );

    });

  });

  describe ( '_getTransitionGuard', it => {

    it ( 'Gets the guard to check given the starting state and a transition', t => {

      t.is ( t.context.F._getTransitionGuard ( 'a', 'toInvalid' ), states.a.transitions.toInvalid.guard );
      t.is ( t.context.F._getTransitionGuard ( 'a', 'toC' ), states.a.transitions.toC.guard );

    });

    it ( 'Returns undefined if none is found', t => {

      t.is ( t.context.F._getTransitionGuard ( 'a', 'toA' ), undefined );

    });

  });

  describe ( '_getExistsEnters', it => {

    it ( 'Returns an array of states to exit and one of states to enter', t => {

      t.deepEqual ( t.context.F._getExistsEnters ( 'a', 'a' ), [[], []] );
      t.deepEqual ( t.context.F._getExistsEnters ( 'a', 'c' ), [['a'], ['c']] );

    });

  });

  describe ( '_callModel', it => {

    it ( 'Calls the model by path, applies the args, and returns its return value', t => {

      const res1 = {};

      t.context.M.true = callSpy ( t.context.M.true, res1 );

      t.context.F._callModel ( 'true', [1, 2, 3] );

      t.true ( res1.called );
      t.deepEqual ( res1.arguments, [1, 2, 3] );
      t.deepEqual ( res1.return, t.context.M.true () );

      const res2 = {};

      t.context.M.sub.true = callSpy ( t.context.M.sub.true, res2 );

      t.context.F._callModel ( 'sub.true', [1, 2, 3] );

      t.true ( res2.called );
      t.deepEqual ( res2.arguments, [1, 2, 3] );
      t.deepEqual ( res2.return, t.context.M.sub.true () );

    });

  });

  describe ( 'get', it => {

    it ( 'Gets the current state', t => {

      t.is ( t.context.F.get (), initialState );

      t.context.F.transition ( 'toB' );

      t.is ( t.context.F.get (), 'b' );

    });

  });

  describe ( 'set', it => {

    it ( 'Sets a state as the current one', t => {

      _.keys ( states ).forEach ( state => {
        t.context.F.set ( state );
        t.is ( t.context.F.get (), state );
      });

    });

    it ( 'Throws an error for invalid states', t => {

      t.throws ( () => t.context.F.set ( 'z' ), /Invalid state/ );

    });

  });

  describe ( 'reset', it => {

    it ( 'Sets the state to the initial one', t => {

      t.context.F.set ( 'c' );

      t.context.F.reset ();

      t.is ( t.context.F.get (), initialState );

    });

  });

  describe ( 'is', it => {

    it ( 'Checks if a state is the current one', t => {

      t.is ( t.context.F.get (), 'a' );

      t.context.F.transition ( 'toB' );

      t.is ( t.context.F.get (), 'b' );

    });

  });

  describe ( 'isDoable', it => {

    it ( 'Checks if a transition is possible', t => {

      t.true ( t.context.F.isDoable ( 'toA' ) );
      t.true ( t.context.F.isDoable ( 'toB' ) );
      t.true ( t.context.F.isDoable ( 'toC' ) );
      t.false ( t.context.F.isDoable ( 'toC2' ) );

    });

  });

  describe ( 'do', it => {

    it ( 'Is an alias for transition', t => {

      const res = {};

      t.context.F.transition = callSpy ( t.context.F.transition, res );

      t.context.F.do ( 'toB', 1, 2, 3 );

      t.true ( res.called );
      t.deepEqual ( res.arguments, ['toB', 1, 2, 3] );

    });

  });

  describe ( 'transition', it => {

    it ( 'Changes state following a transition', t => {

      t.context.F.transition ( 'toB' );

      t.is ( t.context.F.get (), 'b' );

      t.context.F.transition ( 'toB2' );

      t.is ( t.context.F.get (), 'b2' );

      t.context.F.transition ( 'toB' );

      t.is ( t.context.F.get (), 'b' );

      t.context.F.transition ( 'toC' );

      t.is ( t.context.F.get (), 'c' );

    });

    it ( 'Throws an error for invalid transitions', t => {

      t.throws ( () => t.context.F.transition ( 'toZ' ), /Invalid transition/ );

    });

    it ( 'Passes all the provided arguments to the transition function', t => {

      t.context.F.transition ( 'toB' );

      t.context.F.transition ( 'toB2', 0, 1, 2, 3 );

      t.deepEqual ( _.range ( 4 ), t.context.F.model.getTemp2 () );

    });

    it ( 'Calls prevStateExit (if defined), transition, nextStateEnter (if defined)', t => {

      t.context.F.transition ( 'toB' );

      t.deepEqual ( t.context.F.model.getTemp (), [0, 1, 2] );

      t.context.F.transition ( 'toC' );

      t.deepEqual ( t.context.F.model.getTemp (), [0, 1, 2, 3] );

    });

    it ( 'Doesn\'t call enter/exit callbacks if we transitioning to the same state', t => {

      t.context.F.transition ( 'toA' );

      t.deepEqual ( t.context.F.model.getTemp (), [0] );

    });

    it ( 'Queues transitions -- it\'s possible to trigger a transition from another transition function', t => {

      t.context.F.model.constructor.prototype.toBC = function () {

        this.toB ();

        t.context.F.transition ( 'toC' );

      };

      t.context.F.transition ( 'toBC' );

      t.deepEqual ( t.context.F.model.getTemp (), [0, 1, 2, 3] );
      t.is ( t.context.F.get (), 'c' );

    });

    it ( 'Checks guard conditions before evaluating a transition', t => {

      t.context.F.transition ( 'toC' );

      t.is ( t.context.F.get (), 'c' );

      t.context.F.set ( 'a' );

      t.throws ( () => t.context.F.transition ( 'toC2' ), /Invalid transition/ );

    });

    it ( 'Can check guards on sub objects', t => {

      t.context.F.transition ( 'toSubTrue' );

      t.is ( t.context.F.get (), initialState );

      t.throws ( () => t.context.F.transition ( 'toSubFalse' ), /Invalid transition/ );

    });

    it ( 'Throws an error for invalid guards', t => {

      t.throws ( () => t.context.F.transition ( 'toInvalid' ), /Invalid guard/ )

    });

    it ( 'Support `*` transitions that always point to the current state', t => {

      t.context.F.transition ( 'toStar' );

      t.is ( t.context.F.get (), initialState );

    });

  });

  describe ( '_exit', it => {

    it ( 'Calls the exit state handler of the state', t => {

      const res = {};

      t.context.M.aExit = callSpy ( t.context.M.aExit, res );

      t.context.F._exit ( 'a' );

      t.true ( res.called );

    });

  });

  describe ( '_enter', it => {

    it ( 'Calls the enter state handler of the state, sets the state', t => {

      const res = {};

      t.context.M.bEnter = callSpy ( t.context.M.bEnter, res );

      t.not ( 'b', t.context.F.get () );

      t.context.F._enter ( 'b' );

      t.is ( t.context.F.get (), 'b' );
      t.true ( res.called );

    });

  });

});
