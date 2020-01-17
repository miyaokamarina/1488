declare module 'csstype' {
    interface Properties<t> {
        [index: string]: any;
    }
}

declare module "*.css" {
    const exports: readonly string[];

    export default exports;
}
