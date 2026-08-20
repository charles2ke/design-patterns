'use strict';

const unplugin = require('unplugin');
const plugin = require('./shared/unplugin-dts.Bd7VMaAx.cjs');
require('node:path');
require('node:fs');
require('node:module');
require('kolorist');
require('node:fs/promises');
require('node:os');
require('@rollup/pluginutils');
require('compare-versions');
require('debug');
require('local-pkg');
require('magic-string');

const vite = unplugin.createVitePlugin(plugin.pluginFactory);

module.exports = vite;
