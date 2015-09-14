import encapsulate from '../src/encapsulate';
import test from 'unit.js';
var assert = test.assert;

describe("encapsulate", () => {
    it("C3 Linearization test", () => {
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

    describe("Basic tests", () => {

        it("Object trait", () => {
            const trait = {
                      prop: 1
                  },
                  instantiator = encapsulate(trait),
                  instance = instantiator();
            test.function(instantiator)
                .bool(instantiator.isEncapsulateInstantiator).isTrue()
                .function(instance)
                .bool(instance.isEncapsulateInstance).isTrue()
                .number(instance.prop).is(1);
        });

        it("Function trait", () => {
            const trait = () => { return {
                      prop: 1 };
                  },
                  instantiator = encapsulate(trait),
                  instance = instantiator();
            test.function(instantiator)
                .bool(instantiator.isEncapsulateInstantiator).isTrue()
                .function(instance)
                .bool(instance.isEncapsulateInstance).isTrue()
                .number(instance.prop).is(1);
        });

        it("Multiple object traits", () => {
            const traitA = {
                      propertyA: 1,
                      methodA: function () {
                          return this.propertyA;
                      },
                      methodZ: function () {
                          return "A";
                      }
                  },
                  traitB = {
                      propertyB: 2,
                      methodB: function () {
                          return this.propertyB;
                      },
                      methodZ: function () {
                          return "B";
                      }
                  },
                  instantiator = encapsulate(traitA, traitB),
                  instance = instantiator();
            test.number(instance.propertyA).is(1)
                .function(instance.methodA)
                .number(instance.methodA()).is(1)
                .number(instance.propertyB).is(2)
                .function(instance.methodB)
                .number(instance.methodB()).is(2)
                .function(instance.methodZ)
                .string(instance.methodZ()).is("B");
        });

        it("Multiple function traits", () => {
            const traitA = function () {
                    return {
                        propertyA: 1,
                        methodA: function () {
                            return this.propertyA;
                        },
                        methodZ: function () {
                            return "A";
                        }
                    };
                },
                traitB = function () {
                    return {
                        propertyB: 2,
                        methodB: function () {
                            return this.propertyB;
                        },
                        methodZ: function () {
                            return "B";
                        }
                    };
                  },
                  instantiator = encapsulate(traitA, traitB),
                  instance = instantiator();
            test.number(instance.propertyA).is(1)
                .function(instance.methodA)
                .number(instance.methodA()).is(1)
                .number(instance.propertyB).is(2)
                .function(instance.methodB)
                .number(instance.methodB()).is(2)
                .function(instance.methodZ)
                .string(instance.methodZ()).is("B");
        });
    });

    describe("Inheritance tests", () => {
        it("Object trait inheritance", () => {
            const instantiatorA = encapsulate({
                      propertyA: 1,
                      methodA: function () {
                          return this.propertyA;
                      },
                      methodZ: function () {
                          return "A";
                      }
                  }),
                  instantiatorB = encapsulate(instantiatorA)({
                      propertyB: 2,
                      methodB: function () {
                          return this.propertyB;
                      },
                      methodZ: function self() {
                          return "B" + self.super();
                      }
                  }),
                  instantiatorC = encapsulate(instantiatorB)({
                      propertyC: 3,
                      methodC: function () {
                          return this.propertyC;
                      },
                      methodZ: function self() {
                          return self.super() + "C";
                      }
                  }),
                  instanceA = instantiatorA(),
                  instanceB = instantiatorB(),
                  instanceC = instantiatorC();
            test.bool(instanceA.instanceOf(instantiatorA)).isTrue()
                .number(instanceA.propertyA).is(1)
                .number(instanceA.methodA()).is(1)
                .string(instanceA.methodZ()).is("A");

            test.bool(instanceB.instanceOf(instantiatorB)).isTrue()
                .bool(instanceB.instanceOf(instantiatorA)).isTrue()
                .number(instanceB.propertyA).is(1)
                .number(instanceB.propertyB).is(2)
                .number(instanceB.methodA()).is(1)
                .number(instanceB.methodB()).is(2)
                .string(instanceB.methodZ()).is("BA");

            test.bool(instanceC.instanceOf(instantiatorC)).isTrue()
                .bool(instanceC.instanceOf(instantiatorB)).isTrue()
                .bool(instanceC.instanceOf(instantiatorA)).isTrue()
                .number(instanceC.propertyA).is(1)
                .number(instanceC.propertyB).is(2)
                .number(instanceC.propertyC).is(3)
                .number(instanceC.methodA()).is(1)
                .number(instanceC.methodB()).is(2)
                .number(instanceC.methodC()).is(3)
                .string(instanceC.methodZ()).is("BAC");
        });
    });

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
