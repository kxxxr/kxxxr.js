import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/kxxxr.js",
      format: "umd",
      name: "Kxxxr",
    },
    {
      file: "dist/kxxxr.esm.js",
      format: "es",
    },
  ],
  plugins: [resolve(), commonjs()],
};
