//     Underscore.js 1.4.0
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.4.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    var found = false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // with specific `key:value` pairs.
  _.where = function(obj, attrs) {
    if (_.isEmpty(attrs)) return [];
    return _.filter(obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (obj.length === +obj.length) return slice.call(obj);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, fromIndex) {
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item, fromIndex);
    var i = (fromIndex != null ? fromIndex : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) {
          result = func.apply(context, args);
        }
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        throttling = true;
        result = func.apply(context, args);
      }
      whenDone();
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + (0 | Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });
      source +=
        escape ? "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" :
        interpolate ? "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" :
        evaluate ? "';\n" + evaluate + "\n__p+='" : '';
      index = offset + match.length;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

//     Backbone.js 0.9.2

//     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `global`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to slice/splice.
  var slice = Array.prototype.slice;
  var splice = Array.prototype.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '0.9.2';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  var $ = root.jQuery || root.Zepto || root.ender;

  // Set the JavaScript library that will be used for DOM manipulation and
  // Ajax calls (a.k.a. the `$` variable). By default Backbone will use: jQuery,
  // Zepto, or Ender; but the `setDomLibrary()` method lets you inject an
  // alternate JavaScript library (or a mock library for testing your views
  // outside of a browser).
  Backbone.setDomLibrary = function(lib) {
    $ = lib;
  };

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // -----------------

  // Regular expression used to split event strings
  var eventSplitter = /\s+/;

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback functions
  // to an event; trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    on: function(events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) return this;
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      while (event = events.shift()) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
      }

      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all callbacks
    // with that function. If `callback` is null, removes all callbacks for the
    // event. If `events` is null, removes all bound callbacks for all events.
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) return;
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(eventSplitter) : _.keys(calls);
      while (event = events.shift()) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) continue;
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        while ((node = node.next) !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) return this;
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      while (event = events.shift()) {
        if (node = calls[event]) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        if (node = all) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
      }

      return this;
    }

  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Backbone.Model
  // --------------

  // Create a new model, with defined attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    attributes || (attributes = {});
    if (options && options.parse) attributes = this.parse(attributes);
    if (defaults = getValue(this, 'defaults')) {
      attributes = _.extend({}, defaults, attributes);
    }
    if (options && options.collection) this.collection = options.collection;
    this.attributes = {};
    this._escapedAttributes = {};
    this.cid = _.uniqueId('c');
    this.changed = {};
    this._silent = {};
    this._pending = {};
    this.set(attributes, {silent: true});
    // Reset change tracking.
    this.changed = {};
    this._silent = {};
    this._pending = {};
    this._previousAttributes = _.clone(this.attributes);
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // A hash of attributes that have silently changed since the last time
    // `change` was called.  Will become pending attributes on the next call.
    _silent: null,

    // A hash of attributes that have changed since the last `'change'` event
    // began.
    _pending: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      var html;
      if (html = this._escapedAttributes[attr]) return html;
      var val = this.get(attr);
      return this._escapedAttributes[attr] = _.escape(val == null ? '' : '' + val);
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"` unless
    // you choose to silence it.
    set: function(key, value, options) {
      var attrs, attr, val;

      // Handle both
      if (_.isObject(key) || key == null) {
        attrs = key;
        options = value;
      } else {
        attrs = {};
        attrs[key] = value;
      }

      // Extract attributes and options.
      options || (options = {});
      if (!attrs) return this;
      if (attrs instanceof Model) attrs = attrs.attributes; 
      if (options.unset) for (attr in attrs) attrs[attr] = void 0;

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      var changes = options.changes = {};
      var now = this.attributes;
      var escaped = this._escapedAttributes;
      var prev = this._previousAttributes || {};

      // For each `set` attribute...
      for (attr in attrs) {
        val = attrs[attr];

        // If the new and current value differ, record the change.
        if (!_.isEqual(now[attr], val) || (options.unset && _.has(now, attr))) {
          delete escaped[attr];
          (options.silent ? this._silent : changes)[attr] = true;
        }

        // Update or delete the current value.
        options.unset ? delete now[attr] : now[attr] = val;

        // If the new and previous value differ, record the change.  If not,
        // then remove changes for this attribute.
        if (!_.isEqual(prev[attr], val) || (_.has(now, attr) != _.has(prev, attr))) {
          this.changed[attr] = val;
          if (!options.silent) this._pending[attr] = true;
        } else {
          delete this.changed[attr];
          delete this._pending[attr];
        }
      }

      // Fire the `"change"` events.
      if (!options.silent) this.change(options);
      return this;
    },

    // Remove an attribute from the model, firing `"change"` unless you choose
    // to silence it. `unset` is a noop if the attribute doesn't exist.
    unset: function(attr, options) {
      (options || (options = {})).unset = true;
      return this.set(attr, null, options);
    },

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
    clear: function(options) {
      (options || (options = {})).unset = true;
      return this.set(_.clone(this.attributes), options);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overriden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        if (!model.set(model.parse(resp, xhr), options)) return false;
        if (success) success(model, resp);
      };
      options.error = Backbone.wrapError(options.error, model, options);
      return (this.sync || Backbone.sync).call(this, 'read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, value, options) {
      var attrs, current;

      // Handle both `("key", value)` and `({key: value})` -style calls.
      if (_.isObject(key) || key == null) {
        attrs = key;
        options = value;
      } else {
        attrs = {};
        attrs[key] = value;
      }
      options = options ? _.clone(options) : {};

      // If we're "wait"-ing to set changed attributes, validate early.
      if (options.wait) {
        if (!this._validate(attrs, options)) return false;
        current = _.clone(this.attributes);
      }

      // Regular saves `set` attributes before persisting to the server.
      var silentOptions = _.extend({}, options, {silent: true});
      if (attrs && !this.set(attrs, options.wait ? silentOptions : options)) {
        return false;
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      var model = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        var serverAttrs = model.parse(resp, xhr);
        if (options.wait) {
          delete options.wait;
          serverAttrs = _.extend(attrs || {}, serverAttrs);
        }
        if (!model.set(serverAttrs, options)) return false;
        if (success) {
          success(model, resp);
        } else {
          model.trigger('sync', model, resp, options);
        }
      };

      // Finish configuring and sending the Ajax request.
      options.error = Backbone.wrapError(options.error, model, options);
      var method = this.isNew() ? 'create' : 'update';
      var xhr = (this.sync || Backbone.sync).call(this, method, this, options);
      if (options.wait) this.set(current, silentOptions);
      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var triggerDestroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      if (this.isNew()) {
        triggerDestroy();
        return false;
      }

      options.success = function(resp) {
        if (options.wait) triggerDestroy();
        if (success) {
          success(model, resp);
        } else {
          model.trigger('sync', model, resp, options);
        }
      };

      options.error = Backbone.wrapError(options.error, model, options);
      var xhr = (this.sync || Backbone.sync).call(this, 'delete', this, options);
      if (!options.wait) triggerDestroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = getValue(this, 'urlRoot') || getValue(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, xhr) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Call this method to manually fire a `"change"` event for this model and
    // a `"change:attribute"` event for each changed attribute.
    // Calling this will cause all objects observing the model to update.
    change: function(options) {
      options || (options = {});
      var changing = this._changing;
      this._changing = true;

      // Silent changes become pending changes.
      for (var attr in this._silent) this._pending[attr] = true;

      // Silent changes are triggered.
      var changes = _.extend({}, options.changes, this._silent);
      this._silent = {};
      for (var attr in changes) {
        this.trigger('change:' + attr, this, this.get(attr), options);
      }
      if (changing) return this;

      // Continue firing `"change"` events while there are pending changes.
      while (!_.isEmpty(this._pending)) {
        this._pending = {};
        this.trigger('change', this, options);
        // Pending and silent changes still remain.
        for (var attr in this.changed) {
          if (this._pending[attr] || this._silent[attr]) continue;
          delete this.changed[attr];
        }
        this._previousAttributes = _.clone(this.attributes);
      }

      this._changing = false;
      return this;
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (!arguments.length) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false, old = this._previousAttributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (!arguments.length || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Check if the model is currently in a valid state. It's only possible to
    // get into an *invalid* state if you're using silent changes.
    isValid: function() {
      return !this.validate(this.attributes);
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. If a specific `error` callback has
    // been passed, call that instead of firing the general `"error"` event.
    _validate: function(attrs, options) {
      if (options.silent || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validate(attrs, options);
      if (!error) return true;
      if (options && options.error) {
        options.error(this, error, options);
      } else {
        this.trigger('error', this, error, options);
      }
      return false;
    }

  });

  // Backbone.Collection
  // -------------------

  // Provides a standard collection class for our sets of models, ordered
  // or unordered. If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, {silent: true, parse: options.parse});
  };

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Add a model, or list of models to the set. Pass **silent** to avoid
    // firing the `add` event for every new model.
    add: function(models, options) {
      var i, index, length, model, cid, id, cids = {}, ids = {}, dups = [];
      options || (options = {});
      models = _.isArray(models) ? models.slice() : [models];

      // Begin by turning bare objects into model references, and preventing
      // invalid models or duplicate models from being added.
      for (i = 0, length = models.length; i < length; i++) {
        if (!(model = models[i] = this._prepareModel(models[i], options))) {
          throw new Error("Can't add an invalid model to a collection");
        }
        cid = model.cid;
        id = model.id;
        if (cids[cid] || this._byCid[cid] || ((id != null) && (ids[id] || this._byId[id]))) {
          dups.push(i);
          continue;
        }
        cids[cid] = ids[id] = model;
      }

      // Remove duplicates.
      i = dups.length;
      while (i--) {
        models.splice(dups[i], 1);
      }

      // Listen to added models' events, and index models for lookup by
      // `id` and by `cid`.
      for (i = 0, length = models.length; i < length; i++) {
        (model = models[i]).on('all', this._onModelEvent, this);
        this._byCid[model.cid] = model;
        if (model.id != null) this._byId[model.id] = model;
      }

      // Insert models into the collection, re-sorting if needed, and triggering
      // `add` events unless silenced.
      this.length += length;
      index = options.at != null ? options.at : this.models.length;
      splice.apply(this.models, [index, 0].concat(models));
      if (this.comparator) this.sort({silent: true});
      if (options.silent) return this;
      for (i = 0, length = this.models.length; i < length; i++) {
        if (!cids[(model = this.models[i]).cid]) continue;
        options.index = i;
        model.trigger('add', model, this, options);
      }
      return this;
    },

    // Remove a model, or a list of models from the set. Pass silent to avoid
    // firing the `remove` event for every model removed.
    remove: function(models, options) {
      var i, l, index, model;
      options || (options = {});
      models = _.isArray(models) ? models.slice() : [models];
      for (i = 0, l = models.length; i < l; i++) {
        model = this.getByCid(models[i]) || this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byCid[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, options);
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Get a model from the set by id.
    get: function(id) {
      if (id == null) return void 0;
      return this._byId[id.id != null ? id.id : id];
    },

    // Get a model from the set by client id.
    getByCid: function(cid) {
      return cid && this._byCid[cid.cid || cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of `filter`.
    where: function(attrs) {
      if (_.isEmpty(attrs)) return [];
      return this.filter(function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      options || (options = {});
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      var boundComparator = _.bind(this.comparator, this);
      if (this.comparator.length == 1) {
        this.models = this.sortBy(boundComparator);
      } else {
        this.models.sort(boundComparator);
      }
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.map(this.models, function(model){ return model.get(attr); });
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any `add` or `remove` events. Fires `reset` when finished.
    reset: function(models, options) {
      models  || (models = []);
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      this._reset();
      this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `add: true` is passed, appends the
    // models to the collection instead of resetting.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === undefined) options.parse = true;
      var collection = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
        if (success) success(collection, resp);
      };
      options.error = Backbone.wrapError(options.error, collection, options);
      return (this.sync || Backbone.sync).call(this, 'read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      var coll = this;
      options = options ? _.clone(options) : {};
      model = this._prepareModel(model, options);
      if (!model) return false;
      if (!options.wait) coll.add(model, options);
      var success = options.success;
      options.success = function(nextModel, resp, xhr) {
        if (options.wait) coll.add(nextModel, options);
        if (success) {
          success(nextModel, resp);
        } else {
          nextModel.trigger('sync', model, resp, options);
        }
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, xhr) {
      return resp;
    },

    // Proxy to _'s chain. Can't be proxied the same way the rest of the
    // underscore methods are proxied because it relies on the underscore
    // constructor.
    chain: function () {
      return _(this.models).chain();
    },

    // Reset all internal state. Called when the collection is reset.
    _reset: function(options) {
      this.length = 0;
      this.models = [];
      this._byId  = {};
      this._byCid = {};
    },

    // Prepare a model or hash of attributes to be added to this collection.
    _prepareModel: function(model, options) {
      options || (options = {});
      if (!(model instanceof Model)) {
        var attrs = model;
        options.collection = this;
        model = new this.model(attrs, options);
        if (!model._validate(model.attributes, options)) model = false;
      } else if (!model.collection) {
        model.collection = this;
      }
      return model;
    },

    // Internal method to remove a model's ties to a collection.
    _removeReference: function(model) {
      if (this == model.collection) {
        delete model.collection;
      }
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event == 'add' || event == 'remove') && collection != this) return;
      if (event == 'destroy') {
        this.remove(model, options);
      }
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
    'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
    'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
    'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
    'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
    };
  });

  // Backbone.Router
  // -------------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var namedParam    = /:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      Backbone.history || (Backbone.history = new History);
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (!callback) callback = this[name];
      Backbone.history.route(route, _.bind(function(fragment) {
        var args = this._extractParameters(route, fragment);
        callback && callback.apply(this, args);
        this.trigger.apply(this, ['route:' + name].concat(args));
        Backbone.history.trigger('route', this, name, args);
      }, this));
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      var routes = [];
      for (var route in this.routes) {
        routes.unshift([route, this.routes[route]]);
      }
      for (var i = 0, l = routes.length; i < l; i++) {
        this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(namedParam, '([^\/]+)')
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted parameters.
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on URL fragments. If the
  // browser does not support `onhashchange`, falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');
  };

  // Cached regex for cleaning leading hashes and slashes .
  var routeStripper = /^[#\/]/;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(windowOverride) {
      var loc = windowOverride ? windowOverride.location : window.location;
      var match = loc.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || forcePushState) {
          fragment = window.location.pathname;
          var search = window.location.search;
          if (search) fragment += search;
        } else {
          fragment = this.getHash();
        }
      }
      if (!fragment.indexOf(this.options.root)) fragment = fragment.substr(this.options.root.length);
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && window.history && window.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      if (oldIE) {
        this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        $(window).bind('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        $(window).bind('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = window.location;
      var atRoot  = loc.pathname == this.options.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        window.location.replace(this.options.root + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        window.history.replaceState({}, document.title, loc.protocol + '//' + loc.host + this.options.root + this.fragment);
      }

      if (!this.options.silent) {
        return this.loadUrl();
      }
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      $(window).unbind('popstate', this.checkUrl).unbind('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current == this.fragment && this.iframe) current = this.getFragment(this.getHash(this.iframe));
      if (current == this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      var frag = (fragment || '').replace(routeStripper, '');
      if (this.fragment == frag) return;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        if (frag.indexOf(this.options.root) != 0) frag = this.options.root + frag;
        this.fragment = frag;
        window.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, frag);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this.fragment = frag;
        this._updateHash(window.location, frag, options.replace);
        if (this.iframe && (frag != this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a history entry on hash-tag change.
          // When replace is true, we don't want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, frag, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        window.location.assign(this.options.root + fragment);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        location.replace(location.toString().replace(/(javascript:|#).*$/, '') + '#' + fragment);
      } else {
        location.hash = fragment;
      }
    }
  });

  // Backbone.View
  // -------------

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view from the DOM. Note that the view isn't present in the
    // DOM by default, so calling this method may be a no-op.
    remove: function() {
      this.$el.remove();
      return this;
    },

    // For small amounts of DOM Elements, where a full-blown template isn't
    // needed, use **make** to manufacture elements, one at a time.
    //
    //     var el = this.make('li', {'class': 'row'}, this.model.escape('title'));
    //
    make: function(tagName, attributes, content) {
      var el = document.createElement(tagName);
      if (attributes) $(el).attr(attributes);
      if (content) $(el).html(content);
      return el;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = (element instanceof $) ? element : $(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = getValue(this, 'events')))) return;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) throw new Error('Method "' + events[key] + '" does not exist');
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.bind(eventName, method);
        } else {
          this.$el.delegate(selector, eventName, method);
        }
      }
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.unbind('.delegateEvents' + this.cid);
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(model, collection, id, className)*, are
    // attached directly to the view.
    _configure: function(options) {
      if (this.options) options = _.extend({}, this.options, options);
      for (var i = 0, l = viewOptions.length; i < l; i++) {
        var attr = viewOptions[i];
        if (options[attr]) this[attr] = options[attr];
      }
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = getValue(this, 'attributes') || {};
        if (this.id) attrs.id = this.id;
        if (this.className) attrs['class'] = this.className;
        this.setElement(this.make(this.tagName, attrs), false);
      } else {
        this.setElement(this.el, false);
      }
    }

  });

  // The self-propagating extend function that Backbone classes use.
  var extend = function (protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

  // Set up inheritance for the model, collection, and view.
  Model.extend = Collection.extend = Router.extend = View.extend = extend;

  // Backbone.sync
  // -------------

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    options || (options = {});

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = getValue(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (!options.data && model && (method == 'create' || method == 'update')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(model.toJSON());
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (Backbone.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (Backbone.emulateHTTP) {
      if (type === 'PUT' || type === 'DELETE') {
        if (Backbone.emulateJSON) params.data._method = type;
        params.type = 'POST';
        params.beforeSend = function(xhr) {
          xhr.setRequestHeader('X-HTTP-Method-Override', type);
        };
      }
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !Backbone.emulateJSON) {
      params.processData = false;
    }

    // Make the request, allowing the user to override any Ajax options.
    return $.ajax(_.extend(params, options));
  };

  // Wrap an optional error callback with a fallback error event.
  Backbone.wrapError = function(onError, originalModel, options) {
    return function(model, resp) {
      resp = model === originalModel ? resp : model;
      if (onError) {
        onError(originalModel, resp, options);
      } else {
        originalModel.trigger('error', originalModel, resp, options);
      }
    };
  };

  // Helpers
  // -------

  // Shared empty constructor function to aid in prototype-chain creation.
  var ctor = function(){};

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ parent.apply(this, arguments); };
    }

    // Inherit class (static) properties from parent.
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Add static properties to the constructor function, if supplied.
    if (staticProps) _.extend(child, staticProps);

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Helper function to get a value from a Backbone object as a property
  // or as a function.
  var getValue = function(object, prop) {
    if (!(object && object[prop])) return null;
    return _.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

}).call(this);

/**
 * Really Simple Color Picker in jQuery
 *
 * Licensed under the MIT (MIT-LICENSE.txt) licenses.
 *
 * Copyright (c) 2008-2012
 * Lakshan Perera (www.laktek.com) & Daniel Lacy (daniellacy.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function ($) {
    /**
     * Create a couple private variables.
    **/
    var selectorOwner,
        activePalette,
        cItterate       = 0,
        templates       = {
            control : $('<div class="colorPicker-picker">&nbsp;</div>'),
            palette : $('<div id="colorPicker_palette" class="colorPicker-palette" />'),
            swatch  : $('<div class="colorPicker-swatch">&nbsp;</div>'),
            hexLabel: $('<label for="colorPicker_hex">Hex</label>'),
            hexField: $('<input type="text" id="colorPicker_hex" />')
        },
        transparent     = "transparent",
        lastColor;

    /**
     * Create our colorPicker function
    **/
    $.fn.colorPicker = function (options) {

        return this.each(function () {
            // Setup time. Clone new elements from our templates, set some IDs, make shortcuts, jazzercise.
            var element      = $(this),
                opts         = $.extend({}, $.fn.colorPicker.defaults, options),
                defaultColor = $.fn.colorPicker.toHex(
                        (element.val().length > 0) ? element.val() : opts.pickerDefault
                    ),
                newControl   = templates.control.clone(),
                newPalette   = templates.palette.clone().attr('id', 'colorPicker_palette-' + cItterate),
                newHexLabel  = templates.hexLabel.clone(),
                newHexField  = templates.hexField.clone(),
                paletteId    = newPalette[0].id,
                swatch;


            /**
             * Build a color palette.
            **/
            $.each(opts.colors, function (i) {
                swatch = templates.swatch.clone();

                if (opts.colors[i] === transparent) {
                    swatch.addClass(transparent).text('X');
                    $.fn.colorPicker.bindPalette(newHexField, swatch, transparent);
                } else {
                    swatch.css("background-color", "#" + this);
                    $.fn.colorPicker.bindPalette(newHexField, swatch);
                }
                swatch.appendTo(newPalette);
            });

            newHexLabel.attr('for', 'colorPicker_hex-' + cItterate);

            newHexField.attr({
                'id'    : 'colorPicker_hex-' + cItterate,
                'value' : defaultColor
            });

            newHexField.bind("keydown", function (event) {
                if (event.keyCode === 13) {
                    var hexColor = $.fn.colorPicker.toHex($(this).val());
                    $.fn.colorPicker.changeColor(hexColor ? hexColor : element.val());
                }
                if (event.keyCode === 27) {
                    $.fn.colorPicker.hidePalette();
                }
            });

            newHexField.bind("keyup", function (event) {
              var hexColor = $.fn.colorPicker.toHex($(event.target).val());
              $.fn.colorPicker.previewColor(hexColor ? hexColor : element.val());
            });

            $('<div class="colorPicker_hexWrap" />').append(newHexLabel).appendTo(newPalette);

            newPalette.find('.colorPicker_hexWrap').append(newHexField);

            $("body").append(newPalette);

            newPalette.hide();


            /**
             * Build replacement interface for original color input.
            **/
            newControl.css("background-color", defaultColor);

            newControl.bind("click", function () {
            	if (!element.attr('disabled'))
                $.fn.colorPicker.togglePalette($('#' + paletteId), $(this));
            });

            if( options && options.onColorChange ) {
              newControl.data('onColorChange', options.onColorChange);
            } else {
              newControl.data('onColorChange', function() {} );
            }
            element.after(newControl);

            element.bind("change", function () {
                element.next(".colorPicker-picker").css(
                    "background-color", $.fn.colorPicker.toHex($(this).val())
                );
            });

            // Hide the original input.
            element.val(defaultColor).hide();

            cItterate++;
        });
    };

    /**
     * Extend colorPicker with... all our functionality.
    **/
    $.extend(true, $.fn.colorPicker, {
        /**
         * Return a Hex color, convert an RGB value and return Hex, or return false.
         *
         * Inspired by http://code.google.com/p/jquery-color-utils
        **/
        toHex : function (color) {
            // If we have a standard or shorthand Hex color, return that value.
            if (color.match(/[0-9A-F]{6}|[0-9A-F]{3}$/i)) {
                return (color.charAt(0) === "#") ? color : ("#" + color);

            // Alternatively, check for RGB color, then convert and return it as Hex.
            } else if (color.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/)) {
                var c = ([parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10), parseInt(RegExp.$3, 10)]),
                    pad = function (str) {
                        if (str.length < 2) {
                            for (var i = 0, len = 2 - str.length; i < len; i++) {
                                str = '0' + str;
                            }
                        }

                        return str;
                    };

                if (c.length === 3) {
                    var r = pad(c[0].toString(16)),
                        g = pad(c[1].toString(16)),
                        b = pad(c[2].toString(16));

                    return '#' + r + g + b;
                }

            // Otherwise we wont do anything.
            } else {
                return false;

            }
        },

        /**
         * Check whether user clicked on the selector or owner.
        **/
        checkMouse : function (event, paletteId) {
            var selector = activePalette,
                selectorParent = $(event.target).parents("#" + selector.attr('id')).length;

            if (event.target === $(selector)[0] || event.target === selectorOwner[0] || selectorParent > 0) {
                return;
            }

            $.fn.colorPicker.hidePalette();
        },

        /**
         * Hide the color palette modal.
        **/
        hidePalette : function () {
            $(document).unbind("mousedown", $.fn.colorPicker.checkMouse);

            $('.colorPicker-palette').hide();
        },

        /**
         * Show the color palette modal.
        **/
        showPalette : function (palette) {
            var hexColor = selectorOwner.prev("input").val();

            palette.css({
                top: selectorOwner.offset().top + (selectorOwner.outerHeight()),
                left: selectorOwner.offset().left-palette.outerWidth()+selectorOwner.outerWidth()
            });

            $("#color_value").val(hexColor);

            palette.show();

            $(document).bind("mousedown", $.fn.colorPicker.checkMouse);
        },

        /**
         * Toggle visibility of the colorPicker palette.
        **/
        togglePalette : function (palette, origin) {
            // selectorOwner is the clicked .colorPicker-picker.
            if (origin) {
                selectorOwner = origin;
            }

            activePalette = palette;

            if (activePalette.is(':visible')) {
                $.fn.colorPicker.hidePalette();

            } else {
                $.fn.colorPicker.showPalette(palette);

            }
        },

        /**
         * Update the input with a newly selected color.
        **/
        changeColor : function (value) {
            selectorOwner.css("background-color", value);
            selectorOwner.prev("input").val(value).change();

            $.fn.colorPicker.hidePalette();

            selectorOwner.data('onColorChange').call(selectorOwner, $(selectorOwner).prev("input").attr("id"), value);
        },


        /**
         * Preview the input with a newly selected color.
        **/
        previewColor : function (value) {
            selectorOwner.css("background-color", value);
        },

        /**
         * Bind events to the color palette swatches.
        */
        bindPalette : function (paletteInput, element, color) {
            color = color ? color : $.fn.colorPicker.toHex(element.css("background-color"));

            element.bind({
                click : function (ev) {
                    lastColor = color;

                    $.fn.colorPicker.changeColor(color);
                },
                mouseover : function (ev) {
                    lastColor = paletteInput.val();

                    $(this).css("border-color", "#598FEF");

                    paletteInput.val(color);

                    $.fn.colorPicker.previewColor(color);
                },
                mouseout : function (ev) {
                    $(this).css("border-color", "#000");

                    paletteInput.val(selectorOwner.css("background-color"));

                    paletteInput.val(lastColor);

                    $.fn.colorPicker.previewColor(lastColor);
                }
            });
        }
    });

    /**
     * Default colorPicker options.
     *
     * These are publibly available for global modification using a setting such as:
     *
     * $.fn.colorPicker.defaults.colors = ['151337', '111111']
     *
     * They can also be applied on a per-bound element basis like so:
     *
     * $('#element1').colorPicker({pickerDefault: 'efefef', transparency: true});
     * $('#element2').colorPicker({pickerDefault: '333333', colors: ['333333', '111111']});
     *
    **/
    $.fn.colorPicker.defaults = {
        // colorPicker default selected color.
        pickerDefault : "FFFFFF",

        // Default color set.
        colors : [
            '424242', '676767', '989898', 'C5C5C5', 'E3E3E3', 'F1F1F1', 
	    '800000', 'FF6600', '808000', '008000', '008080', '0000FF', 
	    '666699', '808080', 'FF0000', 'FF9900', '99CC00', '339966', 
	    '33CCCC', '3366FF', '800080', '999999', 'FF00FF', 'FFCC00',
            'FFFF00', '00FF00', '00FFFF', '00CCFF', '993366', 'C0C0C0', 
	    'FF99CC', 'FFCC99', 'FFFF99', 'CCFFFF', '99CCFF', 'FFFFFF'
        ],

        // If we want to simply add more colors to the default set, use addColors.
        addColors : ['red']
    };

})(jQuery);

var inspic=inspic || {};
(function($){
    var head='<script type="text/template" inspic_tem="label">'+
        '<label for="<%=id%>">'+
        '<% if (data.icon) {%>'+
        '<span class="inspic16 <%=data.icon%>" title="<%=data.text%>"></span>'+
        '<%} else if(data.text) {%>'+
        '<%=data.text%>'+
        '<% } %>'+
        '</label>'+
        '</script>'+

    '<script type="text/template" inspic_tem="text" >'+
        '<%=label%>'+
        '<input id="<%=id%>" type="text">'+
        '</script>'+

    '<script type="text/template" inspic_tem="select">'+
        '<%=label%>'+
        '<select id="<%=id%>">'+
        '<%_.each(data.options, function(val,key){%>'+
        '<option value="<%=val%>"><%=key%></option>'+
        '<%})%>'+
        '</select>'+
        '</script>'+

    '<script type="text/template" inspic_tem="checkbox">'+
        '<input id="<%=id%>" type="checkbox">'+
        '<%=label%>'+
        '</script>'+

    '<script type="text/template" inspic_tem="empty">'+
        '</script>'+

    '<script type="text/template" inspic_tem="bool">'+
        '<span class="inspic16 <%=data.icon%>"></span>'+
        '</script>'+

    '<script type="text/template" id="inspic_tem_selectItem">'+
        '<span class="iconSelect">'+
        '<%var first=true;_.each(items, function(val,key){%><span class="iconSelectItem<%if(first){first=false;%> first<%}%> <%=key%>" value="<%=key%>" title="<%=val%>"></span><%});%>'+
        '</span>'+
        '</script>'+

    '<script type="text/template" id="inspic_tem_spinner">'+
        '<span class="inspic_spinner">'+
        '&nbsp;'+
        '<span class="inspic_up"><span class="up"></span></span>'+
        '<span class="inspic_dn"><span class="dn"></span></span>'+
        '</span>'+
        '</script>';

    inspic.injectTemplates=_.once(function(){
	$('head').append(head);
    });
    inspic.injectTemplates();

})(jQuery);/*
 * Insert Picture Module
 * MVC pattern. order of importing javascript modules is important:
 * inspic.js -> model.js -> controller.js -> view.js
 */
var inspic = inspic || {};

console=console || {
    log: function(){;}
}

function inspicEval(expr){
    //console.log(expr);
    return eval(expr);
}

(function($) {
    //IE does not support trim
    if(typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            return $.trim(this);
        };
    }
    
    function Scroller(callback,context) {//returns a div
        var element=$('<div>');
        var mouseDown = false;
        element.css({
            display : ($.browser.msie ? 'inline' : 'inline-block'),
            position : 'relative',
            width : 104,
            height : 15
        }).append('<span class="inspic16 slider">');
        $('<span>').css({
            borderWidth : 1,
            borderStyle : 'solid',
            position : 'absolute',
            width : 7,
            height : 7,
            borderRadius : 5,
            backgroundColor : '#ffa500',
            top : 4,
            display : 'block'
        }).appendTo($('<div>').css({
            position : 'absolute',
            borderWidth : 0,
            borderStyle : 'solid',
            width : 70,
            height : 15,
            left : 13,
            top : 0,
            overflow : 'hidden',
            paddingBottom: 3
        }).bind('mousedown', function() {
            mouseDown = true;
        }).bind('mouseup mouseover', function() {
            mouseDown = false;
        }).bind('mousemove mousedown', function(e) {
            if (mouseDown) {
                var val = (e.pageX - $(this).offset().left - 5);
                var rel = (val + 0.0) / $(this).width();
                if (rel < 0 || rel > .9)
                    return;
                rel = rel / 0.9;
                $(this).find('span').css('left', val);
                callback.call(context,rel);
            }
        }).appendTo(element));
        $.fn.setScrollerValue = function(val) {
            $(this).find('span').css('left', val * 0.9 * ($(this).find('div').width()));
        };
        return element;
    }
    inspic.scroller=Scroller;

    var iconSelectTem=_.template($('#inspic_tem_selectItem').html());
    function iconSelect(field){
        $.each(this, function(){
            var $select=$(this);
            var items={};

            $select.find('option').each(function(){
                var $option=$(this);
                items[$option.attr('value')]=$option.text();
            });

            var $el=$(iconSelectTem({'items':items})).insertAfter($select);
            if (field)
                $el.attr('field',field);
            $select.hide();

            $el.on('click', '.iconSelectItem', function(){
                var $this=$(this);
                $select.val($this.attr('value')).change();
            });
            $select.change(function(e){
                $el.find('.selected').removeClass('selected');
                $el.find('[value="'+$select.val()+'"]').addClass('selected');
            });
            $select.change();
        });
        return this;
    }

    var spinnerTem=$('#inspic_tem_spinner').html();
    function spinner(args){
        args=_.extend({
            step:1,
            min:0,
            max:50
        }, args);

        $.each(this, function(){
            var $text=$(this);
            var $spinner=$(spinnerTem);
            var $up=$spinner.find('.inspic_up');
            var $dn=$spinner.find('.inspic_dn');

            function updateDisablity(){
                var val=parseFloat($text.val());
                $dn.inspic('disabled', val==args.min);
                $up.inspic('disabled', val==args.max);
            }
            
            function changeStep(inc, el){
                var step=args.step;
                var delta=(inc ? step : -step);
                var val=parseFloat($text.val())+delta;
                var min=args.min, max=args.max;
                if (_.isNaN(val))
                    return;
                _.isNaN(min) || (val=Math.max(val, min));
                _.isNaN(max) || (val=Math.min(val, max));
                (val%1===0) || (val=val.toFixed(2));
                $text.val(val).change();
            }

            $text.keypress(function(e){
                if (e.keyCode!=38 && e.keyCode!=40)
                    return;
                changeStep(e.keyCode==38);
            });

            $text.width($text.width()-11);
            $text.after($spinner);

            function mousePress($el, func){
                var i1=NaN,i2=NaN;
                $el.mousedown(function(){
                    func();
                    i1=setTimeout(function(){
                        i2=setInterval(func, 100);
                    },500);
                });
                $(document).bind('mouseup mouseleave', function(){
                    if (i1){
                        clearTimeout(i1);
                        i1=NaN;
                    } if (i2) {
                        clearInterval(i2);
                        i2=NaN;
                    }
                });
            }

            mousePress($up, function(){
                changeStep(true);
            });
            mousePress($dn, function(){
                changeStep(false);
            });
            $text.change(updateDisablity);
        });
        return this;
    }

    function tabularize(header,focus){
        var $header=$(header);
        var $tabs=this;
        focus = focus || 0;
        $.each(this, function(index){
            var $tab=$(this);
            $header.append($('<span>', {
                text:$tab.attr('tab_title'),
                'for':$tab.attr('id'),
                click: function(){
                    if ($(this).inspic('disabled'))
                        return;
                    $tabs.hide();
                    $tab.show();
                    $(this).addClass('selected').siblings().removeClass('selected');
                }
            }));
        });
        $header.find('span:first').click();
        return this;
    }

    var jQueryFunctions = {
        val : function(value) {
            if (_.isUndefined(value)) {
                var el = this.first();
                if (el.is('input[type="checkbox"]'))
                    return (el.attr('checked') == 'checked' ? true : false);
                return el.val();
            } else {
                $.each(this, function() {
                    var $this = $(this);
                    if ($this.is('input[type="checkbox"]')) {
                        if (value)
                            $this.attr('checked', 'checked');
                        else
                            $this.removeAttr('checked');
                    } else {
                        $this.val(value);
                    }

                });
                return this;
            }
        },

        disabled : function(value) {
            var $this=$(this);
            if (arguments.length==0)
                return ($this.attr('disabled')=='disabled');
            if (value)
                $this.attr('disabled', 'disabled');
            else
                $this.removeAttr('disabled');
            return this;
        },

        'iconSelect': iconSelect,
        'spinner': spinner,
        'tabularize': tabularize,

        css: function(val,key){
            if (_.isUndefined(key) || _.isNull(key))
                return;
            var ret=this.attr('style');
            ret=(ret ? ret+' ' : '');
            ret=ret+(_.isUndefined(key) ? val : val+':'+key.trim()+';');
            return this.attr('style', ret);
        },
        outerHtml: function(){
            return $('<div>').append($(this).clone()).html();
        }
    };


    $.fn.inspic = function(method) {
        return jQueryFunctions[method].apply(this, Array.prototype.slice.call(arguments, 1));
    };

    inspic.pixelize=function(x){
        return (x ? x+'px' : '0');
    };

    inspic.colorToRgba= function(color){
        var hex = color.match(/#([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/);
        if (hex){
            hex=_.map(hex, function(val){
                return parseInt((val.length==1 ? val.toString()+val.toString() : val), 16);
            });
            return {r:hex[1], g:hex[2], b: hex[3], a:1};
        }
        var rgba = color.match(/rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(,([.\d]*))?\)/);
        var alpha=(rgba[5]==='0' || rgba[5] ? rgba[5] : 1);
        if (rgba)
            return {r:parseInt(rgba[1]), g:parseInt(rgba[2]), b:parseInt(rgba[3]), a:alpha};
        if (color=='transparent')
            return {r:255, g:255, b:255, a:0};
        return '';
    };

    inspic.rgbaToColor = function(rgba){
        var rgb=[rgba.r,rgba.g,rgba.b];
        if (rgba.a===0)
            return 'transparent';
        else if (!rgba.a || rgba.a==1)
            return _.reduce(rgb, function(memo,val){
                val || (val=0);
                val=val.toString(16);
                return memo+(val.length==1?'0':'')+val;
            }, '#');
        else
            return 'rgba('+rgb.join(',')+','+rgba.a+')';
        return '';
    };

    inspic.alphaColor= function(color, alpha){
        var ret=inspic.colorToRgba(color);
        ret.a=alpha;
        return inspic.rgbaToColor(ret);
    };

    inspic.trbl=function(t,r,b,l){
        var p=inspic.pixelize;
        if (t==r && r==b && b==l)
            return p(t);
        else if (t==b && r==l)
            return p(t)+' '+p(r);
        else
            return p(t)+' '+p(r)+' '+p(b)+' '+p(l);
    };

    inspic.parseBool=function(x){
        if (typeof(x)=='string')
            return (x=='true' || x=='1');
        else
            return x;
    };

})(jQuery);


(function($) {
    inspic.model = {};
    
    function ComputedField(depends,func){
	this.depends=depends || [];
	this.func=func || function(){;};
    }
    
    ComputedField.prototype={
	registerBackboneHandlers: function(model,field){
	    this.model=model;

	    var depends=this.depends,
	    func=this.func;

	    var handler=function(){
		var args=_.map(depends, model.get, model);
		model.set(field,func.apply(model, args));
	    };
	    this.handler=handler;

	    _.each(depends, function(val){
		model.on('change:'+val, handler, model);
	    });
	    return handler;
	},
	
	unregisterBackboneHandlers: function(){
	    this.model.off(null, this.func);
	}
    };
    inspic.model.ComputedField=ComputedField;
    
    var MainModel = Backbone.Model.extend({
	initialize: function(){
	    Backbone.Model.prototype.initialize.apply(this, arguments);
	    !this.computed || (_.each(this.computed, function(val, key){
		var func=val.registerBackboneHandlers(this,key);
		func.call(this);
	    },this));
	    
	},

	/**
	 *Sample: subscribe('!`src.bayan` && `href.type`=="url"', function(val){ console.log(val, this); }, taghi)
	 * will subscribe the function(val) to changes of src.bayan and href.type and call it with (this=taghi) and (val=~src.bayan && href.type=="url") on each change.
	 */

	subscribe: function(expr, onChange, context){
	    if (!expr || !onChange)
		return;
	    context=context || this;
	    var model=this;
	    var changes,handler; 

	    if (expr.search('`')>-1){
		/* if expr had `model fields`, subscribe to change of all of them and substitute for calls */

		//string for changes of `model fields` appeared in expr
		changes=_.reduce(_.uniq(expr.match(/`[^`]*`/g) || []), function(memo, field){ return memo+'change:'+field.substring(1, field.length-1)+' '; },'');

		handler=function(){

		    //substitued `model fields` with their values
		    var substituted=expr.replace(/`([^`]*)`/g, function(matched,$1){ 
			var ret=model.get($1); 
			if (typeof(ret)=='string') 
			    ret='"'+ret+'"';
			else if (typeof(ret)=="undefined")
			    ret=null;
			return ret;
		    });

		    onChange.call(context, substituted);
		};
	    } else { 
		/*if expr is just a single field of model, subscribe to its changes */
		changes='change:'+expr;
		handler=function(){
		    onChange.call(context, model.get(expr));
		};
	    }

	    model.on(changes, handler, this);
	    return handler;
	},

	/*****************************************************************************************************/

	defaults : {
	    'version': 1,
	    'isLoading' : false,
	    'adv': false,
	    'src' : null,
	    'src.adv': false,
	    'src.width' : 0,
	    'src.height' : 0,
	    'src.bayan' : false,
	    'src.bayan.raw_url' : undefined,
	    'src.bayan.size' : undefined,
	    'width' : null,
	    'height' : null,
	    'keep_ratio' : true,
	    'href.type': 'src',
	    'href.url': '',
	    'href.target': '_blank',
	    'title': '',
	    'position': 'float_right',
	    'position.float': 'right',
	    'margin.base': 10,
	    'margin.adv': false,
	    'margin.left': 10,
	    'margin.right': 10,
	    'margin.top': 10,
	    'margin.bottom': 10,
	    'innerShadow.enable':true,
	    'innerShadow.inset': true,
	    'innerShadow.blur': 10,
	    'innerShadow.color': '#000',
	    'innerShadow.x': 0,
	    'innerShadow.y': 0,
	    'innerShadow.alpha': 1,
	    'outerShadow.enable':true,
	    'outerShadow.inset': false,
	    'outerShadow.blur': 3,
	    'outerShadow.color': '#000',
	    'outerShadow.x': 0,
	    'outerShadow.y': 0,
	    'outerShadow.alpha': 1.0,
	    'borderline.enable': false,
	    'borderline.color':'#000',
	    'borderline.style':'solid',
	    'borderline.width':1,
	    'border.padding.raw':3,
	    'border.radius':5,
	    'border.background':'#fff',
	    'caption.enable':false,
	    'caption.pos':'inner_top',
	    'caption.textAlign':'center',
	    'caption.h1.enable': true,
	    'caption.h1.text':'',
	    'caption.h1.type':'',
	    'caption.h1.bold':false,
	    'caption.h1.italic':false,
	    'caption.h1.color.inner':'#eee',
	    'caption.h1.color.outer':'#000',
	    'caption.h1.size':14,
	    'caption.p.text':'',
	    'caption.p.enable':false,
	    'caption.p.bold':false,
	    'caption.p.italic':false,
	    'caption.p.color.inner':'#eee',
	    'caption.p.color.outer':'#000',
	    'caption.p.size':10,
	    'caption.adv':false,
	    'caption.inner.hpos':'full',
	    'caption.inner.background.color':'#000',
	    'caption.inner.background.alpha':0.7,
	    'caption.outer.background.color':'#fff',
	    'caption.outer.background.alpha':1,
	    'caption.outer.border.enable':false,
	    'caption.outer.border.style':'solid',
	    'caption.outer.border.width':1,
	    'caption.outer.border.color':'#000',
	    'caption.outer.padding':3,
	    'caption.outer.radius':0
	},

	autoMargin: function(pos, base, shadow, blur, x, y){
	    //Notice: changes should be applied to autoMarginInv too.
	    var t,r,b,l;
	    base=base || 0;
	    t=r=b=l=base;
	    if (pos.match(/_right/))
		r=0;
	    else if (pos.match(/_left/))
		l=0;
	    if (shadow){
		if (blur>=10)
		    blur=Math.floor(blur/2)+4+Math.floor(blur/5);
		t+=Math.max(0, blur-y);
		r+=Math.max(0, blur+x);
		b+=Math.max(0, blur+y);
		l+=Math.max(0, blur-x);
	    }
	    return [t,r,b,l];
	},
	autoMarginInv: function(t, r, b, l, pos, base, shadow, blur, x, y){
	    //Notice: changes should be applied to autoMargin too.
	    if (shadow){
		if (blur>=10)
		    blur=Math.floor(blur/2)+4+Math.floor(blur/5);
		t-=Math.max(0, blur-y);
		r-=Math.max(0, blur+x);
		b-=Math.max(0, blur+y);
		l-=Math.max(0, blur-x);
	    }
	    if (pos.match(/_right/) && !r)
		r=t;
	    else if (pos.match(/_left/) && !l)
		l=t;
	    return  ( (t==r) && (r==b) && (b==l) ? t : '');
	},
	computed: {
	    'href': new ComputedField(
		['src','href.type','href.url'],
		function(src, type, url){
		    if (type=='none')
			return null;
		    else if (type=='src')
			return src;
		    else if (type=='big')
			return inspic.controller.bayanSizedUrl(src, 'view');
		    else if (type=='url')
			return url;
		    return '';
		}),
	    'margin': new ComputedField(
		['margin.base','margin.adv','margin.top', 'margin.right','margin.bottom','margin.left','position','outerShadow.enable','outerShadow.blur','outerShadow.x','outerShadow.y'],
		function(base,         adv,         top,          right,         bottom,         left,  pos,       shadow,              blur,              x,              y){
		    var trbl;
		    if (!adv && base!==''){
			trbl=this.autoMargin(pos, base, shadow, blur, x, y);
		    } else {
			trbl=[top, right, bottom, left];
		    }
		    return inspic.trbl.apply(document,trbl);
		}),
	    'innerShadow': shadowField('innerShadow.'),
	    'borderline': borderField('borderline.'),
	    'outerShadow': shadowField('outerShadow.'),
	    'border.padding': new ComputedField(
		['border.padding.raw', 'outerShadow.enable', 'borderline.enable'],
		function(val,           shadow,               line){
		    return (shadow || line ? val : 0);
		}),
	    'border.radius.inner': new ComputedField(
		['border.radius', 'border.padding'],
		function(radius, padding){
		    if (!padding)
			return radius;
		    return (radius<6 ? Math.round(radius/2) : radius-3);
		}),
	    'caption.h1.style': textFormattingField('caption.h1.'),
	    'caption.h1.enable': new ComputedField(
		['caption.h1.type'],
		function(type){
		    return (type!='');
		}),
	    'caption.h1.finalText': new ComputedField(
		['caption.h1.type', 'caption.h1.text', 'title', 'caption.h1.style'],
		function(    type,              text,   title){
		    var ret='';
		    if (type=='text')
			ret=text;
		    else if (type=='title')
			ret=title;
		    return ret;		    
		}),
	    'caption.h1': new ComputedField(
		['caption.h1.finalText', 'caption.h1.style'],
		function(         text,              style){
		    return $('<h1>',{
			'style':style,
			'text':text
		    }).inspic('outerHtml');
		}),
	    'caption.p.style': textFormattingField('caption.p.'),
	    'caption.p': new ComputedField(
		['caption.p.enable', 'caption.p.text', 'caption.p.style'],
		function(enable,                text,             style){
		    if (!enable)
			return '';
		    return $('<p>', {
			'style': style,
			'text':text
		    }).inspic('outerHtml');
		}),
	    'caption': new ComputedField(
		['caption.p', 'caption.h1'],
		function(p, h1){
		    return h1+p;
		}),
	    'caption.preview': new ComputedField(
		['caption', 'caption.p.text', 'caption.h1.finalText', 'caption.p.style', 'caption.h1.style'],
		function(caption, p, h1, styleP, styleH1){
		    if (p || h1)
			return caption;
		    return ('<h1 style="'+styleH1+'">{عنوان زیرنویس}</h1><p style="'+styleP+'">{شرح زیرنویس}</p>');
		}),
	    'caption.type': new ComputedField(
		['caption.pos'],
		function(pos){
		    return (pos=='inner_top' || pos=='inner_bottom' ? 'inner' : 'outer');
		}),
	    'caption.vpos': new ComputedField(
		['caption.pos'],
		function(pos){
		    return (pos=='inner_top' || pos=='outer_top' ? 'top' : 'bottom');
		}),
	    'caption.inner.enable': new ComputedField(
		['caption.enable', 'caption.type'],
		function(enable, type){
		    return (enable && type=='inner');
		}),
	    'caption.outer.enable': new ComputedField(
		['caption.enable', 'caption.type'],
		function(enable, type){
		    return (enable && type=='outer');
		}),
	    'caption.inner.radius': new ComputedField(
		['border.radius.inner', 'caption.vpos', 'caption.inner.hpos'],
		function(radius,         vpos,           hpos){
		    var tl,tr,br,bl;
		    tl=tr=br=bl=radius;
		    vpos=='top' ? (br=bl=0) : (tl=tr=0);
		    hpos=='full' || (hpos=='left' ? (tr=br=0) : (tl=bl=0));
		    return _.map([tl,tr,br,bl], inspic.pixelize).join(' ');
		}),
	    'caption.inner.background': colorField('caption.inner.background.'),
	    'caption.outer.background': colorField('caption.outer.background.'),
	    'caption.outer.border': borderField('caption.outer.border.'),
	    'caption.p.color': new ComputedField(
		['caption.type', 'caption.p.color.inner', 'caption.p.color.outer'],
		function(type,                  inner,                 outer){
		    return (type=='inner' ? inner : outer);
		}),
	    'caption.h1.color': new ComputedField(
		['caption.type', 'caption.h1.color.inner', 'caption.h1.color.outer'],
		function(type,                  inner,                 outer){
		    return (type=='inner' ? inner : outer);
		})

	}
    });

    function colorField(prefix){
	//TODO: use it in shadowField and borderField
	return new ComputedField(
	    [prefix+'color', prefix+'alpha'],
	    function(color,alpha){
		return inspic.alphaColor(color || '#000', alpha);
	    }
	);
    }

    function shadowField(prefix){
	return new ComputedField(
	    _.map(
		['enable','x','y','blur','color','alpha','inset'],
		function(field){ return prefix+field; }
	    ),
	    function(enable, x, y, blur, color, alpha, inset){
		if (!enable)
		    return '';
		var p=inspic.pixelize;
		color=inspic.alphaColor(color || '#000', alpha);
		inset= inset ? 'inset' : '';
		return [p(x),p(y),p(blur),color,inset].join(' ');
	    }
	);
    }

    function borderField(prefix){
	return new ComputedField(
	    _.map(
		['enable','style','width','color','alpha'],
		function(field){ return prefix+field; }
	    ),
	    function(enable, style, width, color, alpha){
		var p=inspic.pixelize;
		if (!enable)
		    return '';
		if (!width && !_.isNumber(width))
		    width=1;
		if (style=='double' && width<3)
		    width=3;
		var ret=[p(width), style, inspic.alphaColor(color || '#000', alpha)].join(' ');
		return ret;
	    }
	);
    }
    
    function textFormattingField(prefix){
	return new ComputedField(
	    _.map(
		['bold','italic','color','size'],
		function(field){ return prefix+field; }
	    ),
	    function(bold,italic,color,size){
		bold=(bold ? 'bold' : 'normal');
		italic=(italic ? 'italic' : 'normal');
		color=color || '#000';
		size=inspic.pixelize(size || 10);
		return "font-weight:"+bold+"; font-style:"+italic+"; color:"+color+"; font-size:"+size+";";
	    }
	);
    }

    inspic.model.MainModel = MainModel;
    inspic.model.mainModel = new MainModel();

})(jQuery);

(function($) {
	inspic.view = {};
	var mainModel = inspic.model.mainModel;

	// load templates for later use from index.html
	var templates = {};
	$('[inspic_tem]').each(function() {
		var $this = $(this);
		templates[$this.attr('inspic_tem')] = _.template($this.html());
	});

	var InputField = Backbone.View.extend({
		tagName : 'span', // tag name of html [container] element
		className : 'inspic_inputfield', // class name of html [container]
		// element
		inputSelector : 'input', // selects html elements whos value should
		// be set to model
		template : 'text', // default underscore template name

		updateValue : function(val) {
			this.$inputSelector.inspic('val', val);
			this.$inputSelector.trigger('change', ['inspicView']);
		},

		updateDisability : function() {
			this.$('*').inspic('disabled', this.model.get('isLoading'));
		},

		initialize : function(field, args) {
			args || ( args = {});
			var model = this.model = mainModel;
			this.field = field;

			!args.events || (this.events = args.events);

			this.render(field, args);

			this.inputSelector && (this.$inputSelector = this.$(this.inputSelector));

			field && model.subscribe(field, this.updateValue, this)();

			var criteria = args.visibilityCriteria;
			if (criteria) {
				var $el = this.$el;
				model.subscribe(criteria,function(substituted) {
				$el.css('display',
				inspicEval(substituted) ? 'inline-block': 'none');
				})();
			}

			!args.subscribe || _.each(args.subscribe, function(val, key) {
				model.subscribe(key, val, this)();
			}, this);

			!args.initialize || (args.initialize.call(this, model));
		},

		events : {
			"change input" : "onChange",
		},

		// generate variables that will be passed to underscore template
		generateRenderVariables : function(args) {
			var data = _.pick(args, 'text', 'icon', 'options');
			var variables = {
				id : _.uniqueId('inspic_'),
				'data' : data
			};
			variables.label = templates['label'](variables);
			return variables;
		},

		render : function(field, args) {
			var variables = this.generateRenderVariables(args);
			this.$el.html(templates[this.template](variables));
			this.$el.attr({
				'field' : this.field,
				'title' : (args.text || '').replace(/:$/, '')
			});
		},

		onChange : function(e, inspicView) {
			if (inspicView == 'inspicView')
				return;
			inspic.controller.handleDefaultInputFieldChange(this.field, $(e.target).inspic('val'), this, e);
		}
	});
	inspic.view.InputField = InputField;

	var TextInputField = InputField.extend({
		template : 'text',
		render : function(field, args) {
			InputField.prototype.render.call(this, field, args);

			var width = args.width || 30;
			(width == 'long') && ( width = 250);

			this.$('input').css({
				'width' : width + 'px',
				'text-align' : args.textAlign || 'center',
				'direction' : (args.textAlign == 'right' ? 'rtl' : 'ltr')
			});

			// fields whose default value is number will have spinner
			if (( typeof (this.model.defaults[field])).toLowerCase() == "number" && !args.noSpinner)
				this.$el.find('input').inspic('spinner', args.spinnerArgs);
		},

		events : {
			"change input" : "onChange",
			"keyup input" : "onChange"
		}
	});

	var SelectInputField = InputField.extend({
		inputSelector : 'select',
		template : 'select',
		events : {
			'change select' : 'onChange'
		}
	});

	var IconSelectInputField = SelectInputField.extend({
		render : function(field, args) {
			SelectInputField.prototype.render.call(this, field, args);
			this.$('select').inspic('iconSelect', this.field);
		}
	});

	var CheckInputField = InputField.extend({
		template : 'checkbox'
	});

	var ColorInputField = InputField.extend({
		render : function(field, args) {
			InputField.prototype.render.call(this, field, args);
			this.$('input').colorPicker();
			args.colorPickerClass && this.$('.colorPicker-picker').addClass(args.colorPickerClass);
		}
	});

	/* *************************************************************************************************************
	 * */

	function appendTo(container) {
		return function ret(element) {
			ret.container = container;
			if (!element)
				return ret;
			!(element.el) || ( element = element.el);
			$(element).appendTo(container);
			return ret;
		};
	}

	function addSrcElements() {
		appendTo('#inspic_src')(new TextInputField('src', {
		text : 'آدرس:',
		width : 'long',
		textAlign : 'left',
		events : {
		"change input" : "onChange"
		}
		}))(new TextInputField('title', {
		text : 'عنوان:',
		width : 'long',
		textAlign : 'right',
		visibilityCriteria : '`src`'
		}))('<br>')(new SelectInputField('src.bayan.size', {
		text : 'اندازه:',
		options : {
		'کوچک' : 'thumb',
		'متوسط' : 'image_preview',
		'کامل' : 'view'
		},
		visibilityCriteria : '`src.bayan` && `src`'
		}))(function() {
		var wrapper = $('<span>');
		var scroller = inspic.scroller(function(val) {
		inspic.controller.setField('width', val * 1000);
		});
		mainModel.subscribe('width', function(width) {
		scroller.setScrollerValue(width / 1000);
		})();
		mainModel.subscribe('src', function(val) {
		wrapper.css('display', (val ? 'inline-block' : 'none'));
		})();

		wrapper.text('مقیاس: ');
		wrapper.addClass('inspic_inputfield');
		wrapper.append(scroller);
		return wrapper;
		}())(new TextInputField('width', {
		visibilityCriteria : '`src.adv` && `src`',
		text : 'پهنا:'
		}))(new TextInputField('height', {
		visibilityCriteria : '`src.adv` && `src`',
		text : 'ارتفاع:'
		}))(new CheckInputField('keep_ratio', {
			visibilityCriteria : '`src.adv` && `src`',
			text : 'حفظ تناسب ابعاد'
		}));

		appendTo('#inspic_link')
		(
		new SelectInputField(
		'href.type',
		{
		text : 'مقصد پیوند:',
		options : {
		'بدون پیوند' : 'none',
		'تصویر' : 'src',
		'اندازه کامل' : 'big',
		'url' : 'url'
		},
		subscribe : {
		'`src.bayan` && `src.bayan.size`!="view"' : function(
		substituted) {
		this.$('option[value="big"]')[inspicEval(substituted) ? 'show'
		: 'hide']();
		}
		}
		}))
		(
		new TextInputField('href.url', {
		width : 'long',
		textAlign : 'left',
		subscribe : {
		'`href.type`' : function(substituted) {
		substituted == '"url"' ? this.$('input')
		.css('display', 'inline-block')
		.focus().select() : this.$('input')
		.hide();
		}
		}
		}))
		(
		new TextInputField(
		'href',
		{
		width : 'long',
		textAlign : 'left',
		alwaysEnabled : true,
		visibilityCriteria : '`href.type`!="url" && `href.type`!="none"',
		initialize : function() {
		this.$('input')
		.inspic('disabled', true);
		}
		}))(new SelectInputField('href.target', {
			text : 'محل باز شدن:',
			visibilityCriteria : '`href.type`!="none" && `src.adv`',
			options : {
				'صفحه جدید' : '_blank',
				'صفحه فعلی' : '_self'
			}
		}));
	}

	/** ******************************************************************** */

	function addPositionElements() {

		/*
		 * appendTo('#inspic_position>legend')( new InputField('margin.adv',
		 * 'checkbox', { text: 'پیشرفته', initialize: function(){
		 * this.$el.css('float','left'); } }) );
		 */

		appendTo('#inspic_position')(new IconSelectInputField('position', {
		// text: 'چینش:',
		options : {
		'راست' : 'inline_right',
		'راست به تنهایی' : 'block_right',
		'وسط' : 'block_center',
		'داخل متن' : 'inline_none',
		'چپ به تنهایی' : 'block_left',
		'چپ' : 'inline_left'
		}
		}))('<br>')(new TextInputField('margin.base', {
		text : 'فاصله از متن:',
		visibilityCriteria : '!`margin.adv`'
		}))(new TextInputField('margin.top', {
		text : 'بالا',
		icon : 'mt',
		visibilityCriteria : 'margin.adv'
		}))(new TextInputField('margin.right', {
		text : 'راست',
		icon : 'mr',
		visibilityCriteria : 'margin.adv'
		}))(new TextInputField('margin.bottom', {
		text : 'پایین',
		icon : 'mb',
		visibilityCriteria : 'margin.adv'
		}))(new TextInputField('margin.left', {
			text : 'چپ',
			icon : 'ml',
			visibilityCriteria : 'margin.adv'
		}));

		var $margin = $('#insertPicture .preview .pic_margin');
		$(document).on('focus mouseenter', '[field*="margin"] *', function() {
			$margin.css('backgroundColor', '#fbfd98');
		}).on('blur mouseout', '[field*="margin"] *', function() {
			$margin.css('backgroundColor', '#fff');
		});

	}

	/** *******************************************************************************
	 * */

	function addBorderElements() {

		/*
		 * new InputField('border.adv', 'checkbox', { text: 'پیشرفته',
		 * initialize: function(){ this.$el.css('float','left'); }
		 * }).$el.appendTo('#inspic_border>legend');
		 */

		var inner = shadowFields('سایه داخلی:', 'innerShadow.', 'border.adv', 'x,y,alpha'.split(','));
		var borderline = borderFields('borderline.', 'border.adv', ['width']);
		var outer = shadowFields('سایه خارجی:', 'outerShadow.', 'border.adv', 'x,y,alpha'.split(','));

		appendTo('#inspic_border')
		(inner.enable)
		(inner.color)
		(inner.blur)
		(inner.x)
		(inner.y)
		(inner.alpha)
		('<br>')
		(borderline.enable)
		(borderline.style)
		(borderline.color)
		(
		new TextInputField(
		'border.padding.raw',
		{
		text : 'فاصله کادر بیرونی با تصویر',
		icon : 'padding',
		visibilityCriteria : '`outerShadow.enable` || `borderline.style`'
		}))
		(
		new ColorInputField(
		'border.background',
		{
		// text: 'رنگ بین کادر و تصویر',
		// icon: 'paint-can-left.png',
		colorPickerClass : 'picker-arrow-paint',
		visibilityCriteria : '`border.adv` && (`outerShadow.enable` || `borderline.style`)'
		}))(borderline.width)(
		new TextInputField('border.radius', {
		text : 'شعاع انحنای لبه ها',
		icon : 'radius',
		visibilityCriteria : 'border.adv'
		}))('<br>')(outer.enable)(outer.color)(outer.blur)(
		outer.x)(outer.y)(outer.alpha);
	}

	/** ******************************************************************************
	 * */

	function textFormattingFields(prefix, advField, advs) {
		var vis = '`' + prefix + 'enable`';
		var visAdv = vis + ' && `' + advField + '`';

		function crit(field) {
			// return (_.include(advs, field) ? visAdv : vis);
			return visAdv;
		}

		var BoolInputField = InputField.extend({
			tagName : 'span',
			className : 'iconSelectItem',
			template : 'bool',
			updateValue : function(val) {
				this.$el[(val ? 'addClass' : 'removeClass')]('selected');
			},
			events : {
				"click" : "onChange"
			},
			onChange : function(e, inspicView) {
				$(e.target).inspic('val', !this.model.get(this.field));
				InputField.prototype.onChange.call(this, e, inspicView);
			}
		});

		var BoolGroup = InputField.extend({
			initialize : function(fields, args) {
				this.fields = fields;
				InputField.prototype.initialize.call(this, 'testField', args);
			},
			render : function() {
				var $el = $('<span class="iconSelect">').appendTo(this.$el);
				_.each(this.fields, function(x, i) {
					i || x.$el.addClass('first');
					$el.append(x.$el);
				});
			}
		});

		return {
			boldItalic : new BoolGroup([new BoolInputField(prefix + 'bold', {
				text : 'bold',
				icon : 'bold'
			}), new BoolInputField(prefix + 'italic', {
				text : 'italic',
				icon : 'italic'
			})], {
				visibilityCriteria : crit('boldItalic')
			}),
			colorInner : new ColorInputField(prefix + 'color.inner', {
				visibilityCriteria : crit('color') + ' && `caption.inner.enable`',
				colorPickerClass : 'picker-arrow-text'
			}),
			colorOuter : new ColorInputField(prefix + 'color.outer', {
				visibilityCriteria : crit('color') + ' && `caption.outer.enable`',
				colorPickerClass : 'picker-arrow-text'
			}),
			size : new TextInputField(prefix + 'size', {
				visibilityCriteria : crit('size'),
				text : 'اندازه فونت',
				icon : 'fontsize'
			})
		};
	}

	function borderFields(prefix, advField, advs, enableTitle) {
		var vis = '`' + prefix + 'enable`';
		var visAdv = vis + ' && `' + advField + '`';

		function crit(field) {
			return (_.include(advs, field) ? visAdv : vis);
		}

		return {
			enable : new CheckInputField(prefix + 'enable', {
				text : enableTitle || 'خط'
			}),
			style : new IconSelectInputField(prefix + 'style', {
				visibilityCriteria : crit('style'),
				// text: 'نوع خط',
				options : {
					// 'بدون خط':'',
					'خط ساده' : 'solid',
					'خط چین' : 'dashed',
					'نقطه چین' : 'dotted',
					'دو خطی' : 'double'
				}
			}),
			width : new TextInputField(prefix + 'width', {
				visibilityCriteria : crit('width'),
				text : 'ضخامت خط',
				icon : 'bwidth'
			}),
			color : new ColorInputField(prefix + 'color', {
				visibilityCriteria : crit('color'),
				// text: 'زنگ خط',
				// icon: 'line.gif',
				colorPickerClass : 'picker-arrow-line'
			})
		};
	}

	function shadowFields(text, prefix, advField, advs) {
		var vis = prefix + 'enable';
		var visAdv = '`' + vis + '` && `' + advField + '`';

		function crit(field) {
			return (_.include(advs, field) ? visAdv : vis);
		}

		return {
			alpha : new TextInputField(prefix + 'alpha', {
				visibilityCriteria : crit('alpha'),
				text : 'شفافیت',
				icon : 'alpha',
				spinnerArgs : {
					step : 0.1,
					min : 0,
					max : 1
				}
			}),
			y : new TextInputField(prefix + 'y', {
				visibilityCriteria : crit('y'),
				text : 'فاصله عمودی سایه با تصویر',
				icon : 'sh-y',
				spinnerArgs : {
					min : -50
				}
			}),
			x : new TextInputField(prefix + 'x', {
				visibilityCriteria : crit('x'),
				text : 'فاصله افقی سایه با تصویر',
				icon : 'sh-x',
				spinnerArgs : {
					min : -50
				}
			}),
			blur : new TextInputField(prefix + 'blur', {
				visibilityCriteria : crit('blur'),
				text : 'بزرگی سایه',
				icon : 'sh-rad'
			}),
			color : new ColorInputField(prefix + 'color', {
				visibilityCriteria : crit('color'),
				colorPickerClass : 'picker-arrow-line'
			}),
			enable : new CheckInputField(prefix + 'enable', {
				'text' : text
			})
		};
	}

	/** *****************************************************************************
	 * */

	function addCaptionElements() {

		var outerBorder = borderFields('caption.outer.border.', 'caption.adv', ['style'], 'کادر');
		var h1Format = textFormattingFields('caption.h1.', 'caption.adv', []);
		var pFormat = textFormattingFields('caption.p.', 'caption.adv', []);

		/*
		 * appendTo('#inspic_caption legend')( new InputField('caption.adv',
		 * 'checkbox', { text: 'پیشرفته', initialize: function(){
		 * this.$el.css('float','left'); } }) );
		 */

		appendTo('#inspic_caption')
		(new CheckInputField('caption.enable', {
		text : 'فعال'
		}))
		(new IconSelectInputField('caption.pos', {
		// text: 'نوع:',
		visibilityCriteria : 'caption.enable',
		options : {
		'خارج پایین' : 'outer_top',
		'داخل بالا' : 'inner_top',
		'داخل پایین' : 'inner_bottom',
		'خارج بالا' : 'outer_bottom'
		}
		}))
		(
		new IconSelectInputField('caption.inner.hpos', {
		// text: 'افقی',
		options : {
		'راست' : 'right',
		'کامل' : 'full',
		'چپ' : 'left'
		},
		visibilityCriteria : 'caption.inner.enable',
		subscribe : {
		'caption.vpos' : function(vpos) {
		var $el = this.$('.iconSelect')
		.removeClass("posTop posBottom");
		$el.addClass(vpos == 'top' ? 'posTop'
		: 'posBottom');
		}
		}
		}))
		(new IconSelectInputField('caption.textAlign', {
		// text: 'چینش متن:',
		visibilityCriteria : 'caption.enable',
		options : {
		'راست' : 'right',
		'وسط' : 'center',
		'چپ' : 'left'
		}
		}))
		(new ColorInputField('caption.inner.background.color', {
		visibilityCriteria : 'caption.inner.enable',
		// icon: 'paint-can-left.png',
		// text:'رنگ داخل:',
		colorPickerClass : 'picker-arrow-paint'
		}))
		(new TextInputField('caption.inner.background.alpha', {
		visibilityCriteria : 'caption.inner.enable',
		text : 'شفافیت رنگ داخل',
		icon : 'alpha',
		spinnerArgs : {
		step : 0.1,
		min : 0,
		max : 1
		}
		}))
		(
		appendTo(
		(function() {
		var ret = $('<span>');
		inspic.model.mainModel.subscribe(
		'caption.outer.enable',
		function(val) {
		ret.css('display',
		val ? 'inline-block'
		: 'none');
		})();
		return ret;
		})())
		(outerBorder.enable)
		(outerBorder.style)
		(outerBorder.color)
		(outerBorder.width)
		(
		new TextInputField(
		'caption.outer.padding',
		{
		visibilityCriteria : 'caption.outer.border.enable',
		text : 'فاصله تا کادر بیرونی',
		icon : 'padding'
		}))
		(
		new TextInputField(
		'caption.outer.radius',
		{
		visibilityCriteria : 'caption.outer.border.enable',
		text : 'شعاع انحنای لبه کادر بیرونی',
		icon : 'radius'
		}))
		(
		new ColorInputField(
		'caption.outer.background.color',
		{
		visibilityCriteria : 'caption.outer.border.enable',
		// text:'رنگ داخل:',
		// icon:
		// 'paint-can-left.png',
		colorPickerClass : 'picker-arrow-paint'
		}))
		(
		new TextInputField(
		'caption.outer.background.alpha',
		{
		visibilityCriteria : '`caption.outer.border.enable` && `caption.adv`',
		text : 'شفافیت رنگ داخل',
		icon : 'transparency',
		spinnerArgs : {
		step : 0.1,
		min : 0,
		max : 1
		}
		})).container)
		('<br>')
		(
		new SelectInputField(
		'caption.h1.type',
		{
		text : 'عنوان زیرنویس:',
		visibilityCriteria : 'caption.enable',
		options : {
		'بدون عنوان' : '',
		'عنوان تصویر' : 'title',
		'متن' : 'text'
		},
		subscribe : {
		'title' : function(val) {
		this.$('option[value="title"]')[val ? 'show'
		: 'hide']();
		}
		}
		}))
		(
		new TextInputField(
		'caption.h1.text',
		{
		visibilityCriteria : '`caption.enable` && `caption.h1.type`=="text"',
		width : 'long',
		textAlign : 'right'
		}))
		(h1Format.colorInner)
		(h1Format.colorOuter)
		(h1Format.size)
		(h1Format.boldItalic)
		('<br>')
		(new CheckInputField('caption.p.enable', {
		text : 'شرح:',
		visibilityCriteria : 'caption.enable'
		}))
		(
		new TextInputField(
		'caption.p.text',
		{
		visibilityCriteria : '`caption.p.enable` && `caption.enable`',
		width : 'long',
		textAlign : 'right'
		}))(pFormat.colorInner)(pFormat.colorOuter)(
		pFormat.size)(pFormat.boldItalic)('<br>');
	}

	function tabularize() {
		$('#insertPicture .tabs>div').inspic('tabularize', '.tab_headers');
		var $headers = $('#insertPicture .tab_headers>span[for]');
		mainModel.subscribe('src', function(val) {
			$headers.inspic('disabled', !val).first().inspic('disabled', false);
		});

		$('<span>', {
			'class' : 'inspic_button submit',
			text : 'درج',
			click : function() {
				inspic.callback && inspic.callback(inspic.getHtml());
			}
		}).appendTo('.tab_headers');
		$('<span>', {
			'class' : 'inspic_button cancel',
			text : 'انصراف',
			click : function() {
				inspic.callback && inspic.callback();
			}
		}).appendTo('.tab_headers');
		new CheckInputField('adv', {
			text : 'نمایش تنظیمات پیشرفته'
		}).$el.appendTo('.tab_headers');
	}

	function addElements() {
		addSrcElements();
		addPositionElements();
		addBorderElements();
		addCaptionElements();
		tabularize();
	}


	inspic.view.addElements = addElements;

})(jQuery);
(function($) {
    var controller=inspic.controller = {};
    var model = inspic.model.mainModel;

    function numberize(s){
	if (_.isNumber(s))
	    return s;
	s=s||'';
	//persian letters:
	s=s.replace(/[\u06f0-\u06f9]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-1776+48); });

	return parseFloat(s.replace(/[^\d\-\.]/g,''));
    }

    function set(field,val){
	model.set(field,val);
    }

    function get(field){
	return model.get(field);
    }
    
    function setField(field,value,e){
	var setter;
	var type=typeof(model.defaults[field]);
	if (type=="number")
	    value=numberize(value);
	else if (type=="boolean"){
	    value=inspic.parseBool(value);
	}
	if (_.isNaN(value))
	    return;
	if ((setter=modelFieldSetters[field])){
	    setter.call(model,value,e);
	} else {
	    set(field,value);
	} 
    }
    controller.setField=setField;
    controller.handleDefaultInputFieldChange=setField;

    function setFields(dict){
	for (var field in dict)
	    setField(field, dict[field]);
    }
    controller.setFields=setFields;

    function bayanSizedUrl(url, size){
	return url.replace(/\?.*$/,'')+'?'+size;
    }
    controller.bayanSizedUrl=bayanSizedUrl;

    var modelFieldSetters = {
	//in all these functions, this is equal to model
	'src' : function(url) {
	    var newImg = $(new Image()).hide().appendTo('body');

	    function handleSuccess(){
		set('isLoading', false);
		set('src', url);
		set('src.width', newImg.width());
		set('src.height', newImg.height());
		set('height', newImg.height());
		set('width', newImg.width());
		var bayan = url.match(/^(https?:\/\/)?(www\.)?bayanbox\.ir\/[^?]*(\?(thumb|image_preview|view))?$/);
		if (bayan) {
		    set('src.bayan', true);
		    var matchedSize = bayan[4];
		    set('src.bayan.size', matchedSize || null);
		} else {
		    set('src.bayan', false);
		}
		newImg.remove();
	    }
	    function handleError(){
		set('isLoading', false);
		set('src', null);
		set('src.bayan', false);
		alert('آدرس تصویر معتبر نیست');
		newImg.remove();
	    }
	    
	    newImg.load(handleSuccess).error(handleError);
	    
	    if (url){
		set('isLoading', true);
		newImg.attr('src', url);
	    } else
		handleError();
	},

	'src.bayan.size': function(size){
	    if (!get('src.bayan'))
		return;
	    setField('src',bayanSizedUrl(get('src'), size));
	},

	'width': function(val){
	    val=numberize(val);
	    val=Math.round(val);
	    set('width', val);
	    if (get('keep_ratio'))
		set('height', Math.round(val*get('src.height')/get('src.width')));
	},
	
	'height': function(val){
	    val=numberize(val);
	    val=Math.round(val);
	    set('height', val);
	    if (get('keep_ratio'))
		set('width', Math.round(val*get('src.width')/get('src.height')));
	},

	'keep_ratio': function(val){
	    set('keep_ratio', val);
	    if (val)
		setField('width', get('width'));
	},
	
	'position': function(val){
	    set('position', val);
	    var sep=val.split('_');
	    set('position.clearfix', sep[0]=='block');
	    set('position.textAlign', sep[0]=='block' ? sep[1] : null);
	    set('position.float', sep[0]=='block' ? 'none' : sep[1]);
	    if (!get('margin.adv'))
		set('margin.base', val=='inline_none' ? 3 : 10);
	},
	
	'adv': function(val){
	    setField('margin.adv', val);
	    setField('caption.adv', val);
	    setField('border.adv', val);
	    setField('src.adv', val);
	    set('adv', val);
	},
	
	'margin.adv': function(val){
	    if (val){
		var $tmp=$('<div>').css('margin',get('margin'));
		setField('margin.top', $tmp.css('marginTop'));
		setField('margin.bottom', $tmp.css('marginBottom'));
		setField('margin.right', $tmp.css('marginRight'));
		setField('margin.left', $tmp.css('marginLeft'));
	    } else {
		var args=_.map(['margin.top', 'margin.right', 'margin.bottom', 'margin.left', 'position', 'margin.base', 'outerShadow.enable', 'outerShadow.blur', 'outerShadow.x', 'outerShadow.y'], function(field){
		    return this.get(field);
		}, this);
		var base=this.autoMarginInv.apply(this, args);
		set('margin.base', base);
	    }
	    set('margin.adv', val);
	},
	
	'caption.enable': function(val){
	    set('caption.enable', val);
	    if (val){
		;
	    }
	}
    };
    
})(jQuery);
(function($){

    var mainModel=inspic.model.mainModel;

    var ImagePreview = Backbone.View.extend({
	initialize : function() {
	    var model = this.model = mainModel;
	    var img= this.$('.imagePreview img');
	    var loading = this.$('.loading');
	    var imagePreview = this.$('.imagePreview');

	    model.subscribe('src', function(src){
		var el = $('<img>').attr('src', src);
		img.replaceWith(el);
		img = el;// update img variable
		updateDimensions();
	    })();
	    
	    function updateDimensions() {
		var width = model.get('width');
		var height = model.get('height');
		_.isUndefined(width) || (img.css('width', _.isNumber(width) ? width + 'px' : 'auto'));
		_.isUndefined(height) || (img.css('height', _.isNumber(height) ? height + 'px' : 'auto'));
	    }
	    model.on('change:width change:height', updateDimensions, this);
	    
	    model.subscribe('`src` && `isLoading`', function(val){
		loading[inspicEval(val) ? 'show' : 'hide']();
	    })();
	    
	    model.subscribe('`src` && !(`isLoading`)', function(val){
		imagePreview[inspicEval(val) ? 'show' : 'hide']();
	    })();
	}
    });

    var PositionPreview = Backbone.View.extend({
	initialize: function(){
	    var model=this.model=mainModel;
	    var $clearfix=this.$('.inspic_clearfix');
	    var $margin=this.$('.pic_margin');
	    var $wrapper=this.$('.pic_wrapper');
	    var $img=this.$('img');
	    model.subscribe('position.clearfix', function(val){
		$clearfix[val ? 'addClass' : 'removeClass']('pic_clearfix');
	    })();
	    model.subscribe('position.float', function(val){
		$margin.css('float', val);
	    })();
	    model.subscribe('position.textAlign', function(val){
		$clearfix.css('text-align', val);
	    })();
	    model.subscribe('margin', function(val){
		$wrapper.css('margin', val);
	    })();
	    model.subscribe('outerShadow', function(val){
		$img.css('box-shadow', val);
	    })();
	}
    });


    var BorderPreview=Backbone.View.extend({
	initialize: function(){
	    var model=this.model=mainModel;
	    var $border=this.$('.pic_border');
	    var $inner=this.$('.pic_inner');
	    var _this=this;
	    var p=inspic.pixelize;
	    model.subscribe('innerShadow', function(val){
		$inner.css('box-shadow', val);
	    })();
	    model.subscribe('borderline', function(val){
		$border.css('border', val);
	    })();
	    model.subscribe('outerShadow', function(val){
		$border.css('box-shadow', val);
	    })();
	    model.subscribe('border.padding', function(val){
		$border.css('padding', p(val));
	    })();
	    model.subscribe('border.background', function(val){
		$border.css('background-color', val);
	    })();
	    model.subscribe('border.radius', function(val){
		$border.css('border-radius', p(val));
	    })();
	    model.subscribe('border.radius.inner', function(val){
		$inner.css('border-radius', p(val));
	    })();
	    model.subscribe('`border.radius.inner` `src`', function(){
		_this.$('img').css('border-radius', p(model.get('border.radius.inner')));
	    })();
	}
    });

    var InnerCaptionPreview=Backbone.View.extend({
	initialize: function(){
	    var model=this.model=mainModel;
	    var $el=this.$el;
	    model.subscribe('caption.inner.enable', function(val){
		$el[val ? 'show' : 'hide']();
	    })();
	    model.subscribe('caption.textAlign', function(val){
		$el.css('text-align', val);
	    })();
	    model.subscribe('caption.preview', function(content){
		$el.html(content);
	    })();
	    model.subscribe('caption.vpos', function(val){
		$el.css({
		    top: (val=='top' ? '0' : 'auto'),
		    bottom: (val=='bottom' ? '0' : 'auto')
		});
	    })();
	    model.subscribe('caption.inner.hpos', function(val){
		$el.css({
		    left : (val == 'left' || val == 'full') ? '0' : 'auto',
		    right : (val == 'right' || val == 'full') ? '0' : 'auto'
		});
	    })();
	    model.subscribe('caption.inner.background', function(val){
		$el.css('background-color', val);
	    })();
	    model.subscribe('caption.inner.radius', function(val){
		$el.css('border-radius', val);
	    })();
	}
    });

    var OuterCaptionPreview=Backbone.View.extend({
	initialize: function(){
	    var model=this.model=mainModel;
	    var $el=this.$el;
	    var $wrapper=$el.closest('.pic_wrapper');
	    var p=inspic.pixelize;
	    model.subscribe('caption.outer.enable', function(val){
		$el.css('display', (val ? 'block' : 'none'));
		//$el[val=='outer' ? 'show': 'hide']();
	    })();
	    model.subscribe('caption.textAlign', function(val){
		$el.css('text-align', val);
	    })();
	    model.subscribe('caption.preview', function(content){
		$el.html(content);
	    })();
	    model.subscribe('`caption.outer.enable` && `caption.outer.border`', function(val){
		$wrapper.css('border', inspicEval(val) || '');
	    })();
	    model.subscribe('`caption.outer.enable` && `caption.outer.background`', function(val){
		$wrapper.css('background-color', inspicEval(val) || '');
	    })();
	    model.subscribe('`caption.outer.enable` && `caption.outer.padding`', function(val){
		$wrapper.css('padding', p(inspicEval(val) || 0));
	    })();
	    model.subscribe('`caption.outer.enable` && `caption.outer.radius`', function(val){
		$wrapper.css('border-radius', p(inspicEval(val || 0)) );
	    })();
	    model.subscribe('caption.vpos', function(val){
		$el[(val=='top' ? 'prependTo' : 'appendTo')]($wrapper);
	    })();
	}
    });

    function addPreviews(){
	new ImagePreview({
	    el : $('#insertPicture .preview')
	});
	new BorderPreview({
	    el: $('#insertPicture .imagePreview')
	});
	new PositionPreview({
	    el: $('#insertPicture .imagePreview')
	});
	new InnerCaptionPreview({
	    el: $('#insertPicture .pic_caption_inner')
	});
	new OuterCaptionPreview({
	    el: $('#insertPicture .pic_caption_outer')
	});
    }
    inspic.view.addPreviews=addPreviews;

})(jQuery);(function($) {

    var model=inspic.model.mainModel;
    function g(x){
	var ret=model.get(x);
	var type=typeof(model.defaults[x]);
	if (type=='boolean')
	    ret=(ret ? 1 : '');
	return ret;
    }
    
    function genData(model, g){
	var ret={};

	function getPrefixArray(prefix, fields){
	    return _.map(fields, function(field){
		return g(prefix+field);
	    });
	}

	if (g('src.width')!=g('width') || g('src.height')!=g('height'))
	    ret['src']=getPrefixArray('', ['width', 'height', 'keep_ratio']);

	if (g('href.type')!='none')
	    ret['hrf']=g('href.type');
	
	ret['etc']=getPrefixArray('', ['position','adv']);

	ret['mrg']=getPrefixArray('margin.', ['base','top', 'right', 'bottom', 'left']);

	var shadowFields=['blur','x','y','color','alpha','inset'];
	if (g('innerShadow.enable'))
	    ret['ish']=getPrefixArray('innerShadow.', shadowFields);
	if (g('outerShadow.enable'))
	    ret['osh']=getPrefixArray('outerShadow.', shadowFields);
	
	ret['bdr']=getPrefixArray('border.', ['padding.raw','radius','background']);
	var borderFields=['color','style','width'];
	if (g('borderline.enable')){
	    ret['bdr'].push(getPrefixArray('borderline.', borderFields));
	}

	if (g('caption.enable')){
	    var type=g('caption.type');
	    ret['cap']=getPrefixArray('caption.',['pos','textAlign',type+'.background.color',type+'.background.alpha']);
	    
	    if (type=='inner'){
		ret['cap'].push(getPrefixArray('caption.inner.', ['hpos']));
	    }else{
		ret['cap'].push(getPrefixArray('caption.outer.', ['padding','radius']));
		if (g('caption.outer.border.enable'))
		    ret['cap'].push(getPrefixArray('caption.outer.border.', borderFields));
	    }
	    
	    var formatFields=['type','bold','italic','color.'+type, 'size'];
	    if (g('caption.h1.enable'))
		ret['h1']=getPrefixArray('caption.h1.', formatFields);
	    if (g('caption.p.enable'))
		ret['p']=getPrefixArray('caption.p.', formatFields);
	    
	}
	return ret;
    }
    
     function stringify(data){
	 return _.map(_.keys(data), function(key){
			  return (_.flatten([key, data[key]]).join('|'));
		      }).join(',');	 
     }

     function getHtml(model){
	model=model || inspic.model.mainModel;
	var data={};
	var p = inspic.pixelize;
	var ph; // placeholder
	
	//Image
	var img = $('<img>');
	img.attr('src', g('src'));
	img.inspic('css','width', p(g('width')));
	img.inspic('css','height', p(g('height')));
	if (g('title')) {
	    img.attr('alt', g('title'));
	    img.attr('title', g('title'));
	}
	if (g('border.radius'))
	    img.inspic('css','border-radius', p(g('border.radius.inner')));

	ph = img;

	//InnerShadow and InnerCaption
	if ( g('innerShadow.enable') || (g('caption.inner.enable') && g('caption').trim()) ) {
	    var inner = $('<span class="pic_inner">');
	    inner.append(ph);
	    // InnerShadow
	    if (g('innerShadow.enable'))
		inner.inspic('css','box-shadow', g('innerShadow'));
	    
	    g('border.radius') && inner.inspic('css','border-radius', p(g('border.radius.inner')));

	    // InnerCaption
	    if (g('caption.inner.enable') && g('caption').trim()){
		var caption = $('<span class="pic_caption_inner">');
		caption.html(g('caption').trim());
		caption.inspic('css','text-align',g('caption.textAlign'));
		g('caption.vpos')=='top' && caption.inspic('css','top','0');
		g('caption.vpos')=='bottom' && caption.inspic('css','bottom','0');
		g('caption.inner.hpos').match(/left|full/) && caption.inspic('css','left', '0');
		g('caption.inner.hpos').match(/right|full/) && caption.inspic('css','right', '0');
		caption.inspic('css','background-color', g('caption.inner.background'));
		caption.inspic('css','border-radius', g('caption.inner.radius'));
		
		inner.append(caption);
	    }

	    ph = inner;
	}
	
	//span pic_border
	if ( ( g('border.padding') && (g('innerShadow.enable') || g('caption.inner.enable')) ) || 
	     ( !g('border.padding') && g('outerShadow.enable') && g('innerShadow.enable') ) ){
	    var border= $('<span class="pic_border">');
	    border.append(ph);
	    ph=border;
	}

	//padding and background
	if (g('border.padding')){
	    ph.inspic('css', 'padding', p(g('border.padding')));
	    ph.inspic('css', 'background-color', g('border.background'));
	}

	//radius (outer)
	g('border.radius') && ph.inspic('css', 'border-radius', p(g('border.radius')));
	
	//Borderline and OuterShadow
	g('borderline.enable') && ph.inspic('css', 'border', g('borderline'));
	g('outerShadow.enable') && ph.inspic('css', 'box-shadow', g('outerShadow'));

	//title (outer)
	g('title') && ph.attr('title', g('title'));

	//Anchor (href)
	if (g('href')){
	    if (ph.prop('tagName').toLowerCase()=='span'){
		var code=ph.inspic('outerHtml');
		code=code.replace(/^<span/,'<a').replace(/span>$/,'a>');
		ph=$(code);
	    } else{
		ph=ph.wrap('<a/>').parent();
	    }
	    ph.attr('href', g('href'));
	    g('href.target') && ph.attr('target', g('href.target'));
	}
	
	// OuterCaption and pic_wrapper
	if (g('caption.outer.enable') && g('caption').trim()) {
	    var wrapper = $('<span class="pic_wrapper">');
	    g('caption.outer.border.enable') && wrapper.inspic('css','border', g('caption.outer.border'));
	    wrapper.inspic('css', 'background-color', g('caption.outer.background'));
	    wrapper.inspic('css', 'padding', p(g('caption.outer.padding')));
	    wrapper.inspic('css', 'border-radius', p(g('caption.outer.radius')));
	    //FIXME: width of outerCaption should be calculated by model and must not depend on view! 
	    var width=$('#insertPicture .preview .pic_wrapper').width();
	    width && wrapper.inspic('css', 'width', p(width));
	    
	    var caption = $('<span class="pic_caption_outer">');
	    caption.text(g('caption'));
	    caption.inspic('css', 'color', g('caption.outer.forecolor'));
	    caption.inspic('css', 'text-align', g('caption.textAlign'));

	    wrapper.append(ph);
	    wrapper[g('caption.vpos') == 'top' ? 'prepend' : 'append'](caption);
	    
	    ph = wrapper;
	} 

	//Position
	ph.inspic('css','float', g('position.float'));
	if (g('position.clearfix')) {
	    var margin = $('<span class="pic_clearfix">');
	    margin.inspic('css','text-align', g('position.textAlign'));
	    margin.append(ph);
	    ph = margin;
	}

	//Margin
	ph.inspic('css','margin', g('margin'));

	var data=genData(model,g);
	//Version
	data['ver']=g('version');

	var dataAttr=stringify(data);
	ph.attr('data-inspic', dataAttr);

	 return ph.inspic('outerHtml');
    }
    inspic.getHtml=getHtml;
    
    var Output=Backbone.View.extend({
	initialize: function(options){
	    var window=this.window=open('output.html','inspic_output', options.specs);
	    this.setElement(window);
	    this.model.on('change', function(){
		window.focus();
		this.render();
	    }, this);
	    
	},

	render: function(){
	    var html=getHtml();
	    //this.$el.find('body', this.window.document).html(ph);
	    var q=$('#inspic_output',this.window.document).html(html);
	    $('#inspic_output_code',this.window.document).text(html);
	}
    });
    inspic.view.Output=Output;

    function saveCookie(){
	var data=_.omit(genData(model,g), 'src');
	$.cookie('inspicData', stringify(data));
    }
    inspic.saveCookie=saveCookie;
})(jQuery);(function($) {
    
    function setHtml(html) {
	try{
	    var set={};
	    var $html = $('<html>').html(html);

	    var data=$html.find('[inspic]').attr('inspic');
	    if (data){
		var dict={};
		_.each(data.split(','), function(s){
		    var arr=s.split('|');
		    if (arr.length<2)
			return;
		    dict[arr[0]]= (arr.length==2 ? arr[1] : arr.splice(1));
		});
		data=dict;
	    } else
		data={};

	    function setPrefixArray(array, prefix, fields){
		fields=_.map(fields, function(field){
		    return prefix+field;
		});
		fields=_.object(fields, array);
		_.extend(set, fields);
	    }
	    
	    var $img= $html.find('img[src]').first();
	    if ($img.length){
		set['src']=$img.attr('src');
		set['title']=($img.attr('alt') || $img.attr('title') || '');
	    }
	    
	    set['href.url']= $html.find('[href]').attr('href') || '';
	    set['href.type']=data['hrf'] || 'none';

	    if (data['etc'])
		setPrefixArray(data['etc'], '', ['position', 'adv']);
	    
	    if (data['mrg'])
		setPrefixArray(data['mrg'], 'margin.', ['base','top', 'right', 'bottom', 'left']);

	    function shadowFields(dataField, prefix){
		var arr=data[dataField];
		if (set[prefix+'enable']=_.isArray(arr))
		    setPrefixArray(arr,prefix, ['blur', 'x', 'y', 'color', 'alpha','inset']);
	    }
	    shadowFields('ish', 'innerShadow.');
	    shadowFields('osh', 'outerShadow.');

	    var borderFields=['color','style','width'];
	    var arr=data['bdr'];
	    if (_.isArray(arr)){
		setPrefixArray(arr, 'border.', ['padding.raw', 'radius', 'background']);
		if (set['borderline.enable']=(arr.length>3))
		    setPrefixArray(arr.splice(3), 'borderline.', borderFields);
	    }

	    var arr=data['cap'];
	    if (arr){
		set['caption.enable']=true;
		var type=arr[0].replace(/_.*^/,'');
		setPrefixArray(arr, 'caption.', ['pos', 'textAlign', type+'.background.color', type+'.background.alpha']);
		arr=arr.splice(4);
		if (type=='inner')
		    setPrefixArray(arr, 'caption.inner.', ['hpos']);
		else{
		    setPrefixArray(arr, 'caption.outer.', ['padding', 'radius']);
		    if (arr.length>2){
			set['caption.outer.border.enable']=true;
			setPrefixArray(arr.splice(2), 'caption.outer.border.', borderFields);
		    } else
			set['caption.outer.border.enable']=false;
		}

		var formatFields=['type', 'bold', 'italic', 'color.'+type, 'size'];
		arr=data['h1'];
		if (set['caption.h1.enable']=_.isArray(arr)){
		    setPrefixArray(arr, 'caption.h1.', formatFields);
		    set['caption.h1.text']=$html.find('h1').text() || '';
		}

		arr=data['p'];
		if (set['caption.p.enable']=_.isArray(arr)){
		    setPrefixArray(arr, 'caption.p.', formatFields);
		    set['caption.p.text']=$html.find('p').text() || '';
		}
	    } else
		set['capion.enable']=false;

	    inspic.model.mainModel.set(inspic.model.mainModel.defaults);
	    inspic.controller.setFields(set);
	} catch(ex) {
	    console.log('Exception',ex);
	    
	}
    }

    inspic.setHtml = setHtml;

    function loadCookie(){
	var data=$.cookie('inspicData');
	if (data)
	setHtml('<img data-inspic="'+data+'">');
    }
    inspic.loadCookie=loadCookie;
})(jQuery); 
(function($){
    var body='<div id="insertPicture">'+
        '<div class="tab_headers"></div>'+
        '<div class="tabs">'+
        '<div id="inspic_src" tab_title="مشخصات تصویر"></div>'+
        '<div id="inspic_link" tab_title="پیوند"></div>'+
        '<div id="inspic_position" tab_title="جایگاه در متن"></div>'+
        '<div id="inspic_border" tab_title="کادر و سایه"></div>'+
        '<div id="inspic_caption" tab_title="زیر نویس"></div>'+
        '</div>'+
        '<hr>'+
        '<div class="preview">'+
        '<div class="imagePreview">'+
        '<span> بلاگ رسانه ای است برای متخصصان تا با استفاده از امکانات پیشرفته ، حضور موثرتری در اینترنت داشته باشند. </span>'+
        '<span class="inspic_clearfix"> <span class="pic_margin"> <span class="pic_wrapper"> <span class="pic_border"> <span class="pic_inner"> <span class="pic_caption_inner"></span> <img> </span> </span> <span class="pic_caption_outer"> </span> </span> </span> </span>'+
        '<span> سعی ما در بلاگ بر این است تا به ساده ترین نحو ممکن این فرصت را برای نخبگان، محققان، هنرمندان، اهل قلم و بلاگ نویسان حرفه ای فراهم آوریم تا بتوانند بدون پرداخت هزینه و فارغ از دغدغه های فنی، بر تولید و نشر آثار خود تمرکز کنند. </span>'+
        '</div>'+
        '<div class="loading">'+
        '<img src="/media/images/loading.gif">'+
        '</div>'+
        '</div>'+
        '</div>';

    function open($el, args){
	$el=$($el).html(body);
	inspic.init(args.src || '');
	if (args.html)
	    inspic.setHtml(args.html);
	inspic.callback=args.callback;
    }
    inspic.open=open;
})(jQuery);(function($){
    function init(src){
        inspic.view.addElements();
        inspic.view.addPreviews();
        inspic.loadCookie();
        inspic.controller.setField('src', src);
    };
    inspic.init=init;
})(jQuery);