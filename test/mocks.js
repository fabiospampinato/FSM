
/* MOCKS */

class Model {
  constructor () {
    this.initTemp ();
    this.initTemp2 ();
    this.sub = {
      true: () => true,
      false: () => false
    };
  }
  toA () {
    this.temp.push ( 0 );
  }
  aExit () {
    this.temp.push ( 0 );
  }
  toB () {
    this.temp.push ( 1 );
  }
  // toBC implemented in tests
  bEnter () {
    this.temp.push ( 2 );
  }
  toB2 ( ...args ) {
    this.temp2 = args;
  }
  toC () {
    this.temp.push ( 3 );
  }
  initTemp () {
    this.temp = [];
  }
  getTemp () {
    return this.temp;
  }
  initTemp2 () {
    this.temp2 = [];
  }
  getTemp2 () {
    return this.temp2;
  }
  true () {
    return true;
  }
  false () {
    return false;
  }
};

const states = {
  a: {
    transitions: {
      toStar: '*',
      toInvalid: {
        state: 'a',
        guard: '!asd.asd!'
      },
      toSubTrue: {
        state: '*',
        guard: 'sub.true|!sub.false'
      },
      toSubFalse: {
        state: '*',
        guard: '!sub.true'
      },
      toA: 'a',
      toB: 'b',
      toBC: 'b',
      toC: {
        state: 'c',
        guard: 'true|!false'
      },
      toC2: {
        state: 'c',
        guard: 'false'
      }
    }
  },
  b: {
    transitions: {
      toB2: 'b2',
      toC: 'c'
    }
  },
  b2: {
    transitions: {
      toB: 'b'
    }
  },
  c: {}
};

const initialState = 'a';

/* EXPORT */

module.exports = {Model, states, initialState};
