/**
 * This file is derived from the default JSDoc template.
 * The license for JSDoc can be found in the ./LICENSE.md file.
 */

const doop = require('jsdoc/util/doop');
const env = require('jsdoc/env');
const fs = require('jsdoc/fs');
const helper = require('jsdoc/util/templateHelper');
const logger = require('jsdoc/util/logger');
const path = require('jsdoc/path');
const taffy = require('taffydb').taffy;
const template = require('jsdoc/template');
const util = require('util');

const htmlsafe = helper.htmlsafe;
const linkto = helper.linkto;
const resolveAuthorLinks = helper.resolveAuthorLinks;
const hasOwnProp = Object.prototype.hasOwnProperty;

let data;
let view;

let outdir = path.normalize(env.opts.destination);

function find(spec) {
  return helper.find(data, spec);
}

function tutoriallink(tutorial) {
  return helper.toTutorial(tutorial, null, {
    tag: 'em',
    classname: 'disabled',
    prefix: 'Tutorial: '
  });
}

function getAncestorLinks(doclet) {
  return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
  let url;

  if (!/^(#.+)/.test(hash)) {
    return hash;
  }

  url = helper.createLink(doclet);
  url = url.replace(/(#.+|$)/, hash);

  return `<a href="${url}">${hash}</a>`;
}

function needsSignature(doclet) {
  let needsSig = false;

  // function and class definitions always get a signature
  if (doclet.kind === 'function' || doclet.kind === 'class') {
    needsSig = true;
  }
  // typedefs that contain functions get a signature, too
  else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names
        && doclet.type.names.length) {
    for (let i = 0, l = doclet.type.names.length; i < l; i++) {
      if (doclet.type.names[i].toLowerCase() === 'function') {
        needsSig = true;
        break;
      }
    }
  }
  // and namespaces that are functions get a signature (but finding them is a
  // bit messy)
  else if (doclet.kind === 'namespace' && doclet.meta && doclet.meta.code
        && doclet.meta.code.type && doclet.meta.code.type.match(/[Ff]unction/)) {
    needsSig = true;
  }

  return needsSig;
}

function getSignatureAttributes(item) {
  const attributes = [];

  if (item.optional) {
    attributes.push('opt');
  }

  if (item.nullable === true) {
    attributes.push('nullable');
  }
  else if (item.nullable === false) {
    attributes.push('non-null');
  }

  return attributes;
}

function updateItemName(item) {
  const attributes = getSignatureAttributes(item);
  let itemName = item.name || '';

  if (item.variable) {
    itemName = `&hellip;${itemName}`;
  }

  if (attributes && attributes.length) {
    itemName = util.format('%s<span class="signature-attributes">%s</span>', itemName,
      attributes.join(', '));
  }

  return itemName;
}

function addParamAttributes(params) {
  return params.filter(function(param) {
    return param.name && param.name.indexOf('.') === -1;
  }).map(updateItemName);
}

function buildItemTypeStrings(item) {
  const types = [];

  if (item && item.type && item.type.names) {
    item.type.names.forEach(function(name) {
      types.push(linkto(name, htmlsafe(name)));
    });
  }

  return types;
}

function buildAttribsString(attribs) {
  let attribsString = '';

  if (attribs && attribs.length) {
    attribsString = htmlsafe(util.format('(%s) ', attribs.join(', ')));
  }

  return attribsString;
}

function addNonParamAttributes(items) {
  let types = [];

  items.forEach(function(item) {
    types = types.concat(buildItemTypeStrings(item));
  });

  return types;
}

function addSignatureParams(f) {
  const params = f.params ? addParamAttributes(f.params) : [];

  f.signature = util.format('%s(%s)', (f.signature || ''), params.join(', '));
}

function addSignatureReturns(f) {
  const attribs = [];
  let attribsString = '';
  let returnTypes = [];
  let returnTypesString = '';
  const source = f.yields || f.returns;

  // jam all the return-type attributes into an array. this could create odd results (for example,
  // if there are both nullable and non-nullable return types), but let's assume that most people
  // who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
  if (source) {
    source.forEach(function(item) {
      helper.getAttribs(item).forEach(function(attrib) {
        if (attribs.indexOf(attrib) === -1) {
          attribs.push(attrib);
        }
      });
    });

    attribsString = buildAttribsString(attribs);
  }

  if (source) {
    returnTypes = addNonParamAttributes(source);
  }
  if (returnTypes.length) {
    returnTypesString = util.format(' &rarr; %s{%s}', attribsString, returnTypes.join('|'));
  }

  f.signature = `<span class="signature">${f.signature || ''}</span>`
        + `<span class="type-signature">${returnTypesString}</span>`;
}

function addSignatureTypes(f) {
  const types = f.type ? buildItemTypeStrings(f) : [];

  f.signature = `${f.signature || ''}<span class="type-signature">${
    types.length ? ` :${types.join('|')}` : ''}</span>`;
}

function addAttribs(f) {
  const attribs = helper.getAttribs(f);
  const attribsString = buildAttribsString(attribs);

  f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
  Object.keys(files).forEach(function(file) {
    files[file].shortened = files[file].resolved.replace(commonPrefix, '')
    // always use forward slashes
    .replace(/\\/g, '/');
  });

  return files;
}

function getPathFromDoclet(doclet) {
  if (!doclet.meta) {
    return null;
  }

  return doclet.meta.path && doclet.meta.path !== 'null'
    ? path.join(doclet.meta.path, doclet.meta.filename)
    : doclet.meta.filename;
}

function generate(title, docs, filename, _resolveLinks) {
  let html;

  const resolveLinks = _resolveLinks !== false;

  const docData = {
    env: env,
    title: title,
    docs: docs
  };

  const outpath = path.join(outdir, filename);
  html = view.render('container.tmpl', docData);

  if (resolveLinks) {
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
  }

  fs.writeFileSync(outpath, html, 'utf8');
}

function generateSourceFiles(sourceFiles, _encoding) {
  const encoding = _encoding || 'utf8';
  Object.keys(sourceFiles).forEach(function(file) {
    let source;
    // links are keyed to the shortened path in each doclet's `meta.shortpath` property
    const sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);

    helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

    try {
      source = {
        kind: 'source',
        code: helper.htmlsafe(fs.readFileSync(sourceFiles[file].resolved, encoding))
      };
    }
    catch (e) {
      logger.error('Error while generating source file %s: %s', file, e.message);
    }

    generate(`Source: ${sourceFiles[file].shortened}`, [source], sourceOutfile,
      false);
  });
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
  const symbols = {};

  // build a lookup table
  doclets.forEach(function(symbol) {
    symbols[symbol.longname] = symbols[symbol.longname] || [];
    symbols[symbol.longname].push(symbol);
  });

  modules.forEach(function(module) {
    if (symbols[module.longname]) {
      module.modules = symbols[module.longname]
      // Only show symbols that have a description. Make an exception for classes, because
      // we want to show the constructor-signature heading no matter what.
      .filter(function(symbol) {
        return symbol.description || symbol.kind === 'class';
      })
      .map(function(_symbol) {
        const symbol = doop(_symbol);

        if (symbol.kind === 'class' || symbol.kind === 'function') {
          symbol.name = `${symbol.name.replace('module:', '(require("')}"))`;
        }

        return symbol;
      });
    }
  });
}

function buildMemberNav(items, itemHeading, itemsSeen, linktoFn) {
  let nav = '';

  if (items.length) {
    let itemsNav = '';

    items.forEach(function(item) {
      let displayName;

      if (!hasOwnProp.call(item, 'longname')) {
        itemsNav += `<li>${linktoFn('', item.name)}</li>`;
      }
      else if (!hasOwnProp.call(itemsSeen, item.longname)) {
        if (env.conf.templates.default.useLongnameInNav) {
          displayName = item.longname;
        }
        else {
          displayName = item.name;
        }
        itemsNav += `<li>${linktoFn(item.longname, displayName.replace(/\b(module|event):/g, ''))}</li>`;

        itemsSeen[item.longname] = true;
      }
    });

    if (itemsNav !== '') {
      const itemID = itemHeading.toLowerCase().replace(' ', '-');

      // let show = (itemID === 'flight-manual') ? 'show active' : '';
      // nav += `<div class="tab-pane fade ${show}" id="${itemID}" `;
      // nav += `role="tabpanel" aria-labelledby="${itemID}-tab">`;
      // nav += '<h3>' + itemHeading + '</h3>';
      nav += `<ul id="${itemID}-menu" class="jsdoc-menu">${itemsNav}</ul>`;
      // nav += `</div>`;
    }
  }

  return nav;
}

function linktoTutorial(longName, name) {
  return tutoriallink(name);
}

// function linktoExternal(longName, name) {
//   return linkto(longName, name.replace(/(^"|"$)/g, ''));
// }

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @param {array<object>} members.interfaces
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
  // let globalNav;
  // var nav = '<h2><a href="index.html">Documentation</a></h2>';
  let nav = '<h2>Flight Manual</h2>';
  // const seen = {};
  const seenTutorials = {};

  const fmLink = '<a id="fm-link" href="/doc/flight-manual">Flight Manual</a>';
  const moduleDocLink = '<a id="mod-doc-link" href="/doc/developers">Modules</a>';
  nav += `<h5 id="doc-tabs">${fmLink} | ${moduleDocLink}</h5>`;

  nav += buildMemberNav(members.tutorials, 'Flight Manual', seenTutorials, linktoTutorial);
  nav += buildMemberNav(members.modules, 'Modules', {}, linkto);
  // nav += buildMemberNav(members.externals, 'Externals', seen, linktoExternal);
  // nav += buildMemberNav(members.namespaces, 'Namespaces', seen, linkto);
  // nav += buildMemberNav(members.classes, 'Classes', seen, linkto);
  // nav += buildMemberNav(members.interfaces, 'Interfaces', seen, linkto);
  // nav += buildMemberNav(members.events, 'Events', seen, linkto);
  // nav += buildMemberNav(members.mixins, 'Mixins', seen, linkto);

  // Uncomment th below section to turn on the "global" nav section
  /*
    if (members.globals.length) {
        globalNav = '';

        members.globals.forEach(function(g) {
            if ( g.kind !== 'typedef' && !hasOwnProp.call(seen, g.longname) ) {
                globalNav += '<li>' + linkto(g.longname, g.name) + '</li>';
            }
            seen[g.longname] = true;
        });

        if (!globalNav) {
            // turn the heading into a link so you can actually get to the global page
            nav += '<h3>' + linkto('global', 'Global') + '</h3>';
        }
        else {
            nav += '<h3>Global</h3><ul>' + globalNav + '</ul>';
        }
    }
    */

  return nav;
}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
  // let fromDir;
  const sourceFilePaths = [];
  let sourceFiles = {};
  // let staticFileFilter;
  // let staticFilePaths;
  // let staticFiles;
  // let staticFileScanner;

  data = taffyData;

  const conf = env.conf.templates || {};
  conf.default = conf.default || {};

  const templatePath = path.normalize(opts.template);
  view = new template.Template(path.join(templatePath, 'tmpl'));

  // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
  // doesn't try to hand them out later
  const indexUrl = helper.getUniqueFilename('index');
  // don't call registerLink() on this one! 'index' is also a valid longname

  const globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);

  // set up templating
  view.layout = conf.default.layoutFile
    ? path.getResourcePath(path.dirname(conf.default.layoutFile),
      path.basename(conf.default.layoutFile))
    : 'layout.tmpl';

  // set up tutorials for helper
  helper.setTutorials(tutorials);

  data = helper.prune(data);
  data.sort('longname, version, since');
  helper.addEventListeners(data);

  data().each(function(doclet) {
    let sourcePath;

    doclet.attribs = '';

    if (doclet.examples) {
      doclet.examples = doclet.examples.map(function(example) {
        let caption;
        let code;

        if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
          caption = RegExp.$1;
          code = RegExp.$3;
        }

        return {
          caption: caption || '',
          code: code || example
        };
      });
    }
    if (doclet.see) {
      doclet.see.forEach(function(seeItem, i) {
        doclet.see[i] = hashToLink(doclet, seeItem);
      });
    }

    // build a list of source files
    if (doclet.meta) {
      sourcePath = getPathFromDoclet(doclet);
      sourceFiles[sourcePath] = {
        resolved: sourcePath,
        shortened: null
      };
      if (sourceFilePaths.indexOf(sourcePath) === -1) {
        sourceFilePaths.push(sourcePath);
      }
    }
  });

  // update outdir if necessary, then create outdir
  const packageInfo = (find({ kind: 'package' }) || [])[0];
  if (packageInfo && packageInfo.name) {
    outdir = path.join(outdir, packageInfo.name, (packageInfo.version || ''));
  }
  fs.mkPath(outdir);

  if (sourceFilePaths.length) {
    sourceFiles = shortenPaths(sourceFiles, path.commonPrefix(sourceFilePaths));
  }
  data().each(function(doclet) {
    let docletPath;
    const url = helper.createLink(doclet);

    helper.registerLink(doclet.longname, url);

    // add a shortened version of the full path
    if (doclet.meta) {
      docletPath = getPathFromDoclet(doclet);
      docletPath = sourceFiles[docletPath].shortened;
      if (docletPath) {
        doclet.meta.shortpath = docletPath;
      }
    }
  });

  data().each(function(doclet) {
    const url = helper.longnameToUrl[doclet.longname];

    if (url.indexOf('#') > -1) {
      doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
    }
    else {
      doclet.id = doclet.name;
    }

    if (needsSignature(doclet)) {
      addSignatureParams(doclet);
      addSignatureReturns(doclet);
      addAttribs(doclet);
    }
  });

  // do this after the urls have all been generated
  data().each(function(doclet) {
    doclet.ancestors = getAncestorLinks(doclet);

    if (doclet.kind === 'member') {
      addSignatureTypes(doclet);
      addAttribs(doclet);
    }

    if (doclet.kind === 'constant') {
      addSignatureTypes(doclet);
      addAttribs(doclet);
      doclet.kind = 'member';
    }
  });

  const members = helper.getMembers(data);
  members.tutorials = tutorials.children;

  // output pretty-printed source files by default
  const outputSourceFiles = conf.default && conf.default.outputSourceFiles !== false;

  // add template helpers
  view.find = find;
  view.linkto = linkto;
  view.resolveAuthorLinks = resolveAuthorLinks;
  view.tutoriallink = tutoriallink;
  view.htmlsafe = htmlsafe;
  view.outputSourceFiles = outputSourceFiles;

  // once for all
  view.nav = buildNav(members);
  attachModuleSymbols(find({ longname: { left: 'module:' } }), members.modules);

  // generate the pretty-printed source files first so other pages can link to them
  if (outputSourceFiles) {
    generateSourceFiles(sourceFiles, opts.encoding);
  }

  if (members.globals.length) { generate('Global', [{ kind: 'globalobj' }], globalUrl); }

  // index page displays information from package.json and lists files
  const files = find({ kind: 'file' });
  const packages = find({ kind: 'package' });

  generate('Home',
    packages.concat(
      [{
        kind: 'mainpage',
        readme: opts.readme,
        longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'
      }]
    ).concat(files), indexUrl);

  // set up the lists that we'll use to generate pages
  const classes = taffy(members.classes);
  const modules = taffy(members.modules);
  const namespaces = taffy(members.namespaces);
  const mixins = taffy(members.mixins);
  const externals = taffy(members.externals);
  const interfaces = taffy(members.interfaces);

  Object.keys(helper.longnameToUrl).forEach(function(longname) {
    const myClasses = helper.find(classes, { longname: longname });
    const myExternals = helper.find(externals, { longname: longname });
    const myInterfaces = helper.find(interfaces, { longname: longname });
    const myMixins = helper.find(mixins, { longname: longname });
    const myModules = helper.find(modules, { longname: longname });
    const myNamespaces = helper.find(namespaces, { longname: longname });

    if (myModules.length) {
      generate(`Module: ${myModules[0].name}`, myModules, helper.longnameToUrl[longname]);
    }

    if (myClasses.length) {
      generate(`Class: ${myClasses[0].name}`, myClasses, helper.longnameToUrl[longname]);
    }

    if (myNamespaces.length) {
      generate(`Namespace: ${myNamespaces[0].name}`, myNamespaces, helper.longnameToUrl[longname]);
    }

    if (myMixins.length) {
      generate(`Mixin: ${myMixins[0].name}`, myMixins, helper.longnameToUrl[longname]);
    }

    if (myExternals.length) {
      generate(`External: ${myExternals[0].name}`, myExternals, helper.longnameToUrl[longname]);
    }

    if (myInterfaces.length) {
      generate(`Interface: ${myInterfaces[0].name}`, myInterfaces, helper.longnameToUrl[longname]);
    }
  });

  // TODO: move the tutorial functions to templateHelper.js
  function generateTutorial(title, tutorial, filename) {
    const tutorialData = {
      title: title,
      header: tutorial.title,
      content: tutorial.parse(),
      children: tutorial.children
    };
    const tutorialPath = path.join(outdir, filename);
    let html = view.render('tutorial.tmpl', tutorialData);

    // yes, you can use {@link} in tutorials too!
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

    fs.writeFileSync(tutorialPath, html, 'utf8');
  }

  // tutorials can have only one parent so there is no risk for loops
  function saveChildren(node) {
    node.children.forEach(function(child) {
      generateTutorial(child.title, child, helper.tutorialToUrl(child.name));
      saveChildren(child);
    });
  }

  saveChildren(tutorials);
};