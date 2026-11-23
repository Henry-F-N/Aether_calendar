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

console.log(
  '👋 This message is being logged by the renderer process, included via Vite',
);

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
      const text = document.createElement('span');
      text.textContent = `${r.assignment}, due ${r.due}, Description ${r.description}`;
      li.append(checkbox, text);
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

    const asgn = document.getElementById('name').value;
    const due = document.getElementById('due').value;
    const note = document.getElementById('notes').value;

    if (asgn.trim() === "" || due.trim() === "") {
      valid.replaceChildren("Please enter a valid date and time");
    } else if (note.trim() === "") {
      await window.api.addAssignment({
        assignment: asgn,
        due: document.due,
        description: "No Description Given"
      });
    } else {
      await window.api.addAssignment({
        assignment: asgn,
        due: due,
        description: note
      });
    }
    

    form.reset();
    refresh();
  } catch (err) {
    console.error(err);
  }
});
refresh();