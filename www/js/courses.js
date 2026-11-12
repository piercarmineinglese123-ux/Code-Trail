/*
 * Course registry: every course the app will eventually offer, in build order.
 * `available: true` means its lesson data (js/data/<id>.js) ships with the app.
 */
window.COURSE_REGISTRY = [
  { id: 'cpp', name: 'C++', mark: 'C++', color: '#2f6fd6', phase: 1, available: true,
    blurb: 'Modern C++ from first principles' },
  { id: 'rust', name: 'Rust', mark: 'Rs', color: '#c9602c', phase: 2, available: false,
    blurb: 'Ownership, borrowing and safe systems code' },
  { id: 'luau', name: 'Luau', mark: 'Lu', color: '#1f8ad6', phase: 3, available: false,
    blurb: 'Roblox scripting language' },
  { id: 'sql', name: 'SQL', mark: 'SQL', color: '#7a4fd1', phase: 4, available: false,
    blurb: 'Query databases with confidence' },
  { id: 'go', name: 'Go', mark: 'Go', color: '#12a4b8', phase: 5, available: false,
    blurb: 'Simple, fast, concurrent programs' },
  { id: 'gdscript', name: 'GDScript', mark: 'GD', color: '#3f7fc0', phase: 6, available: false,
    blurb: 'Make games with the Godot engine' },
  { id: 'odin-html', name: 'HTML', mark: '<>', color: '#e0572f', phase: 7, available: false, group: 'The Odin Project',
    blurb: 'Structure of the web' },
  { id: 'odin-css', name: 'CSS', mark: '{}', color: '#2d6cdf', phase: 7, available: false, group: 'The Odin Project',
    blurb: 'Style and layout' },
  { id: 'odin-js', name: 'JavaScript', mark: 'JS', color: '#c9a400', phase: 8, available: false, group: 'The Odin Project',
    blurb: 'Programming for the web' },
  { id: 'odin-ruby', name: 'Ruby', mark: 'Rb', color: '#c2263a', phase: 9, available: false, group: 'The Odin Project',
    blurb: 'A programmer-friendly language' },
  { id: 'odin-rails', name: 'Ruby on Rails', mark: 'Ra', color: '#a3182b', phase: 10, available: false, group: 'The Odin Project',
    blurb: 'Full-stack web apps' }
];
