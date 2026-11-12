module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'The execution marker is on a line that calls `calculateTotal()`. You trust that function and just want to move to the next line of the current function. Which command should you use?',
      options: ['Step into', 'Step over', 'Step out', 'Restart the program'],
      answer: 1,
      explain: '**Step over** runs the whole function call in one go and pauses on the next line. Step into would enter `calculateTotal`, and step out would leave the current function.'
    }
  ]
};
