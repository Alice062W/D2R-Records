// scripts/translate-grail-ui-zh-cn.mjs
// One-off script: converts messages/zh-TW.json's Grail namespace + Footer.grailLink
// to Simplified Chinese via OpenCC and writes them into messages/zh-CN.json, leaving
// every other key in zh-CN.json (Home, Appraiser, Footer.support, Footer.tagline —
// already properly translated) untouched. Not part of the build; run once, then delete
// or leave as a reference for the next time the Grail namespace's zh-TW text changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as OpenCC from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES = join(__dirname, '..', 'messages');

const toZhCn = OpenCC.Converter({ from: 'tw', to: 'cn' });

const zhTw = JSON.parse(readFileSync(join(MESSAGES, 'zh-TW.json'), 'utf8'));
const zhCn = JSON.parse(readFileSync(join(MESSAGES, 'zh-CN.json'), 'utf8'));

zhCn.Grail = Object.fromEntries(
  Object.entries(zhTw.Grail).map(([key, value]) => [key, toZhCn(value)])
);
zhCn.Footer.grailLink = toZhCn(zhTw.Footer.grailLink);

writeFileSync(join(MESSAGES, 'zh-CN.json'), JSON.stringify(zhCn, null, 2) + '\n');
console.log('Converted Grail namespace + Footer.grailLink to zh-CN.');
