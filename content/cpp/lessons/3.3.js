module.exports = {
  exercises: [
    {
      type: 'multi',
      prompt: 'Select **all** the habits that make debugging more effective.',
      options: [
        'Reproduce the bug reliably, with the smallest input that triggers it',
        'Change several things at once to save time',
        'Form a hypothesis and run an experiment to test it',
        'Check a value in the middle of the program to decide which half contains the bug',
        'Assume a function is correct without checking it'
      ],
      answers: [0, 2, 3],
      explain: 'Reproducible, minimal failures, hypothesis-driven experiments and halving the search area all speed things up. Changing several things at once hides which change mattered, and unchecked assumptions are a classic source of bugs.'
    }
  ]
};
