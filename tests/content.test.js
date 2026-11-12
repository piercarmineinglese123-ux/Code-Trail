// Run with: node tests/content.test.js   (after: node tools/build-content.js)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { grade } = require('../www/js/interp.js');

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of fs.readdirSync(path.join(__dirname, '../www/js/data'))) {
  if (f.endsWith('.js')) vm.runInContext(fs.readFileSync(path.join(__dirname, '../www/js/data', f), 'utf8'), sandbox);
}

let fails = 0, lessons = 0, exercises = 0;
const bad = (msg) => { fails++; console.log('FAIL ' + msg); };

for (const [cid, course] of Object.entries(sandbox.window.COURSES)) {
  for (const ch of course.chapters) for (const les of ch.lessons) {
    lessons++;
    const tag = cid + ' ' + les.id;
    if (!les.theory || les.theory.length < 300) bad(tag + ': theory missing or too short');
    if (!les.recap.length) bad(tag + ': no recap bullets');
    if (!les.exercises.length) bad(tag + ': no exercises');
    les.exercises.forEach((ex, i) => {
      exercises++;
      const t = tag + ' ex' + (i + 1) + ' (' + ex.type + ')';
      if (!ex.prompt) bad(t + ': no prompt');
      if (ex.type === 'choice') {
        if (ex.options.length !== 4) bad(t + ': choice needs exactly 4 options');
        if (!(ex.answer >= 0 && ex.answer < ex.options.length)) bad(t + ': answer out of range');
        if (!ex.explain) bad(t + ': no explanation');
      } else if (ex.type === 'multi') {
        if (!ex.answers.length || ex.answers.some((a) => a < 0 || a >= ex.options.length)) bad(t + ': bad answers');
        if (!ex.explain) bad(t + ': no explanation');
      } else if (ex.type === 'text') {
        if (!ex.accept || !ex.accept.length) bad(t + ': no accepted answers');
      } else if (ex.type === 'code') {
        if (!ex.tests.length) bad(t + ': no tests');
        const sol = grade(ex, ex.solution);
        if (!sol.pass) bad(t + ': reference solution FAILS: ' + JSON.stringify(sol).slice(0, 400));
        const st = grade(ex, ex.starter);
        if (st.pass) bad(t + ': the starter code already passes (exercise is pre-solved)');
        if (!ex.hint) bad(t + ': no hint');
      } else bad(t + ': unknown type');
    });
  }
}
console.log(fails ? fails + ' problem(s) found' : 'content OK: ' + lessons + ' lessons, ' + exercises + ' exercises, all solutions pass and no starter passes');
process.exit(fails ? 1 : 0);
