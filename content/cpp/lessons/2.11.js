module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'Which line correctly includes **your own** header file `add.h` from the same project?',
      options: [
        '#include <add.h>',
        '#include add.h',
        '#include "add.h"',
        'include "add.h";'
      ],
      answer: 2,
      explain: 'Your own headers use double quotes so the preprocessor searches your project first. Angle brackets are for standard and installed library headers. A directive needs the `#`, has no semicolon, and the name must be in quotes or angle brackets.'
    }
  ]
};
