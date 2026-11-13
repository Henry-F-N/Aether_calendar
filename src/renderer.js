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
  output.replaceChildren(
    ...rows.map((r) => {
      const li = document.createElement('li');
      li.textContent = `${r.assignment}, due ${r.due}, Description ${r.description}`;
      return li;
    })
  );
}

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // stops the page from reloading

  try {

    if (document.getElementById('notes').value == null) {
      await window.api.addAssignment({
        assignment: document.getElementById('name').value,
        due: document.getElementById('due').value,
        description: "No Description Given"
      });
    } else {
      await window.api.addAssignment({
        assignment: document.getElementById('name').value,
        due: document.getElementById('due').value,
        description: document.getElementById('notes').value
      });
    }
    

    form.reset();
    refresh();
  } catch (err) {
    console.error(err);
  }
});
refresh();