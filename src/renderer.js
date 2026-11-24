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
import { format, formatDistanceToNow, parse, isValid } from 'date-fns';

console.log(
  '👋 This message is being logged by the renderer process, included via Vite',
);

const clock = document.getElementById('clock');

function tick() {
  clock.textContent = format(new Date(), 'EEEE, MMMM d');
}



const form = document.getElementById('form');
const output = document.getElementById('output');

async function refresh() {
  const rows = await window.api.listAssignments();
  assignmentList.replaceChildren(
    ...rows.map((r) => {
      const li = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.id = r.id;
      const parsed = parse(r.due, 'yyyy/MM/dd', new Date());

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
    })
  );
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
}

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // stops the page from reloading

  try {

    valid.replaceChildren();

    const asgn = document.getElementById('name').value;
    const due = document.getElementById('due').value;
    const note = document.getElementById('notes').value;

    if (due.trim() === "") {
      valid.replaceChildren("Please enter a due date");
    } else {
      const parsed = parse(due, "yyyy/MM/dd", new Date());
      if (!isValid(parsed)) {
        valid.replaceChildren("Please enter a valid date");
      } else if (asgn.trim() === "") {
        valid.replaceChildren("Please enter a valid name");
      } else if (note.trim() === "") {
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