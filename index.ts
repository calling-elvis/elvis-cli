#!/usr/bin/env ts-node
import crypto from "crypto";
import fs from "fs";
import path from "path";
import webpack from "webpack";
import webpackDevServer from "webpack-dev-server";

const conf = require(path.resolve(__dirname, "package.json"));
const cwd = process.cwd();
const HtmlPlugin = require("html-webpack-plugin");

/* server side render plugin */
interface IElvisPluginOptions {
  home?: string;
  pages?: string;
  ssr?: boolean;
  title?: string;
}

class ElvisPlugin {
  public static autoHome(): string {
    return [
      `import { Center, Elvis, Text } from "calling-elvis";\n`,
      "export default Center(",
      `  Text("Is anybody home?", {`,
      "    bold: true,",
      "    italic: true,",
      "    size: 10,",
      "  })",
      ");"
    ].join("\n");
  }

  public static autoOpts(root: string): IElvisPluginOptions {
    let opts: IElvisPluginOptions = {
      home: "index",
      pages: ".",
      ssr: false,
      title: "Calling Elvis",
    }

    // locate pages entry
    if (fs.existsSync(path.resolve(root, "pages"))) {
      opts.pages = "pages";
    }

    // generate home
    const pagesDir = path.resolve(root, opts.pages);
    const pages = ElvisPlugin.getPages(fs.readdirSync(pagesDir));
    if (pages.indexOf("index") > -1) {
      opts.home = "index";
    } else if (pages.indexOf("home") > -1) {
      opts.home = "home";
    } else if (pages.length > 0) {
      opts.home = pages[0];
    } else {
      fs.writeFileSync(
        path.resolve(pagesDir, "index.js"),
        ElvisPlugin.autoHome()
      );
    }

    return opts;
  }

  public static getPages(files?: string[]): string[] {
    return files.filter((s) => {
      return (s.indexOf(".elvis.js") < 0) && (s.endsWith(".js") || s.endsWith(".ts"));
    }).map((f) => {
      return f.slice(0, (f.length - 3));
    });
  }

  public static locate(cur: string): string {
    if (cur === "/") {
      return "";
    }

    const files: string[] = fs.readdirSync(cur);
    if (files.indexOf(".elvis.js") === -1) {
      return ElvisPlugin.locate(path.resolve(cur, ".."));
    }

    return cur;
  }

  public static ref(path: string): string {
    return crypto.createHmac(
      "md5", "elvis-md5"
    ).update(
      fs.readFileSync(path)
    ).digest("hex");
  }

  options: IElvisPluginOptions;
  ptr: string;
  root: string;

  constructor(options?: IElvisPluginOptions) {
    // locate root path
    let root = ElvisPlugin.locate(cwd);
    if (root === "") {
      root = cwd;
      this.root = cwd;
    } else {
      this.root = root;
    }

    // init options from plugn entry
    this.options = Object.assign(
      ElvisPlugin.autoOpts(root),
      options
    );

    // update local configurations
    const conf = path.resolve(this.root, ".elvis.js");
    if (fs.existsSync(conf)) {
      this.options = Object.assign(this.options, import(conf));
    } else {
      const opts = JSON.stringify(this.options, null, 2);
      fs.writeFileSync(conf, [
        "/* elvis config file */",
        `module.exports = ${opts}`,
      ].join("\n"));
    }
  }

  // apply plugin to webpack
  public apply(compiler: webpack.Compiler): void {
    compiler.hooks.afterPlugins.tap("elvis-webpack-plugin", (compiler) => {
      if (this.options.ssr) {
        this.tunnel(compiler, 0);
      } else {
        this.tunnel(compiler, 1);
      }
    });
  }

  // single page application handler
  private spa(compiler: webpack.Compiler): void {
    const calling = path.resolve(__dirname, "var/calling.ts");
    if (fs.existsSync(calling)) {
      if (this.ptr === ElvisPlugin.ref(calling)) {
        return;
      }
    }

    let webpackOpts = compiler.options;
    if (!webpackOpts.devServer.historyApiFallback) {
      webpackOpts.devServer.historyApiFallback = true;
    }

    const pagesDir = path.resolve(this.root, this.options.pages);
    const pages = fs.readdirSync(pagesDir);
    const home = this.options.home[0].toUpperCase() + this.options.home.slice(1);

    let lines = [
      "/* elvis spa caller */",
      `import { Router, Elvis } from "calling-elvis"`,
      pages.map((page) => {
        let widget = page[0].toUpperCase() + page.slice(1);
        let relative = path.relative(path.dirname(calling), `${pagesDir}/${page}`);
        relative = relative.slice(0, (relative.length - 3));
        return `import ${widget.slice(0, (widget.length - 3))} from "${relative}";`;
      }).join("\n"),
      "\nnew Elvis({",
      `  home: ${home},`,
      "  router: new Router({",
      pages.map((page) => {
        page = page.slice(0, (page.length - 3));
        let widget = page[0].toUpperCase() + page.slice(1);
        return `    "${page}": ${widget},`;
      }).join("\n"),
      "  }),",
      "}).calling();",
    ];
    fs.writeFileSync(calling, lines.join("\n"));
    this.ptr = ElvisPlugin.ref(calling);
  }

  // server side rendering handler
  private ssr(compiler: webpack.Compiler): void {
    console.log("ssr");
  }

  // mode tunnel
  private tunnel(
    compiler: webpack.Compiler,
    adapter: number,
  ): void {
    let plugins = compiler.options.plugins;

    // patch for HTMLWebpackPlugin
    for (const i in plugins) {
      if (plugins[i] instanceof HtmlPlugin) {
        type HtmlWebpackPlugin = typeof HtmlPlugin;
        let hp: HtmlWebpackPlugin = plugins[i];
        hp.options.title = this.options.title;
      }
    }

    if (adapter === 0) {
      this.ssr(compiler);
    } else {
      this.spa(compiler);
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
    entry: path.resolve(__dirname, "var/bootstrap.ts"),
    mode: mode,
    output: {
      filename: "elvis.bundle.js",
      path: path.resolve(cwd, "dist"),
    },
    plugins: [
      new HtmlPlugin(),
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
