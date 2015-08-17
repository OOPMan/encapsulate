(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(
            ["lodash/lang/clone", "lodash/lang/isFunction", "lodash/lang/isPlainObject", "lodash/object/assign",
             "lodash/object/pick", "lodash/object/omit", "lodash/collection/map",
             "lodash/collection/forEach", "lodash/collection/forEachRight",
             "lodash/collection/includes", "lodash/collection/reduce",
             "lodash/collection/reject", "lodash/collection/some", "lodash/array/slice", "lodash/array/first",
             "lodash/array/rest", "lodash/array/without", "lodash/array/flatten"],
            factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(
            require("lodash/lang/clone"),
            require("lodash/lang/isFunction"),
            require("lodash/lang/isPlainObject"),
            require("lodash/object/assign"),
            require("lodash/object/pick"),
            require("lodash/object/omit"),
            require("lodash/collection/map"),
            require("lodash/collection/forEach"),
            require("lodash/collection/forEachRight"),
            require("lodash/collection/includes"),
            require("lodash/collection/reduce"),
            require("lodash/collection/reject"),
            require("lodash/collection/some"),
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
            _.clone, _.isFunction, _.isPlainObject, _.assign, _.pick, _.omit, _.map, _.forEach,
            _.forEachRight, _.includes, _.reduce, _.reject, _.some, _.slice, _.first,
            _.rest, _.without, _.flatten
        );
    }
}(this, function (clone, isFunction, isPlainObject, assign, pick, omit, map, forEach, forEachRight,
                  includes, reduce, reject, some, slice, first, rest, without, flatten) {
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
     *
     * @param {Array} traits
     * @param {Array} [bases=[]]
     * @returns {Function}
     */
    function generateInstantiator(traits, bases) {
        var bases = bases || [],
            mro = [],
            instantiator = function () {
                var args = slice(arguments),
                    instance = function () {
                        if (isFunction(instance.__call__)) return instance.__call__.apply(instance, arguments);
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
                        value: function (traitOrInstantiator) {
                            if (traitOrInstantiator.isEncapsulateInstantiator) return includes(instantiator.__mro__, traitOrInstantiator);
                            else if (isFunction(traitOrInstantiator) || isPlainObject(isPlainObject)) {
                                //TODO: Implement instanceOf checking for Traits
                            }
                            throw "Unsupported argument type. Argument must be a Plain Object, Function or Encapsulate Instantiator";
                        }
                    }
                });
                // Bind Members
                forEachRight(instantiator.__mro__, function (instantiator) {
                    var members = reduce(
                            instantiator.__traits__,
                            function (members, trait) {
                                if (isFunction(trait)) return assign(members, trait.apply(instance, args));
                                if (isPlainObject(trait)) return assign(members, clone(trait, true));
                                throw "Traits must be either Plain Objects or Functions";
                            },
                            {}),
                        functionMembers = pick(members, isFunction),
                        nonFunctionMembers = omit(members, isFunction);
                    assign(instance, nonFunctionMembers);
                    forEach(functionMembers, function (functionMember, functionName) {
                        if (isFunction(instance[functionName])) {
                            functionMember.super = instance[functionName].bind(instance);
                        }
                        instance[functionName] = functionMember;
                    });
                });
                // Call constructor
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
            __traits__: {
                get: function () {
                    return slice(traits);
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
                    if (some(args, function (arg) { return !arg.isEncapsulateInstantiator; })) {
                        throw "Unsupported argument type. Arguments must be Encapsulate Instantiator";
                    }
                    return generateInstantiator(traits, args);
                }
            }
        });
        mro.push.apply(mro, linearize(instantiator));
        return instantiator;
    }

    /**
     *
     * @param {Object|Function} traitOrInstantiator
     * @returns {Function}
     */
    function encapsulate(traitOrInstantiator) {
        var args = slice(arguments);

        function parentAccumulator(traitOrInstantiator) {
            var arguments = slice(arguments);
            if (traitOrInstantiator.isEncapsulateInstantiator) {
                args.push.apply(args, arguments);
                //TODO: This needs to return a new parentAccumulator in order to make this a non-mutating operation
                return parentAccumulator;
            } else {
                var instantiator = encapsulate.apply(this, arguments);
                return instantiator.extends.apply(instantiator, args);
            }
        }

        if (typeof traitOrInstantiator == "undefined")
            throw "encapsulate requires parameters!";
        else if (some(args, function (arg) { return !isFunction(arg) && !isPlainObject(arg); })) {
            throw "Unsupported argument type. Arguments must be either Plain Objects or Functions";
        }

        if (traitOrInstantiator.isEncapsulateInstantiator) {
            return parentAccumulator;
        } else return generateInstantiator(args);
    }

    return encapsulate;
}));

