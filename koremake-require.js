const typescript = require('typescript');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const tsc = path.join(path.dirname(require.resolve("typescript")),"tsc.js");
const tscScript = vm.createScript(fs.readFileSync(tsc, "utf8"), tsc);
const libPath = path.join(path.dirname(require.resolve("typescript")), "lib.d.ts");

const koreMakeModule = {
    platform: '',
    graphics: '',
    audio: '',
    vr: '',
};
const defines = [];
const options = {
  nodeLib: false,
  targetES5: true,
  moduleKind: 'commonjs',
  emitOnError: false,
  exitOnError: true,
  tmpDir: path.join(process.cwd(), 'tmp')
};

module.exports = opts => {
  Object.assign(options, opts)
  options = merge(options, opts);
};
module.exports.default = module.exports;
module.exports.setKoreContext = function(ctx) {
    Object.assign(koreMakeModule, ctx);
}
require.extensions['.ts'] = function(module) {
  var erg = compileTS(module);
  runModule(erg, module);
};

/**
 * Compiles TypeScript file, returns js file path
 * @return {string} js file path
 */
function compileTS (module) {
  const tmpDir = path.join(options.tmpDir, "tsreq");
  const relativeFolder = path.dirname(path.relative(process.cwd(), module.filename));
  const jsName = path.join(tmpDir, relativeFolder, path.basename(module.filename, ".ts") + ".js");
  const fsFileContent = fs.readFileSync(module.filename, 'utf8');
  const output = typescript.transpileModule(fsFileContent, {
          compilerOptions: {
              target: "es6",
              lib: ["es2015", "es2016"],
              module: "commonjs",
          },
          reportDiagnostics: true
      }
  );
  // fs.writeFileSync(jsName, output.outputText, 'utf8');
  if (output.diagnostics.length > 0) {
        output.diagnostics.forEach(diagnostic => {
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                let message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                console.error(`${module.filename} (${line + 1},${character + 1}): ${message}`);
            } else {
                console.error(`${typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
            }
        });
    throw new Error('Typscript Compilation Error!');
  }

  return {
    jsName: jsName,
    content: output.outputText
  };
}

function runModule(jsDetails, module) {
  const jsName = jsDetails.jsName;
  const content = jsDetails.content;

  const sandbox = {};
  for (let k in global) {
    sandbox[k] = global[k];
  }
  const dir = path.dirname(module.filename);
  if (jsDetails.jsName.endsWith('koremake.js')) {
    Object.defineProperty(module.exports, 'project', {
      get: () =>  module.exports._project,
      set: p => {
        p.projectRoot = dir;
        module.exports._project = p;
      }
    });
  }
  sandbox.require = require => {
      if (require === 'koremake') {
          return Object.assign({}, koremakets, koreMakeModule);
      }
    return module.require(require);
  };
  sandbox.exports = module.exports;
  sandbox.__filename = jsName;
  sandbox.__dirname = dir;
  sandbox.module = module;
  sandbox.global = sandbox;

  return vm.runInNewContext(content, sandbox, { filename: jsName });
}
const koremakets = require('./koremake.ts');

const projectModule = require('./src/Project.ts');
