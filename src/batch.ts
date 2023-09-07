import util = require('util');
import db = require('./database');
import utils = require('./utils');

const DEFAULT_BATCH_SIZE = 100;

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const sleep = util.promisify(setTimeout);


interface idType {
  length: number;
}

interface optionsType {
  progress?: {
    total?:number;
  };
  batch?: number;
  alwaysStartAt?: number;
  doneIf?: (() => void)|((start:number, stop:number, id: idType) => boolean);
  withScores?: string;
  interval?: number;
}

// type processType = (id: idType) => boolean;

// interface processTypeInt extends processType {
//   constructor
// }

export async function processSortedSet(
    setKey: string,
    // process: (ids: idType) => Promise<void>,
    process,
    options: optionsType
): Promise<void> {
    options = options || {};

    if (typeof process !== 'function') {
        throw new Error('[[error:process-not-a-function]]');
    }

    // Progress bar handling (upgrade scripts)
    if (options.progress) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        options.progress.total = await db.sortedSetCard(setKey);
    }

    options.batch = options.batch || DEFAULT_BATCH_SIZE;

    // use the fast path if possible
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    if (db.processSortedSet && typeof options.doneIf !== 'function' && !utils.isNumber(options.alwaysStartAt)) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
        await db.processSortedSet(setKey, process, options);
        // disabled unsafe-return because return type is a complex type defined in another file
    }

    // custom done condition
    // function defaultDoneIf():boolean {
    //     return true;
    // }
    options.doneIf = typeof options.doneIf === 'function' ? options.doneIf : () => false;

    let start = 0;
    let stop = options.batch - 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (process && process.constructor && process.constructor.name !== 'AsyncFunction') {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unsafe-argument
        process = util.promisify(process);
        // disabled misused-promises because to make this line work in typescript,
        // I would have to restructure a lot of the existing code
    }

    while (true) {
        /* eslint-disable no-await-in-loop */
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const ids: idType = await db[`getSortedSetRange${options.withScores ? 'WithScores' : ''}`](setKey, start, stop);
        if (!ids || !ids.length || options.doneIf(start, stop, ids)) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await process(ids);
        // await process(ids);

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        start += utils.isNumber(options.alwaysStartAt) ? options.alwaysStartAt : options.batch;
        stop = start + options.batch - 1;

        if (options.interval) {
            await sleep(options.interval);
        }
    }
}

export async function processArray<T>(
    array: T[],
    process: (batch: T[]) => Promise<void>,
    options?: optionsType
): Promise<void> {
    options = options || {};

    if (!Array.isArray(array) || !array.length) {
        return;
    }
    if (typeof process !== 'function') {
        throw new Error('[[error:process-not-a-function]]');
    }

    const batch = options.batch || DEFAULT_BATCH_SIZE;
    let start = 0;
    if (process && process.constructor && process.constructor.name !== 'AsyncFunction') {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-misused-promises
        process = util.promisify(process);
        // disabled misused-promises because to make this line work in typescript,i
        // I would have to restructure a lot of the existing code
    }

    while (true) {
        const currentBatch = array.slice(start, start + batch);

        if (!currentBatch.length) {
            return;
        }

        await process(currentBatch);
        // await process(currentBatch);

        start += batch;

        if (options.interval) {
            await sleep(options.interval);
        }
    }
}

// require('./promisify')(exports);
// export { processSortedSet, processArray };
