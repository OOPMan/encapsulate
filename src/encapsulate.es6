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
import isFunction from 'lodash/lang/isFunction';
import isPlainObject from 'lodash/lang/isPlainObject';
import clone from 'lodash/object/clone';
import assign from 'lodash/object/assign';
import pick from 'lodash/object/pick';
import omit from 'lodash/object/omit';


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

function mergeLinearizations(...args) {
    const args = slice(args),
          head = headNotInTails(...args),
          filteredArgs = head ? remove(head, args) : null;
    if (head) {
        if (filteredArgs.length === 0) return [head];
        return [head, ...mergeLinearizations(...filteredArgs)];
    }
    throw 'No Linearization possible';
}