var test = require("unit.js"),
    assert = test.assert;

describe("encapsulate", function () {
    var encapsulate = require(__dirname + "/../src/encapsulate.js");

    it("should be a function", function () {
        test.function(encapsulate);
    });

    describe("encapsulate({})", function () {
        var instantiator = encapsulate({});
        it("should produce a function", function () {
            test.function(instantiator);
        });
        it("with the property `isEncapsulateInstantiator` having the value `true`", function () {
            test.bool(instantiator.isEncapsulateInstantiator).isTrue();
        });
    });

    describe("encapsulate", function () {
        it("should pass the C3 Linearization test", function () {
            var O =  encapsulate({}),
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

});
