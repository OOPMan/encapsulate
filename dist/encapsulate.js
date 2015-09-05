(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports', 'module', 'lodash/array/slice', 'lodash/array/first', 'lodash/array/rest', 'lodash/array/without', 'lodash/array/flatten', 'lodash/collection/map', 'lodash/collection/forEach', 'lodash/collection/forEachRight', 'lodash/collection/includes', 'lodash/collection/reduce', 'lodash/collection/reject', 'lodash/collection/some', 'lodash/lang/clone', 'lodash/lang/isFunction', 'lodash/lang/isPlainObject', 'lodash/object/assign', 'lodash/object/pick', 'lodash/object/omit'], factory);
    } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        factory(exports, module, require('lodash/array/slice'), require('lodash/array/first'), require('lodash/array/rest'), require('lodash/array/without'), require('lodash/array/flatten'), require('lodash/collection/map'), require('lodash/collection/forEach'), require('lodash/collection/forEachRight'), require('lodash/collection/includes'), require('lodash/collection/reduce'), require('lodash/collection/reject'), require('lodash/collection/some'), require('lodash/lang/clone'), require('lodash/lang/isFunction'), require('lodash/lang/isPlainObject'), require('lodash/object/assign'), require('lodash/object/pick'), require('lodash/object/omit'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, mod, global.slice, global.first, global.rest, global.without, global.flatten, global.map, global.forEach, global.forEachRight, global.includes, global.reduce, global.reject, global.some, global.clone, global.isFunction, global.isPlainObject, global.assign, global.pick, global.omit);
        global.encapsulate = mod.exports;
    }
})(this, function (exports, module, _lodashArraySlice, _lodashArrayFirst, _lodashArrayRest, _lodashArrayWithout, _lodashArrayFlatten, _lodashCollectionMap, _lodashCollectionForEach, _lodashCollectionForEachRight, _lodashCollectionIncludes, _lodashCollectionReduce, _lodashCollectionReject, _lodashCollectionSome, _lodashLangClone, _lodashLangIsFunction, _lodashLangIsPlainObject, _lodashObjectAssign, _lodashObjectPick, _lodashObjectOmit) {
    'use strict';

    module.exports = encapsulate;

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

    var _slice = _interopRequireDefault(_lodashArraySlice);

    var _first = _interopRequireDefault(_lodashArrayFirst);

    var _rest = _interopRequireDefault(_lodashArrayRest);

    var _without = _interopRequireDefault(_lodashArrayWithout);

    var _flatten = _interopRequireDefault(_lodashArrayFlatten);

    var _map = _interopRequireDefault(_lodashCollectionMap);

    var _forEach = _interopRequireDefault(_lodashCollectionForEach);

    var _forEachRight = _interopRequireDefault(_lodashCollectionForEachRight);

    var _includes = _interopRequireDefault(_lodashCollectionIncludes);

    var _reduce = _interopRequireDefault(_lodashCollectionReduce);

    var _reject = _interopRequireDefault(_lodashCollectionReject);

    var _some = _interopRequireDefault(_lodashCollectionSome);

    var _clone = _interopRequireDefault(_lodashLangClone);

    var _isFunction = _interopRequireDefault(_lodashLangIsFunction);

    var _isPlainObject = _interopRequireDefault(_lodashLangIsPlainObject);

    var _assign = _interopRequireDefault(_lodashObjectAssign);

    var _pick = _interopRequireDefault(_lodashObjectPick);

    var _omit = _interopRequireDefault(_lodashObjectOmit);

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
    function remove(value, lists) {
        return (0, _reject['default'])((0, _map['default'])(lists, function (list) {
            return (0, _without['default'])(list, value);
        }), { length: 0 });
    }

    function headNotInTails() {
        for (var _len = arguments.length, listOfLists = Array(_len), _key = 0; _key < _len; _key++) {
            listOfLists[_key] = arguments[_key];
        }

        var heads = (0, _map['default'])(listOfLists, _first['default']),
            tails = (0, _flatten['default'])((0, _map['default'])(listOfLists, _rest['default']));
        return (0, _reduce['default'])(heads, function (selectedHead, head) {
            if (selectedHead !== null) return selectedHead;
            if ((0, _includes['default'])(tails, head)) return null;
            return head;
        }, null);
    }

    function mergeLinearizations() {
        for (var _len2 = arguments.length, linearizations = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            linearizations[_key2] = arguments[_key2];
        }

        var args = (0, _slice['default'])(linearizations),
            head = headNotInTails.apply(undefined, _toConsumableArray(args)),
            filteredArgs = head ? remove(head, args) : null;
        if (head) {
            if (filteredArgs.length === 0) return [head];
            return [head].concat(_toConsumableArray(mergeLinearizations.apply(undefined, _toConsumableArray(filteredArgs))));
        }
        throw 'No Linearization possible';
    }

    function linearize(instantiator) {
        if (instantiator.__bases__.length === 0) return [instantiator];else if (instantiator.__mro__.length > 0) return instantiator.__mro__;
        return [instantiator].concat(_toConsumableArray(mergeLinearizations.apply(undefined, [].concat(_toConsumableArray((0, _map['default'])(instantiator.__bases__, linearize)), [instantiator.__bases__]))));
    }

    /*
    End C3 Linearization implementation
    */

    /**
     *
     * @param {Object|Function} traitOrInstantiator
     * @returns {Function}
     */
    function generateInstantiator(traits) {
        var bases = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        var mro = [],
            instantiator = function instantiator() {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            var instance = function instance() {
                if ((0, _isFunction['default'])(instance.__call__)) return instance.__call__.apply(instance, arguments);
                throw 'NotImplemented';
            };
            Object.defineProperties(instance, {
                __id__: { value: 'encapsulateInstance' + instanceCount++ },
                isEncapsulateInstance: { value: true },
                instanceOf: {
                    value: function value(traitOrInstantiator) {
                        if (traitOrInstantiator.isEncapsulateInstantiator) return (0, _includes['default'])(instantiator.__mro__, traitOrInstantiator);else if ((0, _isFunction['default'])(traitOrInstantiator) || (0, _isPlainObject['default'])(_isPlainObject['default'])) {
                            return (0, _includes['default'])((0, _flatten['default'])((0, _map['default'])(instantiator.__bases__, function (base) {
                                return base.__traits__;
                            })), traitOrInstantiator);
                        }
                        throw 'Unsupported argument type. Argument must be a Plain Object, Function or Encapsulate Instantiator';
                    }
                }
            });
            // Bind Members
            (0, _forEachRight['default'])(instantiator.__mro__, function (instantiator) {
                var members = (0, _reduce['default'])(instantiator.__traits__, function (members, trait) {
                    if ((0, _isFunction['default'])(trait)) return (0, _assign['default'])(members, trait.apply(instance, args));
                    if ((0, _isPlainObject['default'])(trait)) return (0, _assign['default'])(members, (0, _clone['default'])(trait, true));
                    throw 'Traits must be either Plain Objects or Functions';
                }, {}),
                    functionMembers = (0, _pick['default'])(members, _isFunction['default']),
                    nonFunctionMembers = (0, _omit['default'])(members, _isFunction['default']);
                (0, _assign['default'])(instance, nonFunctionMembers);
                (0, _forEach['default'])(functionMembers, function (functionMember, functionName) {
                    if ((0, _isFunction['default'])(instance[functionName])) {
                        functionMember['super'] = instance[functionName].bind(instance);
                    }
                    instance[functionName] = functionMember;
                });
            });
            // Call constructor
            if (typeof instance.__init__ == "function") instance.__init__.apply(instance, args);
            return instance;
        };

        Object.defineProperties(instantiator, {
            __id__: { value: 'encapsulateInstantiator' + instantiatorCount++ },
            __bases__: { get: function get() {
                    return (0, _slice['default'])(bases);
                } },
            __traits__: { get: function get() {
                    return (0, _slice['default'])(traits);
                } },
            __mro__: { get: function get() {
                    return (0, _slice['default'])(mro);
                } },
            isEncapsulateInstantiator: { value: true },
            'extends': {
                value: function value() {
                    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                        args[_key4] = arguments[_key4];
                    }

                    var args = (0, _slice['default'])(args);
                    if ((0, _some['default'])(args, function (arg) {
                        return !arg.isEncapsulateInstantiator;
                    })) {
                        throw 'Unsupported argument type. Arguments must be Encapsulate Instantiator';
                    }
                    return generateInstantiator(traits, args);
                }
            }
        });
        mro.push.apply(mro, _toConsumableArray(linearize(instantiator)));
        return instantiator;
    }

    /**
     *
     * @param {Object|Function} traitOrInstantiator
     * @returns {Function}
     */

    function encapsulate(traitOrInstantiator) {
        var args = (0, _slice['default'])(arguments);

        function parentAccumulator(traitOrInstantiator) {
            var accumulatorArgs = (0, _slice['default'])(arguments);
            if (traitOrInstantiator.isEncapsulateInstantiator) {
                args.push.apply(args, _toConsumableArray(accumulatorArgs));
                //TODO: This needs to return a new parentAccumulator in order to make this a non-mutating operation
                return parentAccumulator;
            } else {
                var instantiator = encapsulate.apply(undefined, _toConsumableArray(accumulatorArgs));
                return instantiator['extends'].apply(instantiator, _toConsumableArray(args));
            }
        }

        if (typeof traitOrInstantiator == "undefined") throw "encapsulate requires parameters!";else if ((0, _some['default'])(args, function (arg) {
            return !(0, _isFunction['default'])(arg) && !(0, _isPlainObject['default'])(arg);
        })) {
            throw "Unsupported argument type. Arguments must be either Plain Objects or Functions";
        }

        if (traitOrInstantiator.isEncapsulateInstantiator) return parentAccumulator;
        return generateInstantiator(args);
    }
});
