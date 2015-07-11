(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(
            ["lodash/lang/clone", "lodash/object/assign", "lodash/collection/map", "lodash/collection/forEach",
             "lodash/collection/includes", "lodash/collection/reduce", "lodash/collection/reject", "lodash/array/slice",
             "lodash/array/first", "lodash/array/rest", "lodash/array/without", "lodash/array/flatten"],
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
            require("lodash/collection/includes"),
            require("lodash/collection/reduce"),
            require("lodash/collection/reject"),
            require("lodash/array/slice"),
            require("lodash/array/first"),
            require("lodash/array/rest"),
            require("lodash/array/without"),
            require("lodash/array/flatten")
        );
    } else {
        // Browser globals (root is window)
        if (typeof _ == "undefined") throw "_ not defined in global namespace";
        root.encapsulate = factory(
            _.clone, _.assign, _.map, _.forEach, _.includes, _.reduce, _.reject, _.slice, _.first, _.rest, _.without, _.flatten
        );
    }
}(this, function (clone, assign, map, forEach, includes, reduce, reject, slice, first, rest, without, flatten) {
    var instantiatorCount = 0,
        instanceCount = 0;

    /**
     *
     * @param {*} value
     * @param {Array[Array]} lists
     * @returns {Array[Array]}
     */
    function remove(value, lists) {
        return reject(
            map(lists, function (list) {
                return without(list, value);
            }),
            {
                length: 0
            });
    }

    function headNotInTails() {
        var heads = map(arguments, first),
            tails = flatten(map(arguments, rest));
        return reduce(heads, function (selectedHead, head) {
            if (selectedHead !== null) return selectedHead;
            if (includes(tails, head)) return null;
            return head;
        }, null);
    }

    function merge() {
        var args = slice(arguments),
            head = headNotInTails.apply(this, args),
            filteredArgs = head ? remove(head, args) : null;
        if (head) {
            if (filteredArgs.length == 0) return [head];
            return [head].concat(merge.apply(this, filteredArgs));
        }
        throw "No linearization possible";
    }

    function linearize(instantiator) {
        if (instantiator.__bases__.length == 0) return [instantiator];
        return [instantiator].concat(merge.apply(this, map(instantiator.__bases__, linearize).concat([instantiator.__bases__])));
    }

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
                    __id__: {
                        value: "encapsulateInstance" + instanceCount++
                    },
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
                //TODO: Replace naive bind members with inheritance aware form
                forEach(memberGenerators, bindMembers, instance);
                if(typeof instance.__init__ == "function") instance.__init__.apply(instance, arguments);
                return instance;
        };

        Object.defineProperties(instantiator, {
            __id__: {
                value: "encapsulateInstantiator" + instantiatorCount++
            },
            __bases__: {
                get: function () {
                    return slice(bases);
                }
            },
            __members__: {
                get: function () {
                    return slice(memberGenerators);
                }
            },
            isEncapsulateInstantiator: {
                value: true
            },
            extends: {
                value: function () {
                    var args = slice(arguments);
                    forEach(args, function (base) {
                        if (!base.isEncapsulateInstantiator) throw base + " is not an Encapsulate Instantiator";
                    });
                    return generateInstantiator(memberGenerators, args);
                }
            }
        });
        Object.defineProperty(instantiator, "__mro__", {
            value: linearize(instantiator)
        });
        return instantiator;
    }

    /**
     *
     * @param membersOrMembersGeneratorOrInstantiator
     * @returns {Function}
     */
    function encapsulate(membersOrMembersGeneratorOrInstantiator) {
        var args = slice(arguments);

        function parentAccumulator(membersOrMembersGeneratorOrInstantiator) {
            var arguments = slice(arguments);
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
    Object.defineProperties(encapsulate, {
        namespace: {
            value: function (name, membersGenerator) {
                function namespacedMembersGenerator() {
                    return membersGenerator();
                }
                Object.defineProperties(namespacedMembersGenerator, {
                    isEncapsulateNamespace: {
                        value: true
                    },
                    namespace: {
                        value: name
                    }
                });
                return namespacedMembersGenerator;
            }
        },
        property: {
            value: function (getterOrGetterAndSetter, setter) {
                return typeof setter == "undefined" ?
                    {
                        get: getterOrGetterAndSetter,
                        set: getterOrGetterAndSetter
                    } : {
                        get: getterOrGetterAndSetter,
                        set: setter
                    };
            }
        },
        readOnlyProperty: {
            value: function (getter) {
                return {
                    get: getter
                };
            }
        }
    });
    return encapsulate;
}));

