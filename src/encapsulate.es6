import slice from 'lodash/array/slice';
import first from 'lodash/array/first';
import rest from 'lodash/array/rest';
import without from 'lodash/array/without';
import flatten from 'lodash/array/flatten';
import map from 'lodash/collection/map';
import forEach from 'lodash/collection/forEach';
import forEachRight from 'lodash/collection/forEachRight';
import includes from 'lodash/collection/includes';
import reduce from 'lodash/collection/reduce';
import reject from 'lodash/collection/reject';
import some from 'lodash/collection/some';
import clone from 'lodash/lang/clone';
import isFunction from 'lodash/lang/isFunction';
import isPlainObject from 'lodash/lang/isPlainObject';
import assign from 'lodash/object/assign';
import pick from 'lodash/object/pick';
import omit from 'lodash/object/omit';

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
    return reject(
        map(lists, list => without(list, value)),
        { length: 0 }
    );
}

function headNotInTails(...listOfLists) {
    const heads = map(listOfLists, first),
          tails = map(listOfLists, rest);
    return reduce(
        heads,
        (selectedHead, head) => {
            if (selectedHead !== null) return selectedHead;
            if (includes(tails, head)) return null;
            return head;
        },
        null
    );
}

function mergeLinearizations(...linearizations) {
    const args = slice(linearizations),
          head = headNotInTails(...args),
          filteredArgs = head ? remove(head, args) : null;
    if (head) {
        if (filteredArgs.length === 0) return [head];
        return [head, ...mergeLinearizations(...filteredArgs)];
    }
    throw 'No Linearization possible';
}

function linearize(instantiator) {
    if (instantiator.__bases__.length === 0) return [instantiator];
    else if (instantiator.__mro__.length > 0) return instantiator.__mro__;
    return [instantiator, ...mergeLinearizations(...[...map(instantiator.__bases__, linearize), instantiator.__bases__])];
}

/*
End C3 Linearization implementation
*/

/**
 *
 * @param {Object|Function} traitOrInstantiator
 * @returns {Function}
 */
function generateInstantiator(traits, bases = []) {
    var mro = [],
        instantiator = function (...args) {
            var instance = function (...args) {
                if (isFunction(instance.__call__)) return instance.__call__(...args);
                throw 'NotImplemented';
            };
            Object.defineProperties(instance, {
                __id__: { value: `encapsulateInstance${instanceCount++}` },
                isEncapsulateInstance: { value: true },
                instanceOf: {
                    value: traitOrInstantiator => {
                        if (traitOrInstantiator.isEncapsulateInstantiator) return includes(instantiator.__mro__, traitOrInstantiator);
                        else if (isFunction(traitOrInstantiator) || isPlainObject(isPlainObject)) {
                            return includes(
                                flatten(map(instantiator.__bases__, base => base.__traits__)),
                                traitOrInstantiator);
                        }
                        throw 'Unsupported argument type. Argument must be a Plain Object, Function or Encapsulate Instantiator';
                    }
                }
            });
            // Bind Members
            forEachRight(instantiator.__mro__, instantiator => {
                var members = reduce(
                        instantiator.__traits__,
                        (members, trait) => {
                            if (isFunction(trait)) return assign(members, trait.apply(instance, args));
                            if (isPlainObject(trait)) return assign(members, clone(trait, true));
                            throw 'Traits must be either Plain Objects or Functions';
                        },
                        {}),
                    functionMembers = pick(members, isFunction),
                    nonFunctionMembers = omit(members, isFunction);
                assign(instance, nonFunctionMembers);
                forEach(functionMembers, (functionMember, functionName) => {
                    if (isFunction(instance[functionName])) {
                        functionMember.super = instance[functionName].bind(instance);
                    }
                    instance[functionName] = functionMember;
                });
            });
            // Call constructor
            if(typeof instance.__init__ == "function") instance.__init__(...args);
            return instance;
        };

        Object.defineProperties(instantiator, {
            __id__: { value: `encapsulateInstantiator${instantiatorCount++}` },
            __bases__: { get: () => slice(bases) },
            __traits__: { get: () => slice(traits) },
            __mro__: { get: () => slice(mro) },
            isEncapsulateInstantiator: { value: true },
            extends: {
                value: (...args) => {
                    var args = slice(args);
                    if (some(args, arg => !arg.isEncapsulateInstantiator)) {
                        throw 'Unsupported argument type. Arguments must be Encapsulate Instantiator';
                    }
                    return generateInstantiator(traits, args);
                }
            }
        });
        mro.push(...linearize(instantiator));
        return instantiator;
}

/**
 *
 * @param {Object|Function} traitOrInstantiator
 * @returns {Function}
 */
export default function encapsulate(traitOrInstantiator) {
    var args = slice(arguments);

    function parentAccumulator(traitOrInstantiator) {
        var accumulatorArgs = slice(arguments);
        if (traitOrInstantiator.isEncapsulateInstantiator) {
            args.push(...accumulatorArgs);
            //TODO: This needs to return a new parentAccumulator in order to make this a non-mutating operation
            return parentAccumulator;
        } else {
            let instantiator = encapsulate(...accumulatorArgs);
            return instantiator.extends(...args);
        }
    }

    if (typeof traitOrInstantiator == "undefined")
        throw "encapsulate requires parameters!";
    else if (some(args, arg => !isFunction(arg) && !isPlainObject(arg))) {
        throw "Unsupported argument type. Arguments must be either Plain Objects or Functions";
    }

    if (traitOrInstantiator.isEncapsulateInstantiator) return parentAccumulator;
    return generateInstantiator(args);
}
