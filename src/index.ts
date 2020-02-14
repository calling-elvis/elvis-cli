#!/usr/bin/env ts-node
import path from "path";
import webpack from "webpack";
import webpackDevServer from "webpack-dev-server";

const conf = require(path.resolve(__dirname, "../package.json"));
const cwd = process.cwd();
const HtmlPlugin = require("html-webpack-plugin");

// webpack configs
function pack(code: number): void {
  let mode = "development";
  if (code !== 0) {
    mode = "production";
  }

  const config: any = {
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
  static run(): void {
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

  static help(): void {
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
