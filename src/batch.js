"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processArray = exports.processSortedSet = void 0;
const util = require("util");
const db = require("./database");
const utils = require("./utils");
const DEFAULT_BATCH_SIZE = 100;
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const sleep = util.promisify(setTimeout);
// type processType = (id: idType) => boolean;
// interface processTypeInt extends processType {
//   constructor
// }
function processSortedSet(setKey, 
// process: (ids: idType) => Promise<void>,
process, options) {
    return __awaiter(this, void 0, void 0, function* () {
        options = options || {};
        if (typeof process !== 'function') {
            throw new Error('[[error:process-not-a-function]]');
        }
        // Progress bar handling (upgrade scripts)
        if (options.progress) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
            options.progress.total = yield db.sortedSetCard(setKey);
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
            yield db.processSortedSet(setKey, process, options);
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
            const ids = yield db[`getSortedSetRange${options.withScores ? 'WithScores' : ''}`](setKey, start, stop);
            if (!ids || !ids.length || options.doneIf(start, stop, ids)) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            yield process(ids);
            // await process(ids);
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            start += utils.isNumber(options.alwaysStartAt) ? options.alwaysStartAt : options.batch;
            stop = start + options.batch - 1;
            if (options.interval) {
                yield sleep(options.interval);
            }
        }
    });
}
exports.processSortedSet = processSortedSet;
function processArray(array, process, options) {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield process(currentBatch);
            // await process(currentBatch);
            start += batch;
            if (options.interval) {
                yield sleep(options.interval);
            }
        }
    });
}
exports.processArray = processArray;
// require('./promisify')(exports);
// export { processSortedSet, processArray };
