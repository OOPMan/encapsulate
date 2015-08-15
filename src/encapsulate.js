(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(
            ["lodash/lang/clone", "lodash/lang/isFunction", "lodash/object/assign",
             "lodash/object/merge", "lodash/object/pick", "lodash/object/omit",
             "lodash/collection/map", "lodash/collection/forEach",
             "lodash/collection/forEachRight", "lodash/collection/includes",
             "lodash/collection/reduce", "lodash/collection/reject",
             "lodash/array/slice", "lodash/array/first", "lodash/array/rest",
             "lodash/array/without", "lodash/array/flatten"],
            factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(
            require("lodash/lang/clone"),
            require("lodash/lang/isFunction"),
            require("lodash/object/assign"),
            require("lodash/object/merge"),
            require("lodash/object/pick"),
            require("lodash/object/omit"),
            require("lodash/collection/map"),
            require("lodash/collection/forEach"),
            require("lodash/collection/forEachRight"),
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
            _.clone, _.isFunction, _.assign, _.merge, _.pick, _.omit, _.map,
            _.forEach, _.forEachRight, _.includes, _.reduce, _.reject, _.slice,
            _.first, _.rest, _.without, _.flatten
        );
    }
}(this, function (clone, isFunction, merge, assign, pick, omit, map, forEach,
                  forEachRight, includes, reduce, reject, slice, first, rest,
                  without, flatten) {
    var instantiatorCount = 0,
        instanceCount = 0;

    /*
     Begin C3 Linearization implementation.

     This version of C3 Linearization is based on the OCaml version implemented
     at https://xivilization.net/~marek/blog/2014/12/08/implementing-c3-linearization/

     The only difference here is that, similar to the C3 Implementation used in
     Ring.js (http://ringjs.neoname.eu/), the linearize function will attempt to
     use a pre-calculated linearization defined on a given item to be linearized
     in order to allow us to avoid re-calculating the linearization of items
     that have already been linearized.
     */
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

    function mergeLinearizations() {
        var args = slice(arguments),
            head = headNotInTails.apply(this, args),
            filteredArgs = head ? remove(head, args) : null;
        if (head) {
            if (filteredArgs.length == 0) return [head];
            return [head].concat(mergeLinearizations.apply(this, filteredArgs));
        }
        throw "No linearization possible";
    }

    function linearize(instantiator) {
        if (instantiator.__bases__.length == 0) return [instantiator];
        else if (instantiator.__mro__.length > 0) return instantiator.__mro__;
        return [instantiator].concat(
            mergeLinearizations.apply(
                this,
                map(instantiator.__bases__, linearize)
                    .concat([instantiator.__bases__])));
    }
    /*
     End C3 Linearization implementation
     */

    /**
     * Given an input instantiator function, performs generation of members
     * associated with the instantiator. The collected generated members are
     * then assigned to the this context the bindMembers function was called
     * with. Finally, property definition is handled.
     *
     * @param {Function} instantiator
     */
    function bindMembers(instantiator) {
    }

    /**
     *
     * @param {Array} memberGenerators
     * @param {Array} [bases=[]]
     * @returns {Function}
     */
    function generateInstantiator(memberGenerators, bases) {
        var bases = bases || [],
            mro = [],
            instantiator = function () {
                var args = slice(arguments),
                    instance = function () {
                        //TODO: Handle mixins return a new instance of the object
                        //TODO: with input mixins applied
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
                            return includes(instantiator.__mro__, target);
                        }
                    }
                });
                forEachRight(instantiator.__mro__, bindMembers, instance);
                if(typeof instance.__init__ == "function")
                    instance.__init__.apply(instance, args);
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
            __mro__: {
                get: function () {
                    return slice(mro);
                }
            },
            isEncapsulateInstantiator: {
                value: true
            },
            extends: {
                value: function () {
                    var args = slice(arguments);
                    forEach(args, function (base) {
                        if (!base.isEncapsulateInstantiator)
                            throw base + " is not an Encapsulate Instantiator";
                    });
                    return generateInstantiator(memberGenerators, args);
                }
            }
        });
        mro.push.apply(mro, linearize(instantiator));
        return instantiator;
    }

    function wrapMembersOrMembersGenerator(membersOrMembersGenerator) {
        if (typeof membersOrMembersGenerator == "function" && !membersOrMembersGenerator.isEncapsulateInstantiator)
            return membersOrMembersGenerator;
        else if (typeof membersOrMembersGenerator == "object") return function () {
            return clone(membersOrMembersGenerator, true);
        };
        throw "Unsupported argument type";
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

        if (typeof membersOrMembersGeneratorOrInstantiator == "undefined")
            throw "encapsulate requires parameters!";

        if (membersOrMembersGeneratorOrInstantiator.isEncapsulateInstantiator) {
            return parentAccumulator;
        } else return generateInstantiator(map(args, wrapMembersOrMembersGenerator));
    }

    Object.defineProperties(encapsulate, {
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

