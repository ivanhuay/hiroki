'use strict';
let instance;
class Test {

    constructor() {
        if(!instance) {
            instance = this;
        }
        return instance;
    }
    set a(val) {
        this._a = val;
    }
    get a() {
        return this._a;
    }
}


let example = new Test();

example.a = 123;
console.log('example.a: ', example.a);

let example2 = new Test();

console.log('example2.a: ', example2.a);
