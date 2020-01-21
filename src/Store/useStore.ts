import { useEffect, useState } from 'react';
import { ReadonlyRecord } from '../Prelude';
import { Reducer, Store } from './Store';

export const useStore = <S, R extends ReadonlyRecord<PropertyKey, Reducer<S>>>(store: Store<S, R>) => {
    const [state, setState] = useState(store.state);

    useEffect(() => {
        return store.watch(setState);
    }, [store, setState]);

    return state;
};
