/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 */

import './index.css';
import { parse, format, formatDistanceToNow, isSameWeek, 
  addWeeks, isBefore, startOfDay, isValid 
} from 'date-fns';

console.log(
  '👋 This message is being logged by the renderer process, included via Vite',
);

const clock = document.getElementById('clock');

function tick() {
  clock.textContent = format(new Date(), 'EEEE, MMMM d');
}



const form = document.getElementById('form');
const output = document.getElementById('output');

//makes the const for sorting
const WEEK_START = { weekStartsOn: 1 }; // Monday; use 0 for Sunday
const BUCKET_ORDER = ['Overdue', 'This week', 'Next week', 'Later'];

//checks which bucket the assignment should go in
function bucketFor(date, now = new Date()) {
  if (isBefore(date, startOfDay(now))) return 'Overdue';
  if (isSameWeek(date, now, WEEK_START)) return 'This week';
  if (isSameWeek(date, addWeeks(now, 1), WEEK_START)) return 'Next week';
  return 'Later';
}


//constructs the element that is displayed on the app
function buildItem(r, parsed) {
  const li = document.createElement('li');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.dataset.id = r.id;

  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = r.assignment;

  const until = document.createElement('span');
  until.className = 'until';
  until.textContent = formatDistanceToNow(parsed, { addSuffix: true });

  const dueDate = document.createElement('small');
  dueDate.className = 'due-date';
  dueDate.textContent = format(parsed, 'MMM d, yyyy');

  li.title = r.description;
  li.append(checkbox, name, until, dueDate);
  return li;
}


/**
 * runs every time something changes in the database or when the user tries something.
 * sorts the returned assignments and slots them into the buckets to be displayed
 */
async function refresh() {
  const rows = await window.api.listAssignments();
  const now = new Date();

  // parse once, sort soonest first, then bucket
  const items = rows
    .map((r) => ({ r, parsed: parse(r.due, 'yyyy/MM/dd', new Date()) }))
    .sort((a, b) => a.parsed - b.parsed);

  const groups = Object.fromEntries(BUCKET_ORDER.map((b) => [b, []]));
  for (const item of items) groups[bucketFor(item.parsed, now)].push(item);

  const nodes = [];
  for (const bucket of BUCKET_ORDER) {
    if (groups[bucket].length === 0) continue; // skip empty sections
    const heading = document.createElement('li');
    heading.className = 'group-heading';
    heading.textContent = bucket;
    nodes.push(heading, ...groups[bucket].map(({ r, parsed }) => buildItem(r, parsed)));
  }

  assignmentList.replaceChildren(...nodes);
}

//calls the deleteAssignment method if a checkbox is selected
assignmentList.addEventListener('change', async (event) => {
    event.preventDefault();
    if (!event.target.matches('input[type="checkbox"]')) return;
    if (event.target.checked) {
      try {
        const id = event.target.dataset.id;
        await window.api.deleteAssignment(Number(id))
        refresh();
      } catch (err) {
        console.error(err);
      }
    }
    
  });

//hands the contents of the assignment boxes back to the main process
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // stops the page from reloading

  try {

    valid.replaceChildren();

    const asgn = document.getElementById('name').value;
    const due = document.getElementById('due').value;
    const note = document.getElementById('notes').value;

    //checks to make sure there is a due date, then checks if its valid
    if (due.trim() === "") {
      valid.replaceChildren("Please enter a due date");
    } else {
      const parsed = parse(due, "yyyy/MM/dd", new Date());
      if (!isValid(parsed)) {
        valid.replaceChildren("Please enter a valid date");
      } else if (asgn.trim() === "") {
        valid.replaceChildren("Please enter a valid name");
      } else if (note.trim() === "") { //allows the user to not give a description
        await window.api.addAssignment({
          assignment: asgn,
          due: due,
          description: "No Description Given"
        });
      } else {
        await window.api.addAssignment({
          assignment: asgn,
          due: due,
          description: note
        });
      }
    }
    
    

    form.reset();
    refresh();
  } catch (err) {
    console.error(err);
  }
});
refresh();
tick();
setInterval(tick(), 1000);