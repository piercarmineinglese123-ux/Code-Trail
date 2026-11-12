module.exports = {
  exercises: [
    {
      type: 'multi',
      prompt: 'Select **all** the practices that help you find or prevent bugs early.',
      options: [
        'Turn on compiler warnings and fix them',
        'Initialize variables when you define them',
        'Test only with the one input that you know works',
        'Test each function as soon as you write it, including edge cases'
      ],
      answers: [0, 1, 3],
      explain: 'Warnings, initialized variables and early testing with edge cases all catch problems sooner. Testing only the input that already works tells you nothing about the cases where bugs hide.'
    }
  ]
};
