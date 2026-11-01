# solMaxima 0.73.0 · Who are you?

Ulti wins used to reach the English League as "Grade 5 Hufflepuff, device 1EaA…", so the teacher could not see who earned them. Now each student taps their name once, and every win in the League's Ulti_Log names the student and their class.

## 1. The picker

When the English League is on (`config.js` has an `ultiApi`), pressing **PLAY** (or **Continue**) for the first time on a device opens "Who are you?". Mr. Saymaz asks:
- **The class.** Only the classes of the grade the student already chose (the lesson's grade), and only classes that have someone in the chosen team. A grade with one class (6-C, 7-A, 8-B) skips this step.
- **The name.** Only the chosen team's names in that class, sorted with Turkish letters in place (Alparslan, Çağrı, Ömer, Yusuf). Each name has its team colour.
- **"Are you Zeynep?"** A card with the name, class and team: "Your guardian wins add Ulti to Grade 5 Slytherin." **Yes, that's me!** saves it.

Two links are always there:
- **Not here? Show everyone.** Lists every grade (tabs) and every team, for a student playing another team's creature or another grade's lesson.
- **Not on the list? Play without a name.** Plays as before (wins are counted for the creature's team and the lesson's grade) and does not ask again on this device.

The close button leaves the opening screen as it was; PLAY asks again.

## 2. On the opening screen

The footer shows who is playing ("Playing as Zeynep · 5-A") in place of "Team progress saves on this device", with **Change** for shared tablets. Before anyone is chosen it reads "Who are you?". Changing the name from here also selects that student's League team creature (they can still switch).

## 3. What the League receives

- `league.js` asks for a grade's roster with `{action:'roster', grade}`. The League answers with active students only: Student ID, name, class and team. No PIN is needed; these are the same names the League's public pages already show. The last answer is kept on the device, so the list also opens offline.
- Each area's start ticket now carries `student` (the Student ID, e.g. `5-A:slytherin:0`). The ID is checked against `^[A-Za-z0-9:_-]{1,100}$` before it is sent; without a name the start is unchanged.
- The League (v11.7.0) looks the ID up in the Roster tab. The win counts for **the student's own class grade and League team**, and Ulti_Log gets three new columns: **Class**, **Student ID**, **Student**. The win message uses the grade and team the League actually credited.
- An unknown or inactive ID still counts for the game's grade and team, and is logged as "(not on the roster)".
- Per-device limits are unchanged. The pools' player count now counts students (or devices for unnamed play).

Identity is trust-based (no student PIN): the teacher can see and correct any wrong name in Ulti_Log.

## 4. English League v11.7.0

The League side ships separately: `GOOGLE-APPS-SCRIPT-v11.7.0.gs` (ULTI_ROSTER, student lookup, three Ulti_Log columns, header migration in place) and `netlify/functions/ulti.mjs` (the public `roster` action, `student` signed into the ticket and forwarded). The solMaxima client works with older Leagues too: without the roster action the picker shows "can't be loaded" and students can play without a name.

## Files

- New: `src/student-picker.js`, `src/student.css`, `tests/student-identity-073.test.mjs`.
- Changed: `src/league.js` (`roster`, `cachedRoster`, `validStudentId`, `student` in `start`, credited grade/team in results), `src/corridor-app.js` (picker state and actions, `ensureStudent` before PLAY/Continue, student in each ticket), `src/launch-ui.js` (footer pill), `src/index.html`.
