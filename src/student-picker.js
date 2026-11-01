// "Who are you?" (0.73.0): students tap their name from the English League roster, so the League's Ulti log shows
// who earned each win. They have already chosen their team (creature) and grade (lesson), so the picker shows only
// that grade's classes and, in their class, only their teammates' names: a short list. A grade with one class
// (6-C, 7-A, 8-B) skips the class step. "Not here? Show everyone" opens every grade and team, for a student playing
// another team's creature or another grade's lesson. A short confirmation says which grade and team the wins count
// for (their own League team). Markup only; corridor-app.js holds the state and handles the data-do actions.
const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const TEAM_NAMES = {
  gryffindor: 'Gryffindor',
  hufflepuff: 'Hufflepuff',
  slytherin: 'Slytherin',
  ravenclaw: 'Ravenclaw',
};
const collate = (a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' });
const skip = `<button class="student-skip" data-do="student-skip">Not on the list? Play without a name</button>`;
const everyone = `<button class="student-skip" data-do="student-all">Not here? Show everyone</button>`;
const ask = (figure, text) => `<div class="student-ask">${figure}<p class="guide-bubble">${esc(text)}</p></div>`;
// The students the picker lists: the chosen team only, unless "everyone" is on.
export const teammates = (students = [], team = '', all = false) =>
  students.filter(p => all || !team || p.team === team);
// The classes worth showing: those with at least one listed student.
export const pickerClasses = (classes = [], students = [], team = '', all = false) => {
  const listed = new Set(teammates(students, team, all).map(p => p.className));
  return classes.filter(c => listed.has(c));
};
export function classStepMarkup({
  grade = 5,
  team = '',
  all = false,
  classes = [],
  students = [],
  loading = false,
  offline = false,
  figure = '',
} = {}) {
  const shown = pickerClasses(classes, students, team, all),
    teamName = TEAM_NAMES[team] || '';
  const grades = all
    ? `<div class="student-grades" role="group" aria-label="Grade">${[5, 6, 7, 8]
        .map(
          g =>
            `<button class="student-grade${g === grade ? ' is-selected' : ''}" data-do="student-grade" data-value="${g}" aria-pressed="${g === grade}">Grade ${g}</button>`,
        )
        .join('')}</div>`
    : '';
  const body = loading
    ? '<p class="student-note">Loading the class list…</p>'
    : shown.length
      ? `<div class="student-classes">${shown.map(c => `<button class="student-class" data-do="student-class" data-value="${esc(c)}">${esc(c)}</button>`).join('')}</div>`
      : `<p class="student-note">${offline ? "The class list can't be loaded right now. Check the connection and try again." : 'No names are listed here yet.'}</p>${offline ? '<button class="secondary" data-do="student-retry">Try again</button>' : ''}`;
  const question = all || !teamName ? 'Which class are you in?' : `Grade ${grade} ${teamName}! Which class are you in?`;
  return `<div class="student-picker">${ask(figure, question)}${grades}${body}${all ? '' : everyone}${skip}</div>`;
}
export function nameStepMarkup({
  className = '',
  team = '',
  all = false,
  students = [],
  canGoBack = true,
  figure = '',
} = {}) {
  const teamName = TEAM_NAMES[team] || '';
  const list = teammates(students, team, all)
    .filter(p => p.className === className)
    .sort((a, b) => collate(a.name, b.name))
    .map(
      p =>
        `<button class="student-name team-${esc(p.team)}" data-do="student-pick" data-value="${esc(p.id)}"><i aria-hidden="true"></i>${esc(p.name)}</button>`,
    )
    .join('');
  const hello = all || !teamName ? `Hello, ${className}!` : `Hello, ${className} ${teamName}!`;
  const back = canGoBack
    ? `<div class="student-row"><button class="secondary" data-do="student-back">◀ Classes</button></div>`
    : '';
  return `<div class="student-picker">${ask(figure, `${hello} Tap your name.`)}<div class="student-names">${list || '<p class="student-note">No names in this class yet.</p>'}</div>${back}${all ? '' : everyone}${skip}</div>`;
}
export function confirmMarkup({ student, figure = '' } = {}) {
  const team = TEAM_NAMES[student.team] || student.team,
    grade = student.className.charAt(0);
  return `<div class="student-picker">${ask(figure, `Are you ${student.name}?`)}<div class="student-card team-${esc(student.team)}"><b>${esc(student.name)}</b><span>${esc(student.className)} · Team ${esc(team)}</span><small>Your guardian wins add Ulti to Grade ${esc(grade)} ${esc(team)}.</small></div><div class="student-row"><button class="secondary" data-do="student-back-names">No, go back</button><button class="primary-action" data-do="student-confirm">Yes, that's me!</button></div></div>`;
}
// The pill on the opening screen: who is playing, with a way to change it (shared tablets).
export function studentLineMarkup(student) {
  if (!student)
    return `<button type="button" class="launch-student is-empty" data-do="student">👤 <span>Who are you?</span><small>Choose</small></button>`;
  return `<button type="button" class="launch-student" data-do="student" aria-label="Playing as ${esc(student.name)}, ${esc(student.className)}. Change"><i class="team-dot team-${esc(student.team)}" aria-hidden="true"></i><span><em>Playing as </em><b>${esc(student.name)}</b> · ${esc(student.className)}</span><small>Change</small></button>`;
}
