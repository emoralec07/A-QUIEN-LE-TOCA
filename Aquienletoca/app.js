//  Estado de la aplicación 
let participants = [];
let expenses = [];

//  Referencias al DOM 
const nameInput = document.getElementById("nameInput");
const descInput = document.getElementById("descInput");
const amountInput = document.getElementById("amountInput");
const payerSelect = document.getElementById("payerSelect");
const tagList = document.getElementById("tagList");
const splitGroup = document.getElementById("splitGroup");
const expenseList = document.getElementById("expenseList");
const balanceList = document.getElementById("balanceList");

//  Eventos 

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addParticipant();
});

//  Participantes 

function addParticipant() {
  const name = nameInput.value.trim();
  if (!name || participants.includes(name)) {
    nameInput.value = "";
    return;
  }
  participants.push(name);
  nameInput.value = "";
  renderParticipants();
  renderBalances();
}

function removeParticipant(name) {
  participants = participants.filter((p) => p !== name);

  // También eliminamos gastos donde participaba

  expenses = expenses.filter((e) => e.payer !== name);
  renderParticipants();
  renderExpenses();
  renderBalances();
}

function renderParticipants() {

  // Tags

  tagList.innerHTML = participants
    .map(
      (p) => `
      <div class="tag">
        ${p}
        <span onclick="removeParticipant('${p}')">×</span>
      </div>
    `,
    )
    .join("");

  // Select de pagador

  payerSelect.innerHTML =
    '<option value="">— seleccionar —</option>' +
    participants.map((p) => `<option value="${p}">${p}</option>`).join("");

  // Checkboxes para dividir

  splitGroup.innerHTML = participants
    .map(
      (p) => `
      <label class="check-item selected" id="ci-${p}" onclick="toggleCheck('${p}')">
        <input type="checkbox" value="${p}" checked /> ${p}
      </label>
    `,
    )
    .join("");
}

function toggleCheck(name) {
  const el = document.getElementById("ci-" + name);
  const cb = el.querySelector("input");
  cb.checked = !cb.checked;
  el.classList.toggle("selected", cb.checked);
}

// Gastos 
function addExpense() {
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const payer = payerSelect.value;
  const splitWith = [...splitGroup.querySelectorAll("input:checked")].map(
    (cb) => cb.value,
  );

  if (
    !desc ||
    isNaN(amount) ||
    amount <= 0 ||
    !payer ||
    splitWith.length === 0
  ) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  expenses.push({ desc, amount, payer, splitWith });

  // Limpiar formulario

  descInput.value = "";
  amountInput.value = "";
  payerSelect.value = "";
  splitGroup.querySelectorAll(".check-item").forEach((el) => {
    el.classList.add("selected");
    el.querySelector("input").checked = true;
  });

  renderExpenses();
  renderBalances();
}

function removeExpense(index) {
  expenses.splice(index, 1);
  renderExpenses();
  renderBalances();
}

function renderExpenses() {
  if (expenses.length === 0) {
    expenseList.innerHTML =
      '<p class="empty">Aún no hay gastos registrados.</p>';
    return;
  }

  expenseList.innerHTML = expenses
    .map(
      (e, i) => `
      <div class="expense-item">
        <div class="left">
          <div class="desc">${e.desc}</div>
          <div class="meta">Pagó: <b>${e.payer}</b> · Entre: ${e.splitWith.join(", ")}</div>
        </div>
        <span class="amount">S/ ${e.amount.toFixed(2)}</span>
        <button class="btn btn-sm" onclick="removeExpense(${i})">✕</button>
      </div>
    `,
    )
    .join("");
}

// Balances 
function renderBalances() {
  if (participants.length < 2 || expenses.length === 0) {
    balanceList.innerHTML =
      '<p class="empty">Agrega participantes y gastos para ver los balances.</p>';
    return;
  }

  // 1. Calcular el neto de cada persona

  const net = {};
  participants.forEach((p) => (net[p] = 0));

  expenses.forEach((e) => {
    const share = e.amount / e.splitWith.length;
    net[e.payer] += e.amount; // quien pagó suma
    e.splitWith.forEach((p) => (net[p] -= share)); // cada uno resta su parte
  });

  // 2. Separar acreedores y deudores

  const creditors = [];
  const debtors = [];

  Object.entries(net).forEach(([name, val]) => {
    if (val > 0.005) creditors.push({ name, val });
    else if (val < -0.005) debtors.push({ name, val: -val });
  });

  // 3. Simplificar deudas (algoritmo greedy)

  const transactions = [];
  let ci = 0,
    di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.val, d.val);

    transactions.push({ from: d.name, to: c.name, amount });

    c.val -= amount;
    d.val -= amount;

    if (c.val < 0.005) ci++;
    if (d.val < 0.005) di++;
  }

  // 4. Renderizar
  
  if (transactions.length === 0) {
    balanceList.innerHTML = '<p class="empty">✅ ¡Todo está saldado!</p>';
    return;
  }

  balanceList.innerHTML = transactions
    .map(
      (t) => `
      <div class="balance-item negative">
        <span>👤 <b>${t.from}</b></span>
        <span class="arrow">→</span>
        <span>le debe <b style="color:var(--accent)">S/ ${t.amount.toFixed(2)}</b> a <b>${t.to}</b></span>
      </div>
    `,
    )
    .join("");
}
