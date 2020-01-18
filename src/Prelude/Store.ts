import { useEffect, useState } from 'react';
import { objectMap, ReadonlyRecord } from './Etc';

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
     * @param state Current state.
     * @param payload Effect’s payload.
     */
    readonly exec: (state: S, payload: P) => readonly [S, Promise<D>] | Promise<readonly [S, Promise<D>]>;

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
 * The type of mapped bound action/effect creators.
 */
export type Actions<S, R extends ReadonlyRecord<PropertyKey, Reducer<S>>> = {
    readonly [K in keyof R]: InferActionType<S, R[K]>;
};

type InferActionType<S, R> = R extends ActionReducer<S, infer P>
    ? P extends undefined | void | never
        ? () => S
        : (payload: P) => S
    : R extends EffectReducer<S, infer P>
    ? P extends undefined | void | never
        ? () => Promise<void>
        : (payload: P) => Promise<void>
    : never;

/**
 * Effector-like state manager.
 */
export class Store<S, R extends ReadonlyRecord<PropertyKey, Reducer<S>>> {
    /**
     * Watchers.
     */
    private readonly w = new Set<(state: S) => unknown>();

    /**
     * Current state.
     */
    private s: S;

    /**
     * Action/effect functions. In terms of Redux, that’s bound action creators.
     */
    readonly actions: Actions<S, R>;

    constructor(state: S, reducers: R) {
        this.s = state;
        this.actions = objectMap(reducers, this.r, this) as any;
    }

    /**
     * Update state.
     */
    private u(next: S) {
        if (next === this.s) return;

        this.s = next;

        for (const watcher of this.w) watcher(this.s);
    }

    /**
     * Create bound action/effect creator.
     */
    private r([key, reducer]: readonly [any, any]) {
        return [
            key,
            typeof reducer === 'function'
                ? // Create bound action creator ↓
                  (payload: any) => this.u(reducer(this.s, payload))
                : // Create bound effect creator ↓
                  async (payload: any) => {
                      const [next, promise] = await reducer.exec(this.s, payload);

                      this.u(next);

                      try {
                          this.u(reducer.done(this.s, await promise));
                      } catch (error) {
                          this.u(reducer.done(this.s, error));
                      }
                  },
        ] as const;
    }

    /**
     * Creates mapped store. Such store will not have any actions; instead, it
     * will be automatically updated on parent store changes.
     *
     * @param map Mapping function.
     */
    map<T>(map: (s: S) => T): Store<T, {}> {
        const store = new Store(map(this.s), {});

        this.w.add(state => store.u(map(state)));

        return store;
    }

    /**
     * State getter for React. Automatically manages subscription.
     */
    get state() {
        const { w } = this;
        const [current, setState] = useState(this.s);

        // Subscribe/unsubscribe ↓
        useEffect(() => {
            w.add(setState);

            return () => {
                w.delete(setState);
            };
        });

        return current;
    }
}
