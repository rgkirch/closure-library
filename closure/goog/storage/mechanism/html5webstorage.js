/**
 * @license
 * Copyright The Closure Library Authors.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Base class that implements functionality common
 * across both session and local web storage mechanisms.
 */

goog.provide('goog.storage.mechanism.HTML5WebStorage');

goog.require('goog.asserts');
goog.require('goog.iter');
goog.require('goog.iter.Iterator');
goog.require('goog.storage.mechanism.ErrorCode');
goog.require('goog.storage.mechanism.IterableMechanism');



/**
 * Provides a storage mechanism that uses HTML5 Web storage.
 *
 * @param {Storage} storage The Web storage object.
 * @constructor
 * @struct
 * @extends {goog.storage.mechanism.IterableMechanism}
 */
goog.storage.mechanism.HTML5WebStorage = function(storage) {
  'use strict';
  goog.storage.mechanism.HTML5WebStorage.base(this, 'constructor');

  /**
   * The web storage object (window.localStorage or window.sessionStorage).
   * @private {Storage}
   */
  this.storage_ = storage;
};
goog.inherits(
    goog.storage.mechanism.HTML5WebStorage,
    goog.storage.mechanism.IterableMechanism);


/**
 * The key used to check if the storage instance is available.
 * @private {string}
 * @const
 */
goog.storage.mechanism.HTML5WebStorage.STORAGE_AVAILABLE_KEY_ = '__sak';


/**
 * Determines whether or not the mechanism is available.
 * It works only if the provided web storage object exists and is enabled.
 *
 * @return {boolean} True if the mechanism is available.
 */
goog.storage.mechanism.HTML5WebStorage.prototype.isAvailable = function() {
  'use strict';
  if (!this.storage_) {
    return false;
  }

  try {
    // setItem will throw an exception if we cannot access WebStorage (e.g.,
    // Safari in private mode).
    this.storage_.setItem(
        goog.storage.mechanism.HTML5WebStorage.STORAGE_AVAILABLE_KEY_, '1');
    this.storage_.removeItem(
        goog.storage.mechanism.HTML5WebStorage.STORAGE_AVAILABLE_KEY_);
    return true;
  } catch (e) {
    return false;
  }
};


/** @override */
goog.storage.mechanism.HTML5WebStorage.prototype.set = function(key, value) {
  'use strict';
  try {
    // May throw an exception if storage quota is exceeded.
    this.storage_.setItem(key, value);
  } catch (e) {
    // In Safari Private mode, conforming to the W3C spec, invoking
    // Storage.prototype.setItem will allways throw a QUOTA_EXCEEDED_ERR
    // exception.  Since it's impossible to verify if we're in private browsing
    // mode, we throw a different exception if the storage is empty.
    if (this.storage_.length == 0) {
      throw goog.storage.mechanism.ErrorCode.STORAGE_DISABLED;
    } else {
      throw goog.storage.mechanism.ErrorCode.QUOTA_EXCEEDED;
    }
  }
};


/** @override */
goog.storage.mechanism.HTML5WebStorage.prototype.get = function(key) {
  'use strict';
  // According to W3C specs, values can be of any type. Since we only save
  // strings, any other type is a storage error. If we returned nulls for
  // such keys, i.e., treated them as non-existent, this would lead to a
  // paradox where a key exists, but it does not when it is retrieved.
  // http://www.w3.org/TR/2009/WD-webstorage-20091029/#the-storage-interface
  var value = this.storage_.getItem(key);
  if (typeof value !== 'string' && value !== null) {
    throw goog.storage.mechanism.ErrorCode.INVALID_VALUE;
  }
  return value;
};


/** @override */
goog.storage.mechanism.HTML5WebStorage.prototype.remove = function(key) {
  'use strict';
  this.storage_.removeItem(key);
};


/** @override */
goog.storage.mechanism.HTML5WebStorage.prototype.getCount = function() {
  'use strict';
  return this.storage_.length;
};


/** @override */
goog.storage.mechanism.HTML5WebStorage.prototype.__iterator__ = function(
    opt_keys) {
  'use strict';
  var i = 0;
  var storage = this.storage_;
  var newIter = new goog.iter.Iterator();
  /**
   * @return {!IIterableResult<string>}
   * @override
   */
  newIter.next = function() {
    'use strict';
    if (i >= storage.length) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    var key = goog.asserts.assertString(storage.key(i++));
    if (opt_keys) {
      return goog.iter.createEs6IteratorYield(key);
    }
    var value = storage.getItem(key);
    // The value must exist and be a string, otherwise it is a storage error.
    if (typeof value !== 'string') {
      throw goog.storage.mechanism.ErrorCode.INVALID_VALUE;
    }
    return goog.iter.createEs6IteratorYield(value);
  };
  const iterNext = newIter.next;
  /**
   * TODO(user): Please do not remove - this will be cleaned up
   * centrally.
   * @override @see {!goog.iter.Iterator}
   * @return {string}
   */
  newIter.nextValueOrThrow = function() {
    return goog.iter.toEs4IteratorNext(iterNext.call(newIter));
  };

  return newIter;
};


/** @override */
goog.storage.mechanism.HTML5WebStorage.prototype.clear = function() {
  'use strict';
  this.storage_.clear();
};


/**
 * Gets the key for a given key index. If an index outside of
 * [0..this.getCount()) is specified, this function returns null.
 * @param {number} index A key index.
 * @return {?string} A storage key, or null if the specified index is out of
 *     range.
 */
goog.storage.mechanism.HTML5WebStorage.prototype.key = function(index) {
  'use strict';
  return this.storage_.key(index);
};
