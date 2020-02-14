#!/usr/bin/env node
const path = require("path");
const webpack = require("webpack");
const webpackDevServer = require("webpack-dev-server");

const conf = require(path.resolve(__dirname, "../package.json"));
const cwd = process.cwd();
const HtmlPlugin = require("html-webpack-plugin");

// webpack configs
function pack(code) {
  let mode = "development";
  if (code !== 0) {
    mode = "production";
  }

  const config = {
    devServer: {
      hot: true,
      port: 1439
    },
    devtool: "inline-source-map",
    entry: path.resolve(__dirname, "./bootstrap"),
    mode: mode,
    output: {
      filename: "[name].bundle.js",
      path: cwd + "/dist",
    },
    plugins: [
      new HtmlPlugin({
        title: "Calling Elvis!",
      }),
    ],
    resolve: {
      extensions: [".ts", ".js", ".wasm"],
    },
  };

  // webpack
  const compiler = webpack(config);
  const devServerOptions = Object.assign({}, config.devServer);

  // check mode
  if (code === 0) {
    const server = new webpackDevServer(compiler, devServerOptions);
    server.listen(devServerOptions.port, "127.0.0.1", () => { });
  } else {
    compiler.run((err, stats) => {
      if (err != null) {
        console.error(`error: ${stats}`);
        process.exit(1);
      }
    });
  }
}

// simple cli program
class Program {
  static run() {
    const argv = process.argv;
    if (argv.length == 2) {
      Program.help();
      process.exit(0);
    }

    switch (argv[2].trim()) {
      case 'build':
        pack(1);
        break;
      case 'dev':
        pack(0);
        break;
      default:
        Program.help();
        break;
    }
  }

  static help() {
    console.log([
      `${conf.name} ${conf.version}\n`,
      `${conf.description}\n\n`,
      "USAGE: \n",
      "    elvis   [SUBCOMMANND]\n\n",
      "SUBCOMMANDS: \n",
      "    build   Build your satellite!\n",
      "    doc     Serve the Elvis Book!\n",
      "    dev     Calling Elvis!\n",
      "    help    Prints this Message!"
    ].join(""));
  }
}

// main
(function() {
  Program.run();
})();
