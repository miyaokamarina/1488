const HtmlPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    mode: 'development',
    target: 'web',
    context: __dirname,
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.cjs', '.json'],
    },
    node: false,
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
                terserOptions: {
                    ecma: 2017,
                    toplevel: true,
                    compress: {
                        arguments: true,
                        keep_fargs: false,
                        passes: 3,
                        pure_getters: true,
                        unsafe_arrows: true,
                        unsafe_math: true,
                        unsafe_comps: true,
                        unsafe_Function: true,
                        unsafe_methods: true,
                        unsafe_proto: true,
                        unsafe_undefined: true,
                        unsafe: true,
                    },
                    output: {
                        max_line_len: 160,
                    },
                },
            }),
        ],
        concatenateModules: false,
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/iu,
                use: ['source-map-loader'],
                enforce: 'pre',
            },
            {
                test: /\.[jt]sx?$/iu,
                exclude: /node_modules/u,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svgz?|ttf|otf|eot|woff2?)$/iu,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 4096,
                            name: '[sha512:hash:base58:8].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlPlugin({
            template: './src/index.html',
        }),
        new CompressionPlugin({
            cache: true,
            filename: '[path].gz[query]',
            algorithm: 'gzip',
        }),
        new CompressionPlugin({
            cache: true,
            filename: '[path].br[query]',
            algorithm: 'brotliCompress',
            compressionOptions: { level: 11 },
        }),
    ],
};
