#!/usr/bin/env ts-node
import chalk from "chalk";
import chokidar from "chokidar";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import webpack from "webpack";
import webpackDevServer from "webpack-dev-server";
const HtmlPlugin = require("html-webpack-plugin");

enum Logger {
  Done,
  Error,
  Info,
  Wait,
}

interface IElvisPluginOptions {
  home?: string;
  pages?: string;
  ssr?: boolean;
  title?: string;
}

function log(text: string, ty?: Logger): void {
  let status = "";
  switch (ty) {
    case Logger.Done:
      status = chalk.greenBright("done");
      break;
    case Logger.Done:
      status = chalk.red("error");
      break;
    case Logger.Wait:
      status = chalk.cyan("wait");
      break;
    default:
      status = chalk.dim(chalk.cyan("info"));
      break;
  }

  console.log(`[ ${status} ] ${text}`);
}

function getPackageJson(): any {
  let conf: any = {};
  const pj = path.resolve(__dirname, "./package.json");
  if (fs.existsSync(pj)) {
    conf = require(pj);
  } else {
    conf = require(path.resolve(__dirname, "../package.json"));
  }

  return conf;
}

class ElvisPlugin {
  public static autoHome(): string {
    return [
      `import { Center, Elvis, Text } from "calling-elvis";\n`,
      "export default Center(",
      `  Text("Is anybody home?", {`,
      "    bold: true,",
      "    italic: true,",
      "    size: 6,",
      "  })",
      ");"
    ].join("\n");
  }

  public static autoOpts(root: string): IElvisPluginOptions {
    let opts: IElvisPluginOptions = {
      home: "index",
      pages: "pages",
      ssr: false,
      title: "Calling Elvis!",
    }

    // locate pages entry
    const pagesDir = path.resolve(root, opts.pages);
    if (fs.existsSync(pagesDir)) {
      if (!fs.statSync(pagesDir).isDirectory()) {
        log(`${pagesDir} is not a directory`, Logger.Error);
        process.exit(1);
      }
    } else {
      fs.mkdirSync(pagesDir);
    }

    // generate home
    const pages = ElvisPlugin.getPages(
      fs.readdirSync(pagesDir)
    ).map((f) => f.slice(0, f.lastIndexOf(".")));

    if (pages.indexOf("index") > -1) {
      opts.home = "index";
    } else if (pages.indexOf("home") > -1) {
      opts.home = "home";
    } else if (pages.length > 0) {
      opts.home = pages[0];
    } else {
      log("write index to disk ...");
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
    this.initOpts(options);
  }

  // apply plugin to webpack
  public apply(compiler: webpack.Compiler): void {
    compiler.hooks.afterPlugins.tap("elvis-webpack-plugin", (compiler) => {
      this.patchOptsToCompiler(compiler);
    });

    compiler.hooks.done.tap("elvis-webpack-plugin", () => {
      log("compiled successfully", Logger.Done);
    });
  }

  private initOpts(options: IElvisPluginOptions): void {
    const cwd = process.cwd();
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
    //
    // wirite .elvis.js to disk if not exists
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

  private patchOptsToCompiler(compiler: webpack.Compiler): void {
    // patch for HTMLWebpackPlugin
    let plugins = compiler.options.plugins;
    for (const i in plugins) {
      if (plugins[i] instanceof HtmlPlugin) {
        type HtmlWebpackPlugin = typeof HtmlPlugin;
        let hp: HtmlWebpackPlugin = plugins[i];
        hp.options.title = this.options.title;
      }
    }

    // spa-or-ssr adapter
    const calling = path.resolve(__dirname, ".etc/calling.js");
    const pagesDir = path.resolve(this.root, this.options.pages);
    const home = this.options.home[0].toUpperCase() + this.options.home.slice(1);
    if (!this.options.ssr) {
      // update spa router
      this.updateSPARouter(calling, home, pagesDir);

      // check if is devServer
      if (compiler.options.devServer === undefined) {
        return;
      }

      // patch historyApiFallback
      let webpackOpts = compiler.options;
      if (!webpackOpts.devServer.historyApiFallback) {
        webpackOpts.devServer.historyApiFallback = true;
      }

      // watch pages dir changes
      chokidar.watch(pagesDir, {
        ignored: (path: string, stats: fs.Stats) => {
          if (path === pagesDir) {
            return false;
          } else if (stats != undefined && stats.isDirectory()) {
            return true;
          }

          return /(?<!\.js|\.ts)$/.test(path);
        },
        ignoreInitial: true,
        persistent: true,
      })
        .on("add", (file) => {
          let name = path.basename(file).trim();
          log(`add page ${chalk.cyan(name)}`, Logger.Info);
          this.updateSPARouter(calling, home, pagesDir);
        })
        .on("unlink", (file) => {
          let name = path.basename(file).trim();
          log(`unlink page ${chalk.cyan(name)}`, Logger.Info);
          this.updateSPARouter(calling, home, pagesDir);
        });
    } else {
      // TODO: patch entry into ssr mode
    }
  }

  // single page application handler
  private updateSPARouter(
    calling: string,
    home: string,
    pagesDir: string,
  ): void {
    const pages = fs.readdirSync(pagesDir);

    let lines = [
      "/* elvis spa caller */",
      `import { Router, Elvis } from "calling-elvis"`,
      ElvisPlugin.getPages(pages).map((page) => {
        let widget = page[0].toUpperCase() + page.slice(1);
        let relative = path.relative(path.dirname(calling), `${pagesDir}/${page}`);
        relative = relative.slice(0, relative.lastIndexOf("."));
        return `import ${widget.slice(0, widget.lastIndexOf("."))} from "${relative}";`;
      }).join("\n"),
      "\nnew Elvis({",
      `  home: ${home},`,
      "  router: new Router({",
      ElvisPlugin.getPages(pages).map((page) => {
        if (page.indexOf(home.toLowerCase()) < 0) {
          page = page.slice(0, page.lastIndexOf("."));
          let widget = page[0].toUpperCase() + page.slice(1);
          return `    "${page}": ${widget},`;
        }
      }).join("\n"),
      "  }),",
      "}).calling();",
    ].join("\n");

    if (!fs.existsSync(calling) || (crypto.createHmac(
      "md5", "elvis-md5"
    ).update(lines).digest("hex") != ElvisPlugin.ref(calling))) {
      fs.writeFileSync(calling, lines);
    }
  }
}

/* webpack configs */
function pack(code: number): void {
  const etc = path.resolve(__dirname, ".etc");
  const bootstrap = path.resolve(etc, "bootstrap.js");
  if (!fs.existsSync(bootstrap)) {
    if (!fs.existsSync(etc)) {
      fs.mkdirSync(etc);
    }
    log("bootstrap elvis ...");
    fs.writeFileSync(bootstrap, `import("./calling");`);
  }

  let mode = "development";
  if (code !== 0) {
    mode = "production";
  }

  const config: any = {
    devtool: "inline-source-map",
    entry: bootstrap,
    mode: mode,
    output: {
      filename: "elvis.bundle.js",
      path: path.resolve(process.cwd(), ".elvis"),
    },
    plugins: [
      new HtmlPlugin(),
      new ElvisPlugin(),
    ],
    resolve: {
      extensions: [".ts", ".js", ".wasm"],
    },
    watch: true,
  };

  // webpack
  const compiler = webpack(config);
  const devServerOptions = {
    hot: true,
    port: 1439,
    noInfo: true,
  };

  // check mode
  if (code === 0) {
    log("starting development server ...", Logger.Wait);
    const server = new webpackDevServer(compiler, devServerOptions);
    server.listen(devServerOptions.port, "127.0.0.1", (err) => {
      if (err != null) {
        log(`start server failed.`, Logger.Error);
        process.exit(1);
      }
      log("waiting on http://localhost:1439 ...", Logger.Info);
    });
  } else {
    let packageJson = getPackageJson();
    log(`building ${packageJson.name} ...`, Logger.Wait);
    compiler.run((err, stats) => {
      if (err != null) {
        log(`compile failed.`, Logger.Error);
        process.exit(1);
      }

      log(`${packageJson.name} has been packed at ${chalk.underline.cyan(config.output.path)}.`, Logger.Done);
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
    const conf: any = getPackageJson();
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
