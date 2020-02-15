#!/usr/bin/env ts-node
import crypto from "crypto";
import fs from "fs";
import path from "path";
import webpack from "webpack";
import webpackDevServer from "webpack-dev-server";

const conf = require(path.resolve(__dirname, "../package.json"));
const cwd = process.cwd();
const root = path.resolve(__dirname, "..");
const HtmlPlugin = require("html-webpack-plugin");


/* server side render plugin */
interface IElvisPluginOptions {
  ssr: boolean;
}

class ElvisPlugin {
  public static defaultOptions(): IElvisPluginOptions {
    return {
      ssr: false,
    };
  }

  options: IElvisPluginOptions;
  ptr: string;
  target: string;

  constructor(options?: IElvisPluginOptions) {
    this.target = path.resolve(cwd, ".elvis.js");
    if (options !== undefined) {
      this.options = options;
    } else {
      this.options = ElvisPlugin.defaultOptions();
    }
  }

  // apply plugin to webpack
  public apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tap("elvis-webpack-plugin", (stats) => {
      if (this.options.ssr) {
        this.tunnel(stats, 0);
      } else {
        this.tunnel(stats, 1);
      }
    });
  }

  // single page application handler
  public spa(stats: webpack.Stats, ptr: string): void {

  }

  // server side rendering handler
  public ssr(stats: webpack.Stats, ptr: string): void {

  }

  // mode tunnel
  public tunnel(
    stats: webpack.Stats,
    adapter: number,
  ): void {
    const files: string[] = fs.readdirSync(cwd);
    if (files.indexOf(".elvis.js") === -1) {
      fs.writeFileSync(this.target, "");
    }

    const ptr = crypto.createHmac(
      "md5", "elvis-md5"
    ).update(
      fs.readFileSync(this.target)
    ).digest("hex");

    if (adapter === 0) {
      this.ssr(stats, ptr);
    } else {
      this.spa(stats, ptr);
    }
  }
}

/* webpack configs */
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
      filename: "elvis.bundle.js",
      path: cwd + "/dist",
    },
    plugins: [
      new HtmlPlugin({
        title: "Calling Elvis!",
      }),
      new ElvisPlugin(),
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

/* simple cli program */
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
