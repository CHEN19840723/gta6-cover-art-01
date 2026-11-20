/* Cover renderer — sealed-recording rebuild, 2026-11-20; version 1.1.0. */
export const SIZES = Object.freeze({
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
});

export const LAYOUTS = [
  { id: 'story', name: 'COVER STORY' },
  { id: 'duo', name: 'DOUBLE TAKE' },
  { id: 'trio', name: 'TRIPTYCH' },
  { id: 'quad', name: 'FOUR PLAY' },
];

export const GRADES = [
  { id: 'vice', name: 'SUNSET', filter: 'saturate(1.28) contrast(1.12)', colors: ['#ffc36b', '#e95891', '#432967'] },
  { id: 'neon', name: 'NEON', filter: 'saturate(1.48) contrast(1.18)', colors: ['#1be0d4', '#2458a5', '#e8319e'] },
  { id: 'noir', name: 'NOIR', filter: 'saturate(.6) contrast(1.22) sepia(.14)', colors: ['#ecc78c', '#886a72', '#282437'] },
];

export function panelsFor(layout, w, h) {
  const box = (x, y, width, height) => ({ x: x * w, y: y * h, w: width * w, h: height * h });
  if (layout === 'duo') return [box(0, 0, .5, 1), box(.5, 0, .5, 1)];
  if (layout === 'trio') return [box(0, 0, 1 / 3, 1), box(1 / 3, 0, 1 / 3, 1), box(2 / 3, 0, 1 / 3, 1)];
  if (layout === 'quad') return [box(0, 0, .5, .5), box(.5, 0, .5, .5), box(0, .5, .5, .5), box(.5, .5, .5, .5)];
  return w / h > 1.25
    ? [box(0, 0, .65, 1), box(.65, 0, .35, .5), box(.65, .5, .35, .5)]
    : [box(0, 0, 1, .69), box(0, .69, 1 / 3, .31), box(1 / 3, .69, 1 / 3, .31), box(2 / 3, .69, 1 / 3, .31)];
}

function emptyScene(ctx, r, index) {
  const sky = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  sky.addColorStop(0, '#f6b36c');
  sky.addColorStop(.45, '#d773a2');
  sky.addColorStop(1, '#38335e');
  ctx.fillStyle = sky;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#ffe0a0';
  ctx.beginPath();
  ctx.arc(r.x + r.w * (.28 + (index % 3) * .21), r.y + r.h * .27, Math.min(r.w, r.h) * .12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#35304c';
  ctx.fillRect(r.x, r.y + r.h * .72, r.w, r.h * .28);
  ctx.strokeStyle = '#35304c';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(4, r.w * .018);
  for (let n = 0; n < 2; n++) {
    const x = r.x + r.w * (.25 + n * .48);
    const y = r.y + r.h * .74;
    ctx.beginPath();
    ctx.moveTo(x, y + r.h * .26);
    ctx.quadraticCurveTo(x - r.w * .035, y, x + r.w * .015, y - r.h * .34);
    ctx.stroke();
    for (let a = 0; a < 7; a++) {
      const angle = a * Math.PI * 2 / 7;
      ctx.beginPath();
      ctx.moveTo(x, y - r.h * .33);
      ctx.quadraticCurveTo(x + Math.cos(angle) * r.w * .13, y - r.h * .44, x + Math.cos(angle) * r.w * .23, y - r.h * (.31 + (a % 2) * .055));
      ctx.stroke();
    }
  }
}

function paintPhoto(ctx, r, slot, grade, illustrated) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  if (!slot?.img) {
    emptyScene(ctx, r, 0);
    ctx.restore();
    return;
  }
  const image = slot.img;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.max(r.w / iw, r.h / ih) * slot.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const x = r.x + (r.w - dw) / 2 + slot.x * r.w;
  const y = r.y + (r.h - dh) / 2 + slot.y * r.h;
  ctx.filter = grade.filter + (illustrated ? ' contrast(1.08)' : '');
  ctx.drawImage(image, x, y, dw, dh);
  ctx.filter = 'none';
  const tint = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  tint.addColorStop(0, grade.colors[0] + '38');
  tint.addColorStop(.52, grade.colors[1] + '22');
  tint.addColorStop(1, grade.colors[2] + '80');
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = tint;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.colors[2] + '24';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (illustrated) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = '#ffb18c1c';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
}

function titleLines(text) {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words.length ? words : ['YOUR STORY'];
  let split = 1;
  let difference = Infinity;
  for (let i = 1; i < words.length; i++) {
    const current = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (current < difference) {
      difference = current;
      split = i;
    }
  }
  return [words.slice(0, split).join(' '), words.slice(split).join(' ')];
}

function drawTypography(ctx, w, h, title, subtitle) {
  const wide = w / h > 1.25;
  const lines = titleLines(title);
  const maxWidth = w * (wide ? .59 : .8);
  const availableHeight = h * (wide ? .5 : .34);
  let size = Math.min(availableHeight / (lines.length * .86), w * (wide ? .145 : .185));
  const family = 'Impact, Haettenschweiler, Arial Black, sans-serif';
  ctx.textAlign = wide ? 'left' : 'center';
  ctx.textBaseline = 'alphabetic';
  while (size > 20) {
    ctx.font = `italic 900 ${size}px ${family}`;
    if (Math.max(...lines.map(line => ctx.measureText(line).width)) <= maxWidth) break;
    size -= 2;
  }
  const total = lines.length * size * .86;
  const baseline = h * .91;
  const start = baseline - total + size * .77;
  const x = wide ? w * .055 : w * .5;
  ctx.save();
  ctx.transform(1, 0, -.065, 1, 0, 0);
  ctx.font = `italic 900 ${size}px ${family}`;
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const y = start + i * size * .86;
    ctx.shadowColor = '#1a112dcc';
    ctx.shadowBlur = size * .085;
    ctx.shadowOffsetY = size * .05;
    ctx.strokeStyle = '#30203e';
    ctx.lineWidth = size * .069;
    ctx.strokeText(line, x, y);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff9e9';
    ctx.fillText(line, x, y);
    ctx.globalAlpha = .5;
    ctx.fillStyle = '#f176a4';
    ctx.fillText(line, x + size * .017, y + size * .02);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff9e9';
    ctx.fillText(line, x, y);
  });
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.font = `700 ${Math.max(12, h * .013)}px Arial, sans-serif`;
  ctx.fillStyle = '#fff9ed';
  ctx.fillText(subtitle.toUpperCase(), w * .055, h * .958);
  ctx.fillStyle = '#edfa84';
  ctx.fillRect(w * .82, h * .949, w * .125, Math.max(4, h * .004));
}

export function drawCover(canvas, state, slots) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES.find(item => item.id === state.grade) || GRADES[0];
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#241b36';
  ctx.fillRect(0, 0, w, h);
  const gap = Math.max(6, w * .005);
  panelsFor(state.layout, w, h).forEach((r, i) => {
    const inner = { x: r.x + gap / 2, y: r.y + gap / 2, w: r.w - gap, h: r.h - gap };
    paintPhoto(ctx, inner, slots[i] || slots[0], grade, state.illustrated);
  });
  const shade = ctx.createLinearGradient(0, h * .35, 0, h);
  shade.addColorStop(0, '#17132900');
  shade.addColorStop(.56, '#17132912');
  shade.addColorStop(1, '#171329e8');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * .82, h * .08, 0, w * .82, h * .08, w * .6);
  glow.addColorStop(0, grade.colors[0] + '66');
  glow.addColorStop(1, grade.colors[0] + '00');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = .065;
    for (let y = 0; y < h; y += 5) {
      for (let x = y % 10; x < w; x += 10) {
        ctx.fillStyle = ((x * 17 + y * 11) % 31) > 15 ? '#fff' : '#000';
        ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.restore();
  }
  ctx.fillStyle = '#fff9e8';
  ctx.font = `700 ${Math.max(12, h * .012)}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('VICE / ORIGINAL STORIES', w * .04, h * .044);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#edfa84';
  ctx.fillText('INDEPENDENT ISSUE  /  06', w * .96, h * .044);
  drawTypography(ctx, w, h, state.title, state.subtitle);
  ctx.strokeStyle = '#fff9e877';
  ctx.lineWidth = Math.max(1, w * .0009);
  ctx.strokeRect(w * .018, h * .021, w * .964, h * .958);
}
