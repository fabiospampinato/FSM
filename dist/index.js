/* IMPORT */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var fifo_1 = require("@fabiospampinato/fifo");
var lockable_1 = require("@fabiospampinato/lockable");
/* FSM */
//TODO: Add support for actions on submodules, like `history.start`: 'end'
//TODO: Add support for an `action` key on the transition object, that would be the executed action
var FSM = (function () {
    /* CONSTRUCTOR */
    function FSM(model, states, initial) {
        this.model = model;
        this.states = states;
        this.queue = new fifo_1.default();
        this.initial = initial;
        this.processing = new lockable_1.default();
        this.set(this.initial);
    }
    /* UTILITIES */
    FSM.prototype._isValidState = function (state) {
        return this.states.hasOwnProperty(state);
    };
    FSM.prototype._isValidTransition = function (state, transition) {
        return this._isValidState(state) && !!this._getTransitionState(state, transition) && this._isValidTransitionGuard(state, transition);
    };
    FSM.prototype._isValidTransitionGuard = function (state, transition) {
        var guards = this._getTransitionGuard(state, transition);
        if (!guards)
            return true;
        for (var _i = 0, _a = guards.split('|'); _i < _a.length; _i++) {
            var guard = _a[_i];
            var parts = guard.match(/^(!?)(\w+)(?:\.(\w+))?$/);
            if (!parts)
                throw new Error('[fsm] Invalid guard');
            var affirmative = (parts[1] !== '!'), method = _.compact(parts.slice(2)).join('.');
            if (!!this._callModel(method) !== affirmative)
                return false;
        }
        return true;
    };
    FSM.prototype._getTransition = function (state, transition) {
        var stateObj = this.states[state];
        if (!stateObj.hasOwnProperty('transitions'))
            return;
        return stateObj.transitions[transition];
    };
    FSM.prototype._getTransitionState = function (state, transition) {
        var transitionObj = this._getTransition(state, transition);
        if (_.isUndefined(transitionObj) || _.isString(transitionObj))
            return transitionObj;
        return transitionObj.state;
    };
    FSM.prototype._getTransitionGuard = function (state, transition) {
        var transitionObj = this._getTransition(state, transition);
        if (_.isUndefined(transitionObj) || _.isString(transitionObj))
            return;
        return transitionObj.guard;
    };
    FSM.prototype._getExistsEnters = function (prevState, nextState) {
        if (prevState === nextState)
            return [[], []];
        return [[prevState], [nextState]];
    };
    FSM.prototype._callModel = function (path, args) {
        if (args === void 0) { args = []; }
        var method = _.get(this.model, path);
        if (!_.isFunction(method))
            return;
        var context = _.includes(path, '.') ? _.get(this.model, path.split('.').slice(0, -1).join('.')) : this.model;
        return method.apply(context, args);
    };
    /* GET */
    FSM.prototype.get = function () {
        return this.state;
    };
    /* SET */
    FSM.prototype.set = function (state) {
        if (!this._isValidState(state))
            throw new Error("[fsm] Invalid state \"" + state + "\"");
        this.state = state;
        return this;
    };
    /* RESET */
    FSM.prototype.reset = function () {
        return this.set(this.initial);
    };
    /* IS */
    FSM.prototype.is = function (state) {
        return this.state === state;
    };
    FSM.prototype.isDoable = function (transition) {
        return this._isValidTransition(this.state, transition);
    };
    /* TRANSITION */
    FSM.prototype.do = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = this.transition).call.apply(_a, [this].concat(args));
        var _a;
    };
    FSM.prototype.transition = function (transition) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.queue.add([transition].concat(args));
        if (this.processing.isLocked())
            return this;
        this.processing.lock();
        while (true) {
            var next = this.queue.next();
            if (!next)
                break;
            this._transition.apply(this, next);
        }
        this.processing.unlock();
        return this;
    };
    FSM.prototype._transition = function (transition) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this.isDoable(transition))
            throw new Error("[fsm] Invalid transition \"" + transition + "\" from state \"" + this.state + "\"");
        var nextState = this._getTransitionState(this.state, transition);
        if (!nextState)
            throw new Error("[fsm] Invalid transition \"" + transition + "\" from state \"" + this.state + "\"");
        if (nextState === '*')
            nextState = this.state; // `*` states always point to the current state
        var _a = this._getExistsEnters(this.state, nextState), exits = _a[0], enters = _a[1];
        exits.forEach(this._exit.bind(this));
        this._callModel(transition, args);
        enters.forEach(this._enter.bind(this));
    };
    /* EVENTS */
    FSM.prototype._exit = function (state) {
        this._callModel(state + "Exit");
    };
    FSM.prototype._enter = function (state) {
        this.set(state);
        this._callModel(state + "Enter");
    };
    return FSM;
}());
/* EXPORT */
exports.default = FSM;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsWUFBWTs7O0FBRVosMEJBQTRCO0FBQzVCLDhDQUF5QztBQUN6QyxzREFBaUQ7QUFHakQsU0FBUztBQUVULDBFQUEwRTtBQUMxRSxtR0FBbUc7QUFFbkc7SUFXRSxpQkFBaUI7SUFFakIsYUFBYyxLQUFZLEVBQUUsTUFBaUIsRUFBRSxPQUFjO1FBRTNELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxjQUFJLEVBQUcsQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksa0JBQVEsRUFBRyxDQUFDO1FBRWxDLElBQUksQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDO0lBRTVCLENBQUM7SUFFRCxlQUFlO0lBRWYsMkJBQWEsR0FBYixVQUFnQixLQUFZO1FBRTFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBRyxLQUFLLENBQUUsQ0FBQztJQUU5QyxDQUFDO0lBRUQsZ0NBQWtCLEdBQWxCLFVBQXFCLEtBQVksRUFBRSxVQUFzQjtRQUV2RCxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBRyxLQUFLLENBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFHLEtBQUssRUFBRSxVQUFVLENBQUUsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUcsS0FBSyxFQUFFLFVBQVUsQ0FBRSxDQUFDO0lBRWhKLENBQUM7SUFFRCxxQ0FBdUIsR0FBdkIsVUFBMEIsS0FBWSxFQUFFLFVBQXNCO1FBRTVELElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FB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