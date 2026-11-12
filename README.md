# CodeTrail (phase 1: C++)

A Hyperskill-style app for learning programming languages on Android.
Everything runs offline on the phone: lessons, quizzes, and an in-app code editor whose programs are
run and checked automatically by a built-in mini C++ interpreter.

## What is in phase 1

- Course menu (hamburger button) with every planned course; only C++ is open for now.
  The app reopens in the last course you picked.
- C++ course, chapter 1, lessons 1.1 to 1.10, each with concise theory, a recap and one exercise
  (quiz, multi-select, type-the-answer or code). A lesson becomes **done** when all its exercises are solved.
- Code exercises: editor, symbol bar, program-input box, Run, Check, hints, line-flagged errors, solution after 3 tries.
- **Revise** section: quick mixed review (weak and old exercises come up more often) or practice a single lesson.
- XP, day streak, light/dark theme, progress saved on the device.

## Get the APK (no Android Studio needed)

1. Create a free GitHub account and a new **private** repository.
2. Upload the contents of this folder to it (drag and drop all files in the web page, including the hidden `.github` folder;
   or use `git push`).
3. Open the repository's **Actions** tab, pick **Build Android APK**, and wait about 5 minutes.
4. Open the finished run and download the **CodeTrail-debug-apk** artifact. Unzip it and install `app-debug.apk` on your phone
   (allow "install unknown apps" when asked).

## Build it yourself

Requirements: Node 20+, JDK 21, Android Studio (or the Android SDK).

```bash
npm install
npm test                 # builds the lesson data and runs the checks
npx cap add android      # first time only
npx cap sync android
npx cap open android     # then press Run in Android Studio
```

Or from the command line: `cd android && ./gradlew assembleDebug`
(output: `android/app/build/outputs/apk/debug/app-debug.apk`).

## Try it in a browser

Open `www/index.html` in any browser (a phone-sized window looks best).

## Project layout

| Path | What it is |
|---|---|
| `www/` | The app (HTML, CSS, JS). `index.html` is the entry point. |
| `www/js/interp.js` | The mini C++ interpreter and exercise grader. |
| `www/js/app.js` | Screens, navigation, progress, exercises. |
| `www/js/courses.js` | Registry of all planned courses (the drawer menu). |
| `www/js/data/cpp.js` | **Generated** lesson data. Do not edit by hand. |
| `content/cpp/` | Lesson sources: `course.json`, `lessons/<id>.md` (theory), `lessons/<id>.js` (exercises). |
| `tools/build-content.js` | Packs `content/` into `www/js/data/`. Run `npm run build:content` after editing lessons. |
| `tests/` | Interpreter tests, lesson validation (every reference solution must pass, no starter may pass). |

## Adding a lesson

1. Add it to `content/cpp/course.json`.
2. Write `content/cpp/lessons/<id>.md` (end with a `## Recap` bullet list) and `<id>.js` (exercises).
3. `npm test`. It fails if a reference solution does not pass its own tests.

Exercise types: `choice` (4 options, `answer` index), `multi` (`answers` indexes), `text` (`accept` list),
`code` (`starter`, `tests: [{ input, expected }]`, optional `require` regexes, `hint`, `solution`).

## Known limits

- The interpreter covers the beginner subset taught so far (variables, I/O, operators, if/loops, functions, `std::string` basics).
  Arrays, vectors, pointers, classes and so on are added in the phases that teach them; unsupported syntax gives a clear error.
- The build produces a **debug** APK, fine for your own phone. A Play Store release needs signing.
- Launcher icon and splash screen are Capacitor's defaults for now.
