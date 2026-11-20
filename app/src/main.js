import { SIZES, LAYOUTS, GRADES, drawCover, panelsFor } from './cover.js';

const $ = id => document.getElementById(id);
const canvas = $('cover');
const params = new URLSearchParams(location.search);
const state = {
  title: 'AFTER DARK',
  subtitle: 'THE CITY NEVER FORGETS',
  layout: 'story',
  grade: 'vice',
  size: '1080x1080',
  illustrated: true,
  grain: true,
};
let slots = [];
let selected = 0;
let pending = 0;
let drag = null;
window.__shotReady = false;

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = src;
  });
}

function panelCount() {
  return panelsFor(state.layout, 1920, state.size === '1920x1080' ? 1080 : 1350).length;
}

function redraw() {
  const [w, h] = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  canvas.style.aspectRatio = `${w}/${h}`;
  canvas.style.maxWidth = state.size === '1920x1080' ? '100%' : 'min(100%, 650px)';
  drawCover(canvas, state, slots);
  $('dimensions').textContent = `${w} × ${h} PX`;
  $('exportSize').textContent = `${w} × ${h}`;
}

function syncSelection() {
  selected = Math.max(0, Math.min(selected, panelCount() - 1));
  $('panelName').textContent = `PANEL ${String(selected + 1).padStart(2, '0')}`;
  const zoom = Math.round((slots[selected]?.zoom || 1) * 100);
  $('zoom').value = zoom;
  $('zoomValue').textContent = `${zoom}%`;
  document.querySelectorAll('.panel').forEach((button, i) => {
    button.classList.toggle('selected', i === selected);
    button.setAttribute('aria-pressed', String(i === selected));
  });
}

function buildPanels() {
  $('panelList').innerHTML = Array.from({ length: panelCount() }, (_, i) => {
    const slot = slots[i];
    const number = String(i + 1).padStart(2, '0');
    const thumb = slot?.img.src || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2235%22 height=%2240%22%3E%3Crect width=%2235%22 height=%2240%22 fill=%22%23c6b0bd%22/%3E%3Cpath d=%22M0 33L12 19L20 28L27 21L35 30V40H0Z%22 fill=%22%23796580%22/%3E%3C/svg%3E';
    return `<button class="panel ${selected === i ? 'selected' : ''}" data-panel="${i}" aria-label="Select panel ${number}"><img class="thumb" alt="" src="${thumb}"><span class="panel-text"><b>PANEL ${number}</b><small>${slot ? 'PHOTO LOADED' : 'ADD A PHOTO'}</small></span><span class="panel-action">${slot ? '↻' : '＋'}</span></button>`;
  }).join('');
  document.querySelectorAll('[data-panel]').forEach(button => {
    button.onclick = () => {
      selected = Number(button.dataset.panel);
      syncSelection();
      if (!slots[selected]) choosePhoto(selected);
    };
  });
  syncSelection();
}

function buildChoices() {
  $('layouts').innerHTML = LAYOUTS.map(layout => `<button class="layout ${layout.id === state.layout ? 'selected' : ''}" data-layout="${layout.id}" aria-label="${layout.name}" aria-pressed="${layout.id === state.layout}"><span class="layout-art">${'<i></i>'.repeat(layout.id === 'quad' ? 4 : layout.id === 'duo' ? 2 : 3)}</span><small>${layout.name}</small></button>`).join('');
  $('grades').innerHTML = GRADES.map(grade => `<button class="grade ${grade.id === state.grade ? 'selected' : ''}" data-grade="${grade.id}" aria-pressed="${grade.id === state.grade}"><i></i>${grade.name}</button>`).join('');
  document.querySelectorAll('[data-layout]').forEach(button => button.onclick = () => {
    state.layout = button.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    selected = 0;
    buildPanels();
    redraw();
  });
  document.querySelectorAll('[data-grade]').forEach(button => button.onclick = () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    redraw();
  });
}

function choosePhoto(index) {
  pending = index;
  $('file').click();
}

async function addFiles(files, start = 0) {
  let loaded = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      slots[start] = { img: image, zoom: 1, x: 0, y: 0 };
      selected = start;
      start = (start + 1) % panelCount();
      loaded++;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (!loaded) return;
  buildPanels();
  redraw();
  $('status').textContent = 'PHOTOS READY · STILL ON YOUR DEVICE';
}

function selectSize(size) {
  state.size = size;
  document.querySelectorAll('[data-size]').forEach(button => button.classList.toggle('selected', button.dataset.size === size));
  buildPanels();
  redraw();
}

function moveSelection(dx, dy) {
  const slot = slots[selected];
  if (!slot) return;
  slot.x = Math.max(-1, Math.min(1, slot.x + dx));
  slot.y = Math.max(-1, Math.min(1, slot.y + dy));
  redraw();
}

$('title').addEventListener('input', event => { state.title = event.target.value; redraw(); });
$('subtitle').addEventListener('input', event => { state.subtitle = event.target.value; redraw(); });
for (const id of ['illustrated', 'grain']) $(id).addEventListener('change', event => { state[id] = event.target.checked; redraw(); });
document.querySelectorAll('[data-size]').forEach(button => button.onclick = () => selectSize(button.dataset.size));
$('addPhoto').onclick = () => choosePhoto(slots.findIndex(slot => !slot) < 0 ? 0 : slots.findIndex(slot => !slot));
$('file').onchange = async event => {
  try { await addFiles([...event.target.files], pending); }
  catch (error) { $('status').textContent = error.message.toUpperCase(); }
  event.target.value = '';
};
$('zoom').oninput = event => {
  if (!slots[selected]) return;
  slots[selected].zoom = Number(event.target.value) / 100;
  $('zoomValue').textContent = `${event.target.value}%`;
  redraw();
};
$('resetPanel').onclick = () => {
  if (slots[selected]) slots[selected] = { ...slots[selected], zoom: 1, x: 0, y: 0 };
  syncSelection();
  redraw();
};
document.querySelectorAll('[data-nudge]').forEach(button => button.onclick = () => {
  const moves = { up: [0, -.025], down: [0, .025], left: [-.025, 0], right: [.025, 0], reset: null };
  const move = moves[button.dataset.nudge];
  if (!move && slots[selected]) {
    slots[selected].x = 0;
    slots[selected].y = 0;
    redraw();
  } else if (move) moveSelection(...move);
});

function canvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return { x: (event.clientX - bounds.left) / bounds.width * canvas.width, y: (event.clientY - bounds.top) / bounds.height * canvas.height };
}

canvas.addEventListener('pointerdown', event => {
  const point = canvasPoint(event);
  const found = panelsFor(state.layout, canvas.width, canvas.height).findIndex(r => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
  if (found < 0) return;
  selected = found;
  syncSelection();
  if (!slots[selected]) return;
  drag = { point, x: slots[selected].x, y: slots[selected].y };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!drag) return;
  const point = canvasPoint(event);
  const r = panelsFor(state.layout, canvas.width, canvas.height)[selected];
  slots[selected].x = Math.max(-1, Math.min(1, drag.x + (point.x - drag.point.x) / r.w));
  slots[selected].y = Math.max(-1, Math.min(1, drag.y + (point.y - drag.point.y) / r.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('wheel', event => {
  if (!slots[selected]) return;
  event.preventDefault();
  slots[selected].zoom = Math.max(1, Math.min(3, slots[selected].zoom - event.deltaY * .001));
  syncSelection();
  redraw();
}, { passive: false });

async function exportCover() {
  const button = $('export');
  button.disabled = true;
  $('exportTop').disabled = true;
  $('status').textContent = 'RENDERING FULL-RESOLUTION PNG…';
  try {
    const output = document.createElement('canvas');
    [output.width, output.height] = SIZES[state.size];
    drawCover(output, state, slots);
    const blob = await new Promise((resolve, reject) => output.toBlob(result => result ? resolve(result) : reject(new Error('Export failed')), 'image/png'));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-cover-${state.size}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('status').textContent = `EXPORTED · ${output.width} × ${output.height} PNG`;
  } catch (error) {
    $('status').textContent = error.message.toUpperCase();
  } finally {
    button.disabled = false;
    $('exportTop').disabled = false;
  }
}
$('export').onclick = exportCover;
$('exportTop').onclick = exportCover;

async function initialise() {
  if (SIZES[params.get('size')]) state.size = params.get('size');
  if (LAYOUTS.some(item => item.id === params.get('layout'))) state.layout = params.get('layout');
  if (GRADES.some(item => item.id === params.get('grade'))) state.grade = params.get('grade');
  if (params.has('title')) state.title = params.get('title').slice(0, 24);
  if (params.has('subtitle')) state.subtitle = params.get('subtitle').slice(0, 42);
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  buildChoices();
  selectSize(state.size);
  const requested = params.get('photos');
  if (requested) {
    const names = [...new Set(requested.split(',').filter(name => /^(pier|boulevard)$/.test(name)))];
    const images = new Map(await Promise.all(names.map(async name => [name, await loadImage(`samples/${name}.jpg`)])));
    slots = requested.split(',').map(name => {
      const img = images.get(name);
      return img ? { img, zoom: 1, x: 0, y: 0 } : undefined;
    });
    buildPanels();
    redraw();
  }
  if (params.get('shot') === 'cover') {
    document.body.classList.add('shot-cover');
    document.body.appendChild(canvas);
    redraw();
  }
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}

initialise().catch(error => {
  $('status').textContent = error.message.toUpperCase();
  console.error(error);
});
