module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'Which directive completes this header guard in the blank?',
      code: `#ifndef ADD_H
#define ADD_H

int add(int x, int y);

_______`,
      options: ['#end', '#undef ADD_H', '#endif', '#ifdef ADD_H'],
      answer: 2,
      explain: 'Every `#ifndef` must be closed by `#endif`. The first time the header is included, `ADD_H` is not defined, so the contents are kept; afterwards `ADD_H` exists and the whole block is skipped.'
    }
  ]
};
