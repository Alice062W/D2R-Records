import { describe, it, expect } from 'vitest';
import en from './en.json';
import zhTw from './zh-TW.json';
import zhCn from './zh-CN.json';

describe('Nav + Items message namespaces', () => {
  const locales = { en, 'zh-TW': zhTw, 'zh-CN': zhCn } as const;

  it('all three locales have the same Nav keys', () => {
    const enKeys = Object.keys(en.Nav).sort();
    expect(Object.keys(zhTw.Nav).sort()).toEqual(enKeys);
    expect(Object.keys(zhCn.Nav).sort()).toEqual(enKeys);
  });

  it('all three locales have the same Items keys', () => {
    const enKeys = Object.keys(en.Items).sort();
    expect(Object.keys(zhTw.Items).sort()).toEqual(enKeys);
    expect(Object.keys(zhCn.Items).sort()).toEqual(enKeys);
  });

  it('every Nav and Items value is non-empty in every locale', () => {
    for (const [localeName, messages] of Object.entries(locales)) {
      for (const [key, value] of Object.entries({ ...messages.Nav, ...messages.Items })) {
        expect(value, `${localeName}.${key}`).not.toBe('');
      }
    }
  });

  it('zh-CN differs from zh-TW for at least one Nav value with Traditional-only characters', () => {
    expect(zhCn.Nav.group_gameItems).not.toBe(zhTw.Nav.group_gameItems);
  });
});
