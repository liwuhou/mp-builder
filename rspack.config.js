const rspack = require("@rspack/core");
const isDev = process.env.NODE_ENV === "development";
/**
 * @type {import('@rspack/cli').Configuration}
 */
module.exports = {
  context: __dirname,
  entry: {
    main: "./src/index.ts",
  },
  resolve: {
    extensions: ["...", ".ts"],
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: "asset",
      },
      {
        test: /\.(js|ts)$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              sourceMap: true,
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: "automatic",
                    development: isDev,
                    refresh: isDev,
                  },
                },
              },
              env: {
                targets: [
                  "chrome >= 87",
                  "edge >= 88",
                  "firefox >= 78",
                  "safari >= 14",
                ],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    new rspack.ProgressPlugin({}),
  ].filter(Boolean),
};