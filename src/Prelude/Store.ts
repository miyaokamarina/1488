import { useState, useEffect } from 'react';
import { isFunction, objectMap, ReadonlyRecord, stringConcat } from './Etc';
import { logger } from './Logger';
import { Tag } from './Tag';

/**
 * Synchronous action reducer.
 *
 * @param state Current state.
 * @param payload Action’s payload.
 */
export type ActionReducer<S, P = any> = (state: S, payload: P) => S;

/**
 * Asynchronous action executor end reducer.
 */
export interface EffectReducer<S, P = any, D = any, F = any> {
    /**
     * Effect executor.
     *
     * @param payload Effect’s payload.
     */
    readonly exec: (payload: P) => Promise<D>;

    /**
     * Effect start reducer.
     *
     * @param state Current state.
     * @param payload Effect’ payload.
     */
    readonly fire: (state: S, payload: P) => S;

    /**
     * Effect finish reducer.
     *
     * @param state Current state.
     * @param payload Effect result.
     */
    readonly done: (state: S, payload: D) => S;

    /**
     * Effect fail reducer.
     *
     * @param state Current state.
     * @param payload Effect error.
     */
    readonly fail: (state: S, payload: F) => S;
}

/**
 * Either synchronous or asynchronous reducer.
 */
export type Reducer<S> = ActionReducer<S> | EffectReducer<S>;

/**
 * Store type.
 */
export interface Store<S, R extends ReadonlyRecord<string, Reducer<S>>> {
    /**
     * Subscribe method.
     *
     * @param watcher Watcher function will be invoked on state changes.
     * @return {() => void} Unsubscribe function.
     */
    readonly watch: (watcher: (state: S) => unknown) => () => void;

    /**
     * Returns current state.
     */
    readonly getState: () => S;

    /**
     * Action creators object.
     */
    readonly actions: {
        readonly [K in keyof R]: InferActionType<S, R[K]>;
    };
}

type InferActionType<S, R> = R extends ActionReducer<S, infer P>
    ? unknown extends P
        ? () => void
        : (payload: P) => void
    : R extends EffectReducer<S, infer P>
    ? P extends undefined | void
        ? () => Promise<void>
        : (payload: P) => Promise<void>
    : never;

/**
 * Creates new store with specified name, initial state and reducers object.
 *
 * @example ```javascript
 * const store = Store`main`(1, {
 *     add: (state, payload) => state + payload,
 *     sub: (state, payload) => state - payload,
 * })
 * ```
 *
 * @param name Store name as template literal.
 * @param state Initial state.
 * @param reducers Reducers object.
 */
export const Store = Tag<
    unknown,
    string,
    <S, R extends ReadonlyRecord<string, Reducer<S>>>(state: S, reducers: R) => Store<S, R>
>(
    stringConcat,
    stringConcat,
    name => <S, R extends ReadonlyRecord<string, Reducer<S>>>(state: S, reducers: R): Store<S, R> => {
        const watchers = new Set<(state: S) => unknown>();

        const storeLogger = logger.tag('name=' + name);
        const createdLogger = storeLogger.fork('created');
        const triggeredLogger = storeLogger.fork('triggered');

        createdLogger.trace(state);

        const reduce = (message: string, key: string, reducer: (state: S, payload: any) => S) => (payload: any) => {
            if (typeof payload == 'undefined' || reducer.length < 2) {
                triggeredLogger.trace('action=%o', key + message);
            } else {
                triggeredLogger.trace('action=%o, payload=%o', key + message, payload);
            }

            const next = reducer(state, payload) as any;

            if (next === state) return;

            state = next;

            for (const watcher of watchers) watcher(state);
        };

        return {
            watch: (watcher: (state: S) => unknown) => {
                watchers.add(watcher);

                return () => {
                    watchers.delete(watcher);
                };
            },

            getState: () => state,

            actions: objectMap(reducers, ([key, reducer]) => {
                return [
                    key,
                    isFunction(reducer)
                        ? reduce(``, key, reducer)
                        : (payload: any) => {
                              reduce(`.fire`, key, reducer.fire)(payload);

                              return reducer
                                  .exec(payload)
                                  .then(reduce(`.done`, key, reducer.done), reduce(`.fail`, key, reducer.fail));
                          },
                ];
            }) as any,
        };
    },
    '',
);

export const useStore = <S, R extends ReadonlyRecord<string, Reducer<S>>>({ getState, watch }: Store<S, R>) => {
    const [state, setState] = useState(getState());

    useEffect(() => watch(setState));

    return state;
};

export const useActions = <S, R extends ReadonlyRecord<string, Reducer<S>>>({ actions }: Store<S, R>) => actions;
