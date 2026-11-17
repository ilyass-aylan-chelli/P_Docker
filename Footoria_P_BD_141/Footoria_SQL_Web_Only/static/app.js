const sqlInput = document.getElementById('sqlInput');
const runButton = document.getElementById('runButton');
const clearButton = document.getElementById('clearButton');
const exampleButton = document.getElementById('exampleButton');
const downloadButton = document.getElementById('downloadButton');
const results = document.getElementById('results');
const message = document.getElementById('message');
const resultCount = document.getElementById('resultCount');
const runTime = document.getElementById('runTime');
const charCount = document.getElementById('charCount');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
let lastResult = null;

function updateCount(){ charCount.textContent = `${sqlInput.value.length} caractères`; }
sqlInput.addEventListener('input', updateCount);
updateCount();

function showMessage(text, type){
  message.textContent = text;
  message.className = `message ${type}`;
  message.hidden = false;
}
function clearMessage(){ message.hidden = true; message.textContent = ''; }

async function checkConnection(){
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    const online = response.ok && data.connected;
    statusDot.className = `status-dot ${online ? 'online' : 'offline'}`;
    statusText.textContent = online ? 'SQL Server connecté' : 'SQL Server indisponible';
  } catch {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'API indisponible';
  }
}

function renderResults(data){
  lastResult = data;
  downloadButton.disabled = !data.columns?.length;
  if (!data.columns || data.columns.length === 0){
    results.innerHTML = '<div class="empty"><div class="empty-icon">✓</div><strong>Requête exécutée</strong><p>SQL Server n’a retourné aucune colonne à afficher.</p></div>';
    resultCount.textContent = '0 ligne';
    return;
  }
  const header = data.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('');
  const body = data.rows.map(row => `<tr>${data.columns.map(c => `<td title="${escapeHtml(formatValue(row[c]))}">${escapeHtml(formatValue(row[c]))}</td>`).join('')}</tr>`).join('');
  results.innerHTML = `<div class="table-scroll"><table><thead><tr>${header}</tr></thead><tbody>${body || `<tr><td colspan="${data.columns.length}">Aucune ligne trouvée.</td></tr>`}</tbody></table></div><div class="table-foot">${data.row_count} ligne(s) affichée(s)${data.truncated_possible ? ` · limite de ${data.limit} lignes atteinte, il peut y avoir d'autres résultats` : ''}</div>`;
  resultCount.textContent = `${data.row_count} ligne(s)`;
}
function formatValue(value){ return value === null || value === undefined ? 'NULL' : String(value); }
function escapeHtml(value){ return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

async function executeQuery(){
  const sql = sqlInput.value.trim();
  if (!sql){ showMessage('Écris une requête SQL avant de l’exécuter.', 'error'); return; }
  clearMessage();
  runButton.disabled = true;
  runButton.textContent = 'Exécution…';
  const start = performance.now();
  try {
    const response = await fetch('/api/query', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({sql})
    });
    const data = await response.json();
    if (!response.ok || data.error){
      showMessage(data.error || 'Une erreur est survenue.', 'error');
      runTime.textContent = `${Math.round(performance.now()-start)} ms`;
      return;
    }
    renderResults(data);
    runTime.textContent = `${Math.round(performance.now()-start)} ms`;
    showMessage('Requête exécutée avec succès.', 'success');
  } catch (error){
    showMessage('Impossible de joindre le serveur web. Vérifie que Flask fonctionne.', 'error');
  } finally {
    runButton.disabled = false;
    runButton.innerHTML = '<span>▶</span> Exécuter la requête';
  }
}

runButton.addEventListener('click', executeQuery);
clearButton.addEventListener('click', () => { sqlInput.value = ''; updateCount(); clearMessage(); sqlInput.focus(); });
exampleButton.addEventListener('click', () => { sqlInput.value = 'SELECT TOP 100 *\nFROM dbo.Joueurs;'; updateCount(); sqlInput.focus(); });
sqlInput.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter'){ event.preventDefault(); executeQuery(); } });
downloadButton.addEventListener('click', () => {
  if (!lastResult?.columns?.length) return;
  const quote = value => `"${formatValue(value).replace(/"/g, '""')}"`;
  const lines = [lastResult.columns.map(quote).join(';'), ...lastResult.rows.map(row => lastResult.columns.map(col => quote(row[col])).join(';'))];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'footoria-resultats.csv'; link.click(); URL.revokeObjectURL(url);
});

checkConnection();
