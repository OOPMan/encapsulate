(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["lodash/object/assign"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("lodash/object/assign"));
    } else {
        // Browser globals (root is window)
        if (typeof _ == "undefined") throw "_ not defined in global namespace";
        root.encapsulate = factory(_.assign);
    }
}(this, function (assign) {
    /**
     *
     * @param membersGenerator
     * @param [parent]
     */
    function generateInstantiator(membersGenerator, parent) {

    }

    return function (membersOrMembersGenerator) {
        var membersGenerator = typeof membersOrMembersGenerator == "function" ? membersOrMembersGenerator : function () { return membersOrMembersGenerator;},
            instantiator = function () {
                //TODO: Implement constructor system
                var instance = function () {
                    //TODO: Implement mix-in system
                };
                return assign(instance, membersGenerator());
            };
        instantiator.extends = function (parent) {
            //TODO: Implement inheritance system
        };
        instantiator.extendWidth = function (child) {

        };
        return instantiator;
    }
}));

