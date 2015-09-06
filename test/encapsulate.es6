import encapsulate from '../src/encapsulate';
import test from 'unit.js';
var assert = test.assert;

describe("encapsulate", () => {
    it("should be a function", () => { test.function(encapsulate) });

    describe("encapsulate({})", () => {
        var instantiator = encapsulate({});
        it("should produce a function",
            () => { test.function(instantiator) });
        it("with the property `isEncapsulateInstantiator` having the value `true`",
            () => { test.bool(instantiator.isEncapsulateInstantiator).isTrue() });
    });

    describe("encapsulate(() => { return {}; })", () => {
        var instantiator = encapsulate(() => { return {}; });
        it("should produce a function",
            () => { test.function(instantiator) });
        it("with the property `isEncapsulateInstantiator` having the value `true`",
            () => { test.bool(instantiator.isEncapsulateInstantiator).isTrue() });
    });

    describe("encapsulate", () => {
        it("should pass the C3 Linearization test", () => {
            const O =  encapsulate({}),
                  A =  encapsulate(O)({}),
                  B =  encapsulate(O)({}),
                  C =  encapsulate(O)({}),
                  D =  encapsulate(O)({}),
                  E =  encapsulate(O)({}),
                  K1 = encapsulate(A, B, C)({}),
                  K2 = encapsulate(D, B, E)({}),
                  K3 = encapsulate(D, A)({}),
                  Z =  encapsulate(K1, K2, K3)({});
            test.array(Z.__mro__).is([Z, K1, K2, K3, D, A, B, C, E, O]);
        });
    });

    describe(
        "var A = encapsulate({" +
        " x: 0," +
        " y: () => {" +
        " return this.x;" +
        " }" +
        "})",
        () => {
            var A = encapsulate({
                        x: 0,
                        y: function () {
                            return this.x;
                        }
                    });
            it("should produce a function",
                () => { test.function(A) });
            it("with the property `isEncapsulateInstantiator` having the value `true`",
                () => { test.bool(A.isEncapsulateInstantiator).isTrue() });
            describe("var a = A()", () => {
                var a = A();
                it("should produce an instance of A",
                    () => { test.bool(a.instanceOf(A)).isTrue() });
                describe("a.x", () => {
                    it("should equal 0",
                        () => { test.number(a.x).isIdenticalTo(0) });
                });
                describe("a.y", () => {
                    it("is a function",
                        () => { test.function(a.y) });
                    it("should return 0 when called",
                        () => { test.number(a.y()).isIdenticalTo(0) });
                });
            });
    });

    var CarTrait = () => {
            var speed = 0;
            return {
                getSpeed: () => {
                    return speed;
                },
                drive: () => {
                    speed = 100;
                }
            };
        },
        TimeMachineTrait = () => {
            var location = "now";
            return {
                when: () => {
                    return location;
                },
                warpTo: function(dateTime) {
                    location = dateTime;
                }
            };
        },
        Car = encapsulate(CarTrait),
        Honda = encapsulate(Car)({
            drive: function f() {
                f.super();
            }
        }),
        Delorean = encapsulate(CarTrait, TimeMachineTrait);
    describe("var myHonda = Honda()", () => {
        var myHonda = Honda();
        describe("myHonda", () => {
            it("is an instance of Car",
                () => { test.bool(myHonda.instanceOf(Car)).isTrue() });
            it("has the CarTrait",
                () => { test.bool(myHonda.instanceOf(CarTrait)).isTrue() });
            it("can drive to 100", () => {
                myHonda.drive();
                test.number(myHonda.getSpeed()).isIdenticalTo(100);
            });
        });

    });
});
