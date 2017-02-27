declare type guard = string;
declare type model = any;
declare type state = string;
declare type states = state[];
declare type transition = string;
declare type transitionObj = state | {
    state: state;
    guard?: guard;
};
declare type stateObj = {
    transitions?: any;
    states?: any;
};
declare type statesObj = any;
export { guard, model, state, states, transition, transitionObj, stateObj, statesObj };
