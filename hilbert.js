class HilbertTimeflow {
  constructor() {
    this.storageKey = 'hilbert-timeflow-code';
    this.canvas = document.getElementById('hilbert-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.animationFrameId = null;
    this.animationStart = null;
    this.animationDuration = 1400;

    this.config = {
      title: 'Hilbert Timeflow',
      bubbleLabel: 'Checkpoint',
      preset: 'current-hour',
      startDate: '',
      endDate: '',
      durationMinutes: 60,
      chronoStartedAt: '',
      highlightEnabled: true,
      highlightAmount: 24,
      highlightUnit: 'hours',
      fractalOrder: 6,
    };

    this.ui = {
      title: document.getElementById('hilbert-title'),
      bubbleLabel: document.getElementById('hilbert-bubble-label'),
      startDate: document.getElementById('hilbert-start-date'),
      endDate: document.getElementById('hilbert-end-date'),
      durationMinutes: document.getElementById('hilbert-duration-minutes'),
      durationField: document.getElementById('hilbert-duration-field'),
      chronoStart: document.getElementById('hilbert-chrono-start'),
      highlightEnabled: document.getElementById('hilbert-highlight-enabled'),
      highlightAmount: document.getElementById('hilbert-highlight-amount'),
      highlightUnit: document.getElementById('hilbert-highlight-unit'),
      fractalOrder: document.getElementById('hilbert-order'),
      fractalOrderValue: document.getElementById('hilbert-order-value'),
      presetButtons: [...document.querySelectorAll('#hilbert-preset-group .segmented-btn')],
      code: document.getElementById('hilbert-code'),
      generateCode: document.getElementById('hilbert-generate-code'),
      copyCode: document.getElementById('hilbert-copy-code'),
      loadCode: document.getElementById('hilbert-load-code'),
      statProgress: document.getElementById('hilbert-stat-progress'),
      statRemaining: document.getElementById('hilbert-stat-remaining'),
      statPreset: document.getElementById('hilbert-stat-preset'),
      statHighlight: document.getElementById('hilbert-stat-highlight'),
    };

    this.init();
  }

  init() {
    this.setCustomDefaults();
    this.readSavedCode();
    this.syncForm();
    this.bindEvents();
    this.refreshCode();
    this.start();
  }

  bindEvents() {
    this.ui.presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.config.preset = button.dataset.preset;
        if (this.config.preset !== 'chronometer') {
          this.config.chronoStartedAt = '';
        }
        if (this.config.preset !== 'custom' && this.config.preset !== 'chronometer') {
          this.applyPreset(new Date());
        } else if (this.config.preset === 'custom') {
          this.setCustomDefaultsIfMissing();
        } else {
          this.config.startDate = this.toLocalInput(new Date());
          this.config.endDate = this.toLocalInput(new Date(Date.now() + this.config.durationMinutes * 60 * 1000));
        }
        this.syncForm();
        this.bumpAnimation();
        this.refreshCode();
      });
    });

    this.ui.title.addEventListener('input', () => this.readForm());
    this.ui.bubbleLabel.addEventListener('input', () => this.readForm());
    this.ui.startDate.addEventListener('change', () => this.readForm());
    this.ui.endDate.addEventListener('change', () => this.readForm());
    this.ui.durationMinutes.addEventListener('input', () => this.readForm());
    this.ui.chronoStart.addEventListener('click', () => this.startChronometer());
    this.ui.highlightEnabled.addEventListener('change', () => this.readForm());
    this.ui.highlightAmount.addEventListener('input', () => this.readForm());
    this.ui.highlightUnit.addEventListener('change', () => this.readForm());
    this.ui.fractalOrder.addEventListener('input', () => this.readForm());

    this.ui.generateCode.addEventListener('click', () => {
      this.readForm();
      this.refreshCode();
    });

    this.ui.copyCode.addEventListener('click', async () => {
      this.refreshCode();
      await navigator.clipboard.writeText(this.ui.code.value);
      this.flashButton(this.ui.copyCode, 'Copied');
    });

    this.ui.loadCode.addEventListener('click', () => {
      try {
        this.applyCode(this.ui.code.value.trim(), true);
        this.flashButton(this.ui.loadCode, 'Loaded');
      } catch (error) {
        window.alert(error.message);
      }
    });
  }

  start() {
    const loop = (timestamp) => {
      this.render(timestamp);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  bumpAnimation() {
    this.animationStart = null;
  }

  readForm() {
    this.config.title = this.ui.title.value.trim() || 'Hilbert Timeflow';
    this.config.bubbleLabel = this.ui.bubbleLabel.value.trim() || 'Checkpoint';
    this.config.startDate = this.ui.startDate.value;
    this.config.endDate = this.ui.endDate.value;
    this.config.durationMinutes = Math.max(1, Number(this.ui.durationMinutes.value) || 60);
    this.config.highlightEnabled = this.ui.highlightEnabled.checked;
    this.config.highlightAmount = Math.max(1, Number(this.ui.highlightAmount.value) || 1);
    this.config.highlightUnit = this.ui.highlightUnit.value;
    this.config.fractalOrder = Number(this.ui.fractalOrder.value) || 6;
    this.toggleDisabledFields();
    this.ui.fractalOrderValue.textContent = String(this.config.fractalOrder);
    this.bumpAnimation();
    this.refreshCode();
  }

  syncForm() {
    this.ui.title.value = this.config.title;
    this.ui.bubbleLabel.value = this.config.bubbleLabel;
    this.ui.startDate.value = this.config.startDate;
    this.ui.endDate.value = this.config.endDate;
    this.ui.durationMinutes.value = String(this.config.durationMinutes);
    this.ui.highlightEnabled.checked = this.config.highlightEnabled;
    this.ui.highlightAmount.value = String(this.config.highlightAmount);
    this.ui.highlightUnit.value = this.config.highlightUnit;
    this.ui.fractalOrder.value = String(this.config.fractalOrder);
    this.ui.fractalOrderValue.textContent = String(this.config.fractalOrder);

    this.ui.presetButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.preset === this.config.preset);
    });

    this.toggleDisabledFields();
  }

  toggleDisabledFields() {
    const customMode = this.config.preset === 'custom';
    const chronometerMode = this.config.preset === 'chronometer';
    this.ui.startDate.disabled = !customMode;
    this.ui.endDate.disabled = !customMode;
    document.body.classList.toggle('hilbert-show-duration', chronometerMode);
    this.ui.durationMinutes.disabled = !chronometerMode;
    this.ui.chronoStart.disabled = !chronometerMode;
    this.ui.chronoStart.textContent = chronometerMode && this.config.chronoStartedAt ? 'Restart' : 'Start';

    const highlightOff = !this.config.highlightEnabled;
    this.ui.highlightAmount.disabled = highlightOff;
    this.ui.highlightUnit.disabled = highlightOff;
  }

  setCustomDefaults() {
    const now = new Date();
    this.config.startDate = this.toLocalInput(now);
    this.config.endDate = this.toLocalInput(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    this.config.durationMinutes = 60;
    this.config.chronoStartedAt = '';
  }

  setCustomDefaultsIfMissing() {
    if (!this.config.startDate || !this.config.endDate) {
      this.setCustomDefaults();
    }
  }

  applyPreset(now) {
    const { start, end } = this.getPresetRange(this.config.preset, now);
    this.config.startDate = this.toLocalInput(start);
    this.config.endDate = this.toLocalInput(end);
  }

  getPresetRange(preset, now) {
    const date = new Date(now);

    if (preset === 'current-day') {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
    }

    if (preset === 'current-month') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
      return { start, end };
    }

    if (preset === 'current-year') {
      const start = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      return { start, end };
    }

    if (preset === 'chronometer') {
      const start = this.parseDate(this.config.chronoStartedAt) || date;
      const end = new Date(start.getTime() + this.config.durationMinutes * 60 * 1000);
      return { start, end };
    }

    if (preset === 'custom') {
      const start = this.parseDate(this.config.startDate) || date;
      const end = this.parseDate(this.config.endDate) || new Date(date.getTime() + 24 * 60 * 60 * 1000);
      return { start, end };
    }

    const start = new Date(date);
    start.setMinutes(0, 0, 0);
    return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
  }

  getRenderConfig(now) {
    if (this.config.preset !== 'custom' && this.config.preset !== 'chronometer') {
      this.applyPreset(now);
      this.ui.startDate.value = this.config.startDate;
      this.ui.endDate.value = this.config.endDate;
    }

    if (this.config.preset === 'chronometer') {
      const start = this.parseDate(this.config.chronoStartedAt);
      if (!start) {
        this.config.startDate = this.toLocalInput(now);
        this.config.endDate = this.toLocalInput(new Date(now.getTime() + this.config.durationMinutes * 60 * 1000));
        this.ui.startDate.value = this.config.startDate;
        this.ui.endDate.value = this.config.endDate;
        return {
          ...this.config,
          startDate: this.parseDate(this.config.startDate),
          endDate: this.parseDate(this.config.endDate),
        };
      }

      const end = new Date(start.getTime() + this.config.durationMinutes * 60 * 1000);
      this.config.startDate = this.toLocalInput(start);
      this.config.endDate = this.toLocalInput(end);
      this.ui.startDate.value = this.config.startDate;
      this.ui.endDate.value = this.config.endDate;
    }

    return {
      ...this.config,
      startDate: this.parseDate(this.config.startDate),
      endDate: this.parseDate(this.config.endDate),
    };
  }

  refreshCode() {
    const payload = {
      v: 1,
      title: this.config.title,
      bubbleLabel: this.config.bubbleLabel,
      preset: this.config.preset,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      durationMinutes: this.config.durationMinutes,
      chronoStartedAt: this.config.chronoStartedAt,
      highlightEnabled: this.config.highlightEnabled,
      highlightAmount: this.config.highlightAmount,
      highlightUnit: this.config.highlightUnit,
      fractalOrder: this.config.fractalOrder,
    };

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    this.ui.code.value = encoded;
    localStorage.setItem(this.storageKey, encoded);
  }

  readSavedCode() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      return;
    }

    try {
      this.applyCode(saved, false);
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  applyCode(encoded, updateField) {
    if (!encoded) {
      throw new Error('Le code est vide.');
    }

    const parsed = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    this.config.title = parsed.title || 'Hilbert Timeflow';
    this.config.bubbleLabel = parsed.bubbleLabel || 'Checkpoint';
    this.config.preset = parsed.preset || 'current-hour';
    this.config.startDate = parsed.startDate || this.config.startDate;
    this.config.endDate = parsed.endDate || this.config.endDate;
    this.config.durationMinutes = Math.max(1, Number(parsed.durationMinutes) || 60);
    this.config.chronoStartedAt = parsed.chronoStartedAt || '';
    this.config.highlightEnabled = parsed.highlightEnabled !== false;
    this.config.highlightAmount = Math.max(1, Number(parsed.highlightAmount) || 24);
    this.config.highlightUnit = ['minutes', 'hours', 'days'].includes(parsed.highlightUnit) ? parsed.highlightUnit : 'hours';
    this.config.fractalOrder = Math.min(7, Math.max(1, Number(parsed.fractalOrder) || 6));

    this.syncForm();
    this.bumpAnimation();
    this.refreshCode();

    if (updateField) {
      this.ui.code.value = encoded;
    }
  }

  render(timestamp) {
    const now = new Date();
    const config = this.getRenderConfig(now);

    if (!config.startDate || !config.endDate || config.endDate <= config.startDate) {
      return;
    }

    const finalProgress = this.progressBetween(config.startDate, config.endDate, now);
    const animatedProgress = this.getAnimatedProgress(finalProgress, timestamp);
    const rect = { x: 170, y: 220, width: 760, height: 760 };
    const palette = {
      background: '#f5f5eb',
      black: '#141414',
      green: '#2caa52',
      yellow: '#f5cd41',
      paper: '#fffdf5',
      frame: '#e8e0c9',
    };

    const highlightStart = config.highlightEnabled ? this.getHighlightStart(config, now) : now;
    const highlightProgress = config.highlightEnabled
      ? Math.min(this.progressBetween(config.startDate, config.endDate, highlightStart), animatedProgress)
      : animatedProgress;

    const basePoints = this.mapPointsToRect(this.hilbertPoints(config.fractalOrder), rect);
    const points = this.densifyPolyline(basePoints);
    const donePoints = this.slicePolyline(points, 0, animatedProgress);
    const yellowPoints = config.highlightEnabled ? this.slicePolyline(points, highlightProgress, animatedProgress) : [];
    const progressPoint = donePoints[donePoints.length - 1] || points[0];
    const endPoint = points[points.length - 1];
    const remainingLabel = this.formatDuration(Math.max(config.endDate.getTime() - now.getTime(), 0));

    this.ui.statProgress.textContent = `${(finalProgress * 100).toFixed(1)}%`;
    this.ui.statRemaining.textContent = config.preset === 'chronometer' && !this.config.chronoStartedAt ? 'not started' : remainingLabel;
    this.ui.statPreset.textContent = this.getPresetLabel(config.preset);
    this.ui.statHighlight.textContent = config.highlightEnabled ? `${config.highlightAmount} ${config.highlightUnit}` : 'Off';

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = palette.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = palette.paper;
    this.ctx.fillRect(rect.x - 34, rect.y - 34, rect.width + 68, rect.height + 68);
    this.ctx.strokeStyle = palette.frame;
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(rect.x - 34, rect.y - 34, rect.width + 68, rect.height + 68);

    this.drawPolyline(points, palette.black, 5);
    this.drawPolyline(donePoints, palette.green, 5);
    if (yellowPoints.length > 1) {
      this.drawPolyline(yellowPoints, palette.yellow, 9);
    }

    this.ctx.beginPath();
    this.ctx.arc(progressPoint.x, progressPoint.y, 7, 0, Math.PI * 2);
    this.ctx.fillStyle = palette.yellow;
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = palette.black;
    this.ctx.stroke();

    this.drawFlag(92, 930, palette);
    this.drawConnector(endPoint, palette);
    this.drawBubble(1045, 930, config.bubbleLabel, palette);
    this.drawHeader(config.title, animatedProgress, remainingLabel, palette);
    this.drawLegend(config.highlightEnabled, config.highlightAmount, config.highlightUnit, palette);
  }

  drawHeader(title, progress, remainingLabel, palette) {
    this.ctx.fillStyle = palette.black;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '700 40px "Trebuchet MS", "Segoe UI", sans-serif';
    this.ctx.fillText(title, 80, 72);

    this.ctx.font = '700 26px "Trebuchet MS", "Segoe UI", sans-serif';
    this.ctx.fillStyle = palette.green;
    this.ctx.fillText(`${(progress * 100).toFixed(1)}%`, 82, 126);

    this.ctx.fillStyle = palette.black;
    this.ctx.fillText(`Remaining ${remainingLabel}`, 210, 126);
  }

  drawLegend(enabled, amount, unit, palette) {
    const label = enabled ? `Last ${amount} ${unit}` : 'Highlight off';
    const x = 150;
    const y = 1084;

    this.ctx.font = '22px "Trebuchet MS", "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    this.ctx.fillStyle = palette.green;
    this.ctx.fillRect(x, y, 30, 18);
    this.ctx.fillStyle = palette.black;
    this.ctx.fillText('Completed', x + 44, y - 4);

    this.ctx.fillStyle = palette.yellow;
    this.ctx.fillRect(x + 260, y, 30, 18);
    this.ctx.fillStyle = palette.black;
    this.ctx.fillText(label, x + 304, y - 4);

    this.ctx.fillStyle = palette.black;
    this.ctx.fillRect(x + 560, y, 30, 18);
    this.ctx.fillText('Remaining path', x + 604, y - 4);
  }

  getPresetLabel(preset) {
    const labels = {
      'current-hour': 'Current Hour',
      'current-day': 'Current Day',
      'current-month': 'Current Month',
      'current-year': 'Current Year',
      chronometer: 'Chronometer',
      custom: 'Custom',
    };

    return labels[preset] || 'Custom';
  }

  startChronometer() {
    if (this.config.preset !== 'chronometer') {
      return;
    }

    this.readForm();
    this.config.chronoStartedAt = new Date().toISOString();
    this.syncForm();
    this.bumpAnimation();
    this.refreshCode();
  }

  drawFlag(baseX, baseY, palette) {
    const poleTop = baseY - 92;

    this.ctx.lineWidth = 6;
    this.ctx.strokeStyle = palette.black;
    this.ctx.beginPath();
    this.ctx.moveTo(baseX, poleTop);
    this.ctx.lineTo(baseX, baseY);
    this.ctx.stroke();

    this.ctx.fillStyle = palette.paper;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.roundRect(baseX, poleTop, 108, 58, 14);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = palette.black;
    this.ctx.font = '700 20px "Trebuchet MS", "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('START', baseX + 54, poleTop + 29);
  }

  drawConnector(endPoint, palette) {
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = palette.black;
    this.ctx.beginPath();
    this.ctx.moveTo(endPoint.x + 12, endPoint.y + 10);
    this.ctx.lineTo(959, 920);
    this.ctx.stroke();
  }

  drawBubble(centerX, centerY, label, palette) {
    const outerRadius = 84;
    const innerRadius = 67;
    const spikeCount = 18;

    this.ctx.beginPath();
    for (let i = 0; i < spikeCount * 2; i += 1) {
      const angle = (i / (spikeCount * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.closePath();
    this.ctx.fillStyle = palette.paper;
    this.ctx.fill();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = palette.black;
    this.ctx.stroke();

    let fontSize = 21;
    while (fontSize > 15) {
      this.ctx.font = `700 ${fontSize}px "Trebuchet MS", "Segoe UI", sans-serif`;
      if (this.ctx.measureText(label).width <= 112) {
        break;
      }
      fontSize -= 1;
    }

    this.ctx.fillStyle = palette.black;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, centerX, centerY - 10);
    this.ctx.font = '700 15px "Trebuchet MS", "Segoe UI", sans-serif';
    this.ctx.fillText('ARRIVAL', centerX, centerY + 18);
  }

  getAnimatedProgress(target, timestamp) {
    if (this.animationStart === null) {
      this.animationStart = timestamp;
    }

    const ratio = this.clamp((timestamp - this.animationStart) / this.animationDuration, 0, 1);
    const eased = ratio < 0.5 ? 4 * ratio * ratio * ratio : 1 - Math.pow(-2 * ratio + 2, 3) / 2;
    return target * eased;
  }

  getHighlightStart(config, now) {
    const units = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() - units[config.highlightUnit] * config.highlightAmount);
  }

  progressBetween(start, end, current) {
    const total = end.getTime() - start.getTime();
    return total <= 0 ? 0 : this.clamp((current.getTime() - start.getTime()) / total, 0, 1);
  }

  hilbertPoints(order) {
    const points = [];

    const visit = (x0, y0, xi, xj, yi, yj, depth) => {
      if (depth <= 0) {
        points.push({ x: x0 + (xi + yi) / 2, y: y0 + (xj + yj) / 2 });
        return;
      }

      visit(x0, y0, yi / 2, yj / 2, xi / 2, xj / 2, depth - 1);
      visit(x0 + xi / 2, y0 + xj / 2, xi / 2, xj / 2, yi / 2, yj / 2, depth - 1);
      visit(x0 + xi / 2 + yi / 2, y0 + xj / 2 + yj / 2, xi / 2, xj / 2, yi / 2, yj / 2, depth - 1);
      visit(x0 + xi / 2 + yi, y0 + xj / 2 + yj, -yi / 2, -yj / 2, -xi / 2, -xj / 2, depth - 1);
    };

    visit(0, 0, 1, 0, 0, 1, order);
    return points;
  }

  mapPointsToRect(points, rect) {
    return points.map((point) => ({
      x: rect.x + point.y * rect.width,
      y: rect.y + (1 - point.x) * rect.height,
    }));
  }

  densifyPolyline(points, subdivisions = 24) {
    if (points.length < 2) {
      return points;
    }

    const dense = [points[0]];
    for (let i = 1; i < points.length; i += 1) {
      const start = points[i - 1];
      const end = points[i];

      for (let step = 1; step <= subdivisions; step += 1) {
        const ratio = step / subdivisions;
        dense.push({
          x: start.x + (end.x - start.x) * ratio,
          y: start.y + (end.y - start.y) * ratio,
        });
      }
    }

    return dense;
  }

  slicePolyline(points, startRatio, endRatio) {
    if (points.length < 2 || endRatio <= startRatio) {
      return [];
    }

    const { lengths, totalLength } = this.getPathMetrics(points);
    const startLength = this.clamp(startRatio, 0, 1) * totalLength;
    const endLength = this.clamp(endRatio, 0, 1) * totalLength;
    const sliced = [this.pointAtLength(points, lengths, startLength)];

    for (let i = 1; i < points.length - 1; i += 1) {
      if (lengths[i] > startLength && lengths[i] < endLength) {
        sliced.push(points[i]);
      }
    }

    sliced.push(this.pointAtLength(points, lengths, endLength));
    return sliced;
  }

  getPathMetrics(points) {
    const lengths = [0];
    let totalLength = 0;

    for (let i = 1; i < points.length; i += 1) {
      totalLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      lengths.push(totalLength);
    }

    return { lengths, totalLength };
  }

  pointAtLength(points, lengths, targetLength) {
    if (targetLength <= 0) {
      return points[0];
    }

    const totalLength = lengths[lengths.length - 1];
    if (targetLength >= totalLength) {
      return points[points.length - 1];
    }

    for (let i = 1; i < lengths.length; i += 1) {
      if (targetLength <= lengths[i]) {
        const segmentLength = lengths[i] - lengths[i - 1];
        const ratio = segmentLength === 0 ? 0 : (targetLength - lengths[i - 1]) / segmentLength;
        return {
          x: points[i - 1].x + (points[i].x - points[i - 1].x) * ratio,
          y: points[i - 1].y + (points[i].y - points[i - 1].y) * ratio,
        };
      }
    }

    return points[points.length - 1];
  }

  drawPolyline(points, color, width) {
    if (points.length < 2) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }

  formatDuration(ms) {
    if (ms <= 0) {
      return 'done';
    }

    const totalMinutes = Math.ceil(ms / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  toLocalInput(date) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  parseDate(value) {
    return value ? new Date(value) : null;
  }

  flashButton(button, text) {
    const previous = button.textContent;
    button.textContent = text;
    setTimeout(() => {
      button.textContent = previous;
    }, 1200);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HilbertTimeflow());
} else {
  new HilbertTimeflow();
}
