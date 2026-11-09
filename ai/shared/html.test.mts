import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dataTable, escapeHtml, htmlPage, statTiles } from './html.mts';

describe('shared HTML report helpers', () => {
  it('SH-01: escapeHtml escapes the five HTML-special characters', () => {
    assert.equal(escapeHtml(`<a href="x" title='y'>&`), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;');
  });

  it('SH-02: htmlPage escapes the title and lede but keeps the body as given', () => {
    const page = htmlPage({ title: '<x>', testId: 'r', heading: 'H', lede: '<b>', body: '<p>ok</p>' });
    assert.match(page, /^<!DOCTYPE html>/);
    assert.match(page, /<title>&lt;x&gt;<\/title>/);
    assert.match(page, /&lt;b&gt;/);
    assert.match(page, /<p>ok<\/p>/);
    assert.match(page, /data-testid="r"/);
  });

  it('SH-03: dataTable escapes cells unless they are marked as HTML', () => {
    const table = dataTable(['A', 'B'], [['<i>', { html: '<code>c</code>' }]]);
    assert.match(table, /<td>&lt;i&gt;<\/td>/);
    assert.match(table, /<td><code>c<\/code><\/td>/);
  });

  it('SH-04: statTiles shows each value with its label and tone', () => {
    const tiles = statTiles([{ label: 'Flaky', value: 2, tone: 'warn' }]);
    assert.match(tiles, /stat warn/);
    assert.match(tiles, />2</);
    assert.match(tiles, />Flaky</);
  });
});
