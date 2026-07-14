// scripts/translate-nav-items-ui-zh-cn.mjs
// One-off script: converts messages/zh-TW.json's Nav + Items namespaces to Simplified
// Chinese via OpenCC and writes them into messages/zh-CN.json, leaving every other key
// in zh-CN.json untouched. Mirrors scripts/translate-grail-ui-zh-cn.mjs. Not part of the
// build; run once, then leave as a reference for the next time Nav/Items zh-TW text
// changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as OpenCC from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES = join(__dirname, '..', 'messages');

const toZhCn = OpenCC.Converter({ from: 'tw', to: 'cn' });

const zhTw = JSON.parse(readFileSync(join(MESSAGES, 'zh-TW.json'), 'utf8'));
const zhCn = JSON.parse(readFileSync(join(MESSAGES, 'zh-CN.json'), 'utf8'));

zhCn.Nav = Object.fromEntries(
  Object.entries(zhTw.Nav).map(([key, value]) => [key, toZhCn(value)])
);
zhCn.Items = Object.fromEntries(
  Object.entries(zhTw.Items).map(([key, value]) => [key, toZhCn(value)])
);

writeFileSync(join(MESSAGES, 'zh-CN.json'), JSON.stringify(zhCn, null, 2) + '\n');
console.log('Converted Nav + Items namespaces to zh-CN.');
