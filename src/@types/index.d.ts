declare module 'csstype' {
    interface Properties<t> {
        [index: string]: any;
    }
}

declare module '*.css' {
    const exports: String | readonly string[];

    export default exports;
}
