const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
    entry: {
        server: "./src/app.js",
    },
    output: {
        path: path.join(__dirname, "build"),
        filename: "bundle.js",
    },
    target: "node",
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.js$/,
                include: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
            {
                test: /\.(jp(e*)g|png|svg)$/,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            name: "images/[name].[ext]?[hash]",
                        },
                    },
                ],
            },
        ],
    },
};
