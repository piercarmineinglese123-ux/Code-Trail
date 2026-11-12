// Run with: node tests/ui.test.js   (needs playwright + chromium)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'file://' + path.join(__dirname, '../www/index.html');
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, n + '.png') });
  const wait = (ms) => page.waitForTimeout(ms);

  await page.goto(URL);
  await wait(200);
  ok(await page.locator('.hero h1').innerText() === 'C++', 'home shows the C++ course');
  ok((await page.locator('.lrow').count()) === 34, 'home lists 34 lessons across 3 chapters');
  await shot('01-home');

  // drawer menu
  await page.click('[data-act=menu]');
  await wait(350);
  ok(await page.locator('#drawer.open').count() === 1, 'menu button opens the drawer');
  ok((await page.locator('.dr-item').count()) >= 12, 'drawer lists all courses + revise + settings');
  ok((await page.locator('.dr-item.current').innerText()).includes('C++'), 'current course highlighted');
  await shot('02-drawer');
  await page.click('.dr-item.soon >> nth=0');
  await wait(200);
  ok((await page.locator('#toast.show').count()) === 1, 'unavailable course shows a "soon" toast');
  await page.click('.dr-item.current');
  await wait(450);
  ok(await page.locator('#drawer.open').count() === 0, 'choosing a course closes the drawer');

  // open lesson 1.1 -> theory
  await page.click('.lrow >> nth=0');
  await wait(200);
  ok((await page.locator('.lesson-title').innerText()).includes('Statements'), 'lesson theory opens');
  ok((await page.locator('pre.code').count()) >= 1, 'theory renders code blocks');
  ok((await page.locator('.tk-k').count()) > 0, 'syntax highlighting is applied');
  ok((await page.locator('.recap li').count()) >= 3, 'recap shown');
  await shot('03-theory');

  // exercise 1 of 1.1 (code)
  await page.click('[data-act=start-exercises]');
  await wait(200);
  ok(await page.locator('#code').count() === 1, 'code exercise shows an editor');
  await page.click('[data-fx=check]');
  await wait(200);
  ok((await page.locator('.fb.warn, .fb.bad').count()) >= 1, 'starter code is rejected');
  await shot('04-code-fail');
  await page.fill('#code', '#include <iostream>\n\nint main()\n{\n    std::cout << "Hello, world!\\n";\n    return 0;\n}\n');
  await page.click('[data-fx=run]');
  await wait(300);
  ok((await page.locator('.console pre').innerText()).includes('Hello, world!'), 'Run shows program output in the console');
  await shot('05-code-run');
  await page.click('[data-fx=check]');
  await wait(200);
  ok((await page.locator('.fb.ok').count()) === 1, 'correct code passes the tests');
  await shot('06-code-pass');
  await page.click('[data-fx=next]');
  await wait(250);
  ok(page.url().endsWith('/done'), 'finishing the last exercise opens the lesson-complete screen');
  await shot('07-done');
  const st1 = await page.evaluate(() => window.__codetrail.state());
  ok(st1.progress.cpp.lessons['1.1'].done === true, 'lesson 1.1 is marked done');
  ok(st1.xp === 30, 'XP awarded (10 exercise + 20 lesson) = ' + st1.xp);

  // go to next lesson via button; 1.2 is a single-choice
  await page.click('[data-act=open-lesson]');
  await wait(200);
  ok((await page.locator('.lesson-title').innerText()).includes('Comments'), 'next lesson is 1.2');
  await page.click('[data-act=start-exercises]');
  await wait(200);
  await page.click('.opt >> nth=0');
  await page.click('[data-fx=check]');
  await wait(150);
  ok((await page.locator('.fb.bad').count()) === 1, 'wrong choice gets feedback');
  ok((await page.locator('.opt.bad').count()) === 1, 'wrong option is greyed out');
  await shot('08-choice-wrong');
  await page.click('.opt >> nth=1');
  await page.click('[data-fx=check]');
  await wait(150);
  ok((await page.locator('.fb.ok').count()) === 1, 'right choice accepted');
  await shot('09-choice-right');
  await page.click('[data-fx=next]');
  await wait(200);
  ok(page.url().endsWith('/done'), '1.2 completes');

  // reload -> persistence + resume
  await page.goto(URL + '#/');
  await page.reload();
  await wait(250);
  ok((await page.locator('.lrow.done').count()) === 2, 'progress survives a reload (2 lessons done)');
  ok((await page.locator('.hero .btn.primary').innerText()).includes('1.3'), 'Continue button points at lesson 1.3');
  await shot('10-home-progress');

  // lesson 1.7 (multi), 1.10 (text)
  await page.evaluate(() => window.__codetrail.go('#/lesson/cpp/1.7/1'));
  await wait(200);
  await page.click('.opt >> nth=0'); await page.click('.opt >> nth=2');
  await page.click('[data-fx=check]'); await wait(150);
  ok((await page.locator('.fb.ok').count()) === 1, 'multi-select exercise accepts the right set');
  await shot('11-multi');
  await page.evaluate(() => window.__codetrail.go('#/lesson/cpp/1.10/1'));
  await wait(200);
  await page.fill('#ans', '11'); await page.click('[data-fx=check]'); await wait(150);
  ok((await page.locator('.fb.bad').count()) === 1, 'text exercise rejects a wrong answer');
  await page.fill('#ans', '10'); await page.press('#ans', 'Enter'); await wait(150);
  ok((await page.locator('.fb.ok').count()) === 1, 'text exercise accepts 10 (Enter key works)');
  await shot('12-text');

  // stdin exercise 1.5
  await page.evaluate(() => window.__codetrail.go('#/lesson/cpp/1.5/1'));
  await wait(200);
  await page.fill('#code', '#include <iostream>\nint main(){ int a{}; int b{}; std::cin >> a >> b; std::cout << "Sum: " << a + b << "\\n"; }');
  await page.click('[data-fx=check]'); await wait(200);
  ok((await page.locator('.fb.ok').count()) === 1, 'cin exercise passes all 4 tests');
  await page.fill('#code', '#include <iostream>\nint main(){ int a{}; std::cin >> a >> b; }');
  await page.click('[data-fx=check]'); await wait(200);
  ok((await page.locator('.fb.bad').count()) >= 1 && (await page.locator('.gutter i.err').count()) === 1, 'compile error is shown and its line is flagged in the gutter');
  await shot('13-compile-error');

  // revise
  await page.evaluate(() => window.__codetrail.go('#/revise'));
  await wait(200);
  ok((await page.locator('details.rev').count()) >= 2, 'Revise lists finished lessons');
  await shot('14-revise');
  await page.click('[data-act=review-quick]');
  await wait(250);
  ok(page.url().includes('#/review'), 'quick review starts');
  await shot('15-review');

  // settings: dark theme
  await page.evaluate(() => window.__codetrail.go('#/settings'));
  await wait(150);
  await page.click('[data-set=theme] [data-v=dark]');
  await wait(150);
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'dark theme applies');
  await shot('16-settings-dark');
  await page.evaluate(() => window.__codetrail.go('#/lesson/cpp/1.9/0'));
  await wait(200);
  await shot('17-theory-dark');
  await page.evaluate(() => window.__codetrail.go('#/lesson/cpp/1.5/1'));
  await wait(200);
  await shot('18-code-dark');

  // no horizontal overflow anywhere
  for (const h of ['#/', '#/lesson/cpp/1.9/0', '#/lesson/cpp/1.4/1', '#/revise', '#/settings']) {
    await page.evaluate((x) => window.__codetrail.go(x), h); await wait(150);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(!over, 'no horizontal page overflow at ' + h);
  }

  ok(errors.length === 0, 'no console/page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? fails + ' UI check(s) FAILED' : 'all UI checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
