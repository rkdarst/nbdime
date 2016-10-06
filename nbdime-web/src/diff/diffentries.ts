// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  valueIn
} from '../common/util';

import {
  ChunkSource
} from '../chunking';

/**
 * The different diff operations available
 */
export
type DiffOp = 'add' | 'remove' | 'replace' | 'patch' |
  'addrange' | 'removerange';


/**
 * Base interface for all diff entries
 */
export
interface IDiffEntryBase {
  /**
   * The key of the diff entry: Either the field name in an object, or the
   * index in a list/string.
   */
  key: string | number;

  /**
   * A string identifying the diff operation type, as defined by DiffOp.
   */
  op: DiffOp;

  /**
   * Optional: Source of diff, for use when merging.
   *
   * This should not need to be set manually.
   */
  source?: ChunkSource;
}


/**
 * Diff representing an added sequence of list entries, or an added substring
 */
export
interface IDiffAddRange extends IDiffEntryBase {
  key: number;
  op: 'addrange';
  /**
   * The sequence of values that were added
   */
  valuelist: string | any[];
}

/**
 * Diff representing an added object entry
 */
export interface IDiffAdd extends IDiffEntryBase {
  op: 'add';
  /**
   * The value that was added
   */
  value: any;
}


/**
 * Diff representing a removed object entry
 */
export interface IDiffRemove extends IDiffEntryBase {
  op: 'remove';
}


/**
 * Diff representing a replaced object entry
 */
export interface IDiffReplace extends IDiffEntryBase {
  op: 'replace';
  /**
   * The new value
   */
  value: any;
}


/**
 * Diff representing a removed sequence of list entries, or a removed substring
 */
export interface IDiffRemoveRange extends IDiffEntryBase {
  op: 'removerange';
  key: number;

  /**
   * The length of the sequence that was deleted
   */
  length: number;
}


/**
 * Diff representing a patched entry (object entry or list entry)
 */
export interface IDiffPatch extends IDiffEntryBase {
  op: 'patch';
  /**
   * The collection of sub-diffs describing the patch of the object
   */
  diff: IDiffEntry[];
}

/**
 * Describes a diff entry of a single JSON value (object, list, string)
 */
export type IDiffEntry = (IDiffAddRange | IDiffRemoveRange | IDiffPatch | IDiffAdd | IDiffRemove | IDiffReplace);


/** Create a replacement diff entry */
export
function opReplace(key: string | number, value: any): IDiffReplace {
  return {op: 'replace', key: key, value: value};
}

/** Create an addition diff entry */
export
function opAdd(key: string | number, value: any): IDiffAdd {
  return {op: 'add', key: key, value: value};
}

/** Create a removal diff entry */
export
function opRemove(key: string | number): IDiffRemove {
  return {op: 'remove', key: key};
}

/** Create a removal diff entry */
export
function opAddRange(key: number, valuelist: string | any[]): IDiffAddRange {
  return {op: 'addrange', key: key, valuelist: valuelist};
}

/** Create a range removal diff entry */
export
function opRemoveRange(key: number, length: number): IDiffRemoveRange {
  return {op: 'removerange', key: key, length: length};
}

/** Create a range removal diff entry */
export
function opPatch(key: string | number, diff: IDiffEntry[]): IDiffPatch {
  return {op: 'patch', key: key, diff: diff};
}


/**
 * Validate that a diff operation is valid to apply on a given base sequence
 */
export
function validateSequenceOp(base: Array<any> | string, entry: IDiffEntry): void {
  let op = entry.op;
  if (typeof entry.key !== 'number') {
      throw 'Invalid patch sequence op: Key is not a number: ' + entry.key;
  }
  let index = entry.key as number;
  if (op === 'addrange') {
    if (index < 0 || index > base.length || isNaN(index)) {
      throw 'Invalid add range diff op: Key out of range: ' + index;
    }
  } else if (op === 'removerange') {
    if (index < 0 || index >= base.length || isNaN(index)) {
      throw 'Invalid remove range diff op: Key out of range: ' + index;
    }
    let skip = (entry as IDiffRemoveRange).length;
    if (index + skip > base.length || isNaN(index)) {
      throw 'Invalid remove range diff op: Range too long!';
    }
  } else if (op === 'patch') {
    if (index < 0 || index >= base.length || isNaN(index)) {
      throw 'Invalid patch diff op: Key out of range: ' + index;
    }
  } else {
    throw 'Invalid op: ' + op;
  }
}

/**
 * Validate that a diff operation is valid to apply on a given base object
 */
export
function validateObjectOp(base: Object, entry: IDiffEntry, keys: string[]): void {
  let op = entry.op;
  if (typeof entry.key !== 'string') {
      throw 'Invalid patch object op: Key is not a string: ' + entry.key;
  }
  let key = entry.key as string;

  if (op === 'add') {
    if (valueIn(key, keys)) {
      throw 'Invalid add key diff op: Key already present: ' + key;
    }
  } else if (op === 'remove') {
    if (!valueIn(key, keys)) {
      throw 'Invalid remove key diff op: Missing key: ' + key;
    }
  } else if (op === 'replace') {
    if (!valueIn(key, keys)) {
      throw 'Invalid replace key diff op: Missing key: ' + key;
    }
  } else if (op === 'patch') {
    if (!valueIn(key, keys)) {
      throw 'Invalid patch key diff op: Missing key: ' + key;
    }
  } else {
    throw 'Invalid op: ' + op;
  }
}
