
/* TYPES */

type guard = string;
type model = any;
type state = string;
type states = state[];
type transition = string;

type transitionObj = state | {
  state: state,
  guard?: guard
};
type stateObj = {
  transitions?: any,
  states?: any
};
type statesObj = any;

/* EXPORT */

export {guard, model, state, states, transition, transitionObj, stateObj, statesObj};
