import slice from 'lodash/array/slice';
import first from 'lodash/array/first';
import rest from 'lodash/array/rest';
import without from 'lodash/array/without';
import flatten from 'lodash/array/flatten';
import every from 'lodash/collection/every';
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
          tails = flatten(map(listOfLists, rest));
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
    const head = headNotInTails(...linearizations),
          filteredLinearizations = head ? remove(head, linearizations) : null;
    if (head) {
        if (filteredLinearizations.length === 0) return [head];
        return [head, ...mergeLinearizations(...filteredLinearizations)];
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
 * @param {(Function|Object)[]} traits
 * @param {Function[]} [bases=[]]
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
 * Returns true if the input parameters constitute a valid accumulation,
 * false if the input parameter constitutes a valid generate.
 *
 * Throws an exception if neither option is valid.
 *
 * @param {(Function|Object)[]} traitsOrInstantiators
 * @returns {boolean}
 */
function accumulateOrGenerate(traitsOrInstantiators) {
    if (!traitsOrInstantiators.length) throw 'Encapsulate requires parameters!';
    else if (some(traitsOrInstantiators, arg => !isFunction(arg) && !isPlainObject(arg))) {
        throw 'Unsupported argument type. Arguments must be either Plain Objects or Functions';
    }

    if (some(traitsOrInstantiators, arg => isFunction(arg) && arg.isEncapsulateInstantiator)) {
        if (every(traitsOrInstantiators, arg => isFunction(arg) && arg.isEncapsulateInstantiator)) return true;
        throw 'If one argument is an Encapsulate Instantiator then all arguments must be an Encapsulate Instantiator';
    }
    return false;
}

/**
 *
 * @param {...(Function|Object)} seedTraitsOrInstantiators
 * @returns {accumulator}
 */
function generateAccumulator(seedTraitsOrInstantiators) {
    /**
     *
     * @param {...(Function|Object)} traitsOrInstantiators
     * @returns {Function}
     */
    function accumulator(...traitsOrInstantiators) {
        if (accumulateOrGenerate(traitsOrInstantiators)) return generateAccumulator([...seedTraitsOrInstantiators, ...traitsOrInstantiators]);
        return generateInstantiator(traitsOrInstantiators, seedTraitsOrInstantiators);
    }
    return accumulator;
}

/**
 *
 * @param {...(Function|Object)} traitsOrInstantiators
 * @returns {Function}
 */
export default function encapsulate(...traitsOrInstantiators) {
    if (accumulateOrGenerate(traitsOrInstantiators)) return generateAccumulator(traitsOrInstantiators);
    return generateInstantiator(traitsOrInstantiators);
}
