export type Maybe<A> = Just<A> | Nothing;

export const Just = <A>(value: A): Just<A> => ({ value });
export type Just<A> = { readonly value: A };

export const Nothing = Symbol('Nothing');
export type Nothing = typeof Nothing;
