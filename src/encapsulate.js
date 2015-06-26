(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(
            ["lodash/lang/clone", "lodash/object/assign", "lodash/collection/map", "lodash/collection/forEach", "lodash/array/slice"],
            factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(
            require("lodash/lang/clone"),
            require("lodash/object/assign"),
            require("lodash/collection/map"),
            require("lodash/collection/forEach"),
            require("lodash/array/slice")
        );
    } else {
        // Browser globals (root is window)
        if (typeof _ == "undefined") throw "_ not defined in global namespace";
        root.encapsulate = factory(_.clone, _.assign, _.map, _.forEach, _.slice);
    }
}(this, function (clone, assign, map, forEach, slice) {
    /**
     *
     * @param membersGenerator
     */
    function bindMembers(membersGenerator) {
        assign(this, membersGenerator());
        //TODO: Bind members (including getters & setters)
    }

    /**
     *
     * @param {Array} memberGenerators
     * @param {Array} [bases=[]]
     * @returns {Function}
     */
    function generateInstantiator(memberGenerators, bases) {
        var bases = bases || [],
            instantiator = function () {
                var args = slice(arguments),
                    instance = function () {
                        //TODO: Handle mixins return a new instance of the object with input mixins applied
                        throw "NotImplemented";
                    };
                Object.defineProperties(instance, {
                    isEncapsulateInstance: {
                        value: true
                    },
                    instanceOf: {
                        value: function (target) {
                            //TODO: Implement instanceOf check to determine of instance is an instance of target or one of its bases
                            throw "NotImplemented";
                        }
                    }
                });
                forEach(memberGenerators, bindMembers, instance);
                if(typeof instance.__init__ == "function") instance.__init__.apply(instance, arguments);
                return instance;
        };

        Object.defineProperties(instantiator, {
            __bases__: {
                get: function () {
                    return slice(bases);
                }
            },
            isEncapsulateInstantiator: {
                value: true
            },
            extends: {
                value: function () {
                    forEach(arguments, function (base) {
                        if (!base.isEncapsulateInstantiator) throw base + " is not an Encapsulate Instantiator";
                    });
                    return generateInstantiator(memberGenerators, arguments);
                }
            }
        });
        return instantiator;

    }

    /**
     *
     * @param membersOrMembersGeneratorOrInstantiator
     * @returns {Function}
     */
    function encapsulate(membersOrMembersGeneratorOrInstantiator) {
        var args = arguments;

        function parentAccumulator(membersOrMembersGeneratorOrInstantiator) {
            if (membersOrMembersGeneratorOrInstantiator.isEncapsulateInstantiator) {
                args.push.apply(args, arguments);
                return parentAccumulator;
            } else {
                var instantiator = encapsulate.apply(this, arguments);
                return instantiator.extends.apply(instantiator, args);
            }
        }

        if (typeof membersOrMembersGeneratorOrInstantiator == "undefined") throw "encapsulate requires parameters!";

        if (membersOrMembersGeneratorOrInstantiator.isEncapsulateInstantiator) {
            return parentAccumulator;
        } else return generateInstantiator(map(args, function (argument) {
            if (typeof argument == "function" && !argument.isEncapsulateInstantiator) return argument;
            else if (typeof argument == "object") return function () {
                return clone(argument, true);
            };
            throw "Unsupported argument type";
        }));
    }

    return encapsulate;
}));

