class HilbertTimeflow {
  constructor() {
    this.storageKey = 'hilbert-timeflow-code';
    this.modal = document.getElementById('hilbert-modal');
    this.canvas = document.getElementById('hilbert-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.animationFrameId = null;
    this.introAnimation = {
      durationMs: 1800,
      startTime: null,
      previousSignature: '',
    };

    this.config = {
      title: 'Hilbert Timeflow',
      bubbleLabel: 'Checkpoint',
      preset: 'current-hour',
      startDate: '',
      endDate: '',
      highlightEnabled: true,
      highlightAmount: 24,
      highlightUnit: 'hours',
      fractalOrder: 6,
    };

    this.ui = {
      card: document.getElementById('hilbert-card'),
      close: document.querySelector('#hilbert-modal .close-modal'),
      title: document.getElementById('hilbert-title'),
      bubbleLabel: document.getElementById('hilbert-bubble-label'),
      startDate: document.getElementById('hilbert-start-date'),
      endDate: document.getElementById('hilbert-end-date'),
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
      previewTitle: document.getElementById('hilbert-preview-title'),
      statusPill: document.getElementById('hilbert-status-pill'),
      statProgress: document.getElementById('hilbert-stat-progress'),
      statRemaining: document.getElementById('hilbert-stat-remaining'),
      statPreset: document.getElementById('hilbert-stat-preset'),
      statHighlight: document.getElementById('hilbert-stat-highlight'),
    };

    this.bootstrap();
  }

  bootstrap() {
    this.applyCustomDefaultDates();
    this.readSavedCode();
    this.syncFormFromConfig();
    this.bindEvents();
    this.refreshCode();
  }

  bindEvents() {
    this.ui.card.addEventListener('click', () => this.open());
    this.ui.close.addEventListener('click', () => this.close());

    window.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.close();
      }
    });

    this.ui.presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.config.preset = button.dataset.preset;
        if (this.config.preset === 'custom') {
          this.applyCustomDefaultDatesIfMissing();
        } else {
          this.applyPresetToConfig(new Date());
        }
        this.syncFormFromConfig();
        this.resetIntroAnimation();
        this.refreshCode();
      });
    });

    this.ui.title.addEventListener('input', () => this.updateFromForm());
    this.ui.bubbleLabel.addEventListener('input', () => this.updateFromForm());
    this.ui.startDate.addEventListener('change', () => this.updateFromForm());
    this.ui.endDate.addEventListener('change', () => this.updateFromForm());
    this.ui.highlightEnabled.addEventListener('change', () => this.updateFromForm());
    this.ui.highlightAmount.addEventListener('input', () => this.updateFromForm());
    this.ui.highlightUnit.addEventListener('change', () => this.updateFromForm());
    this.ui.fractalOrder.addEventListener('input', () => this.updateFromForm());

    this.ui.generateCode.addEventListener('click', () => {
      this.updateFromForm();
      this.refreshCode();
    });

    this.ui.copyCode.addEventListener('click', async () => {
      this.refreshCode();
      await navigator.clipboard.writeText(this.ui.code.value);
      this.flashButton(this.ui.copyCode, 'Copied');
    });

    this.ui.loadCode.addEventListener('click', () => this.loadCodeFromTextarea());
  }

  open() {
    this.modal.classList.remove('hidden');
    this.resetIntroAnimation();
    this.startAnimation();
  }

  close() {
    this.modal.classList.add('hidden');
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  startAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const frame = (timestamp) => {
      this.render(timestamp);
      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  updateFromForm() {
    this.config.title = this.ui.title.value.trim() || 'Hilbert Timeflow';
    this.config.bubbleLabel = this.ui.bubbleLabel.value.trim() || 'Checkpoint';
    this.config.startDate = this.ui.startDate.value;
    this.config.endDate = this.ui.endDate.value;
    this.config.highlightEnabled = this.ui.highlightEnabled.checked;
    this.config.highlightAmount = Math.max(1, Number(this.ui.highlightAmount.value) || 1);
    this.config.highlightUnit = this.ui.highlightUnit.value;
    this.config.fractalOrder = Number(this.ui.fractalOrder.value) || 6;
    this.ui.fractalOrderValue.textContent = String(this.config.fractalOrder);
    this.ui.previewTitle.textContent = this.config.title;
    this.toggleCustomInputs();
    this.resetIntroAnimationIfNeeded();
    this.refreshCode();
  }

  syncFormFromConfig() {
    this.ui.title.value = this.config.title;
    this.ui.bubbleLabel.value = this.config.bubbleLabel;
    this.ui.startDate.value = this.config.startDate;
    this.ui.endDate.value = this.config.endDate;
    this.ui.highlightEnabled.checked = this.config.highlightEnabled;
    this.ui.highlightAmount.value = String(this.config.highlightAmount);
    this.ui.highlightUnit.value = this.config.highlightUnit;
    this.ui.fractalOrder.value = String(this.config.fractalOrder);
    this.ui.fractalOrderValue.textContent = String(this.config.fractalOrder);
    this.ui.previewTitle.textContent = this.config.title;

    this.ui.presetButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.preset === this.config.preset);
    });

    this.toggleCustomInputs();
    this.updateHighlightInputsState();
  }

  toggleCustomInputs() {
    const disabled = this.config.preset !== 'custom';
    this.ui.startDate.disabled = disabled;
    this.ui.endDate.disabled = disabled;
    this.updateHighlightInputsState();
  }

  updateHighlightInputsState() {
    const disabled = !this.config.highlightEnabled;
    this.ui.highlightAmount.disabled = disabled;
    this.ui.highlightUnit.disabled = disabled;
  }

  resetIntroAnimation() {
    this.introAnimation.startTime = null;
    this.introAnimation.previousSignature = '';
  }

  resetIntroAnimationIfNeeded() {
    const nextSignature = JSON.stringify(this.getSerializableConfig());
    if (nextSignature !== this.introAnimation.previousSignature) {
      this.introAnimation.startTime = null;
      this.introAnimation.previousSignature = nextSignature;
    }
  }

  flashButton(button, text) {
    const previous = button.textContent;
    button.textContent = text;
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1400);
  }

  applyCustomDefaultDates() {
    const now = new Date();
    this.config.startDate = this.toDateTimeLocalValue(now);
    this.config.endDate = this.toDateTimeLocalValue(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  }

  applyCustomDefaultDatesIfMissing() {
    if (!this.config.startDate || !this.config.endDate) {
      this.applyCustomDefaultDates();
    }
  }

  applyPresetToConfig(now) {
    const range = this.getPresetRange(this.config.preset, now);
    this.config.startDate = this.toDateTimeLocalValue(range.start);
    this.config.endDate = this.toDateTimeLocalValue(range.end);
  }

  getPresetRange(preset, now) {
    const date = new Date(now);

    if (preset === 'current-day') {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return { start, end };
    }

    if (preset === 'current-month') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
      return { start, end };
    }

    if (preset === 'custom') {
      const start = this.parseDateTimeLocal(this.config.startDate) || date;
      const end = this.parseDateTimeLocal(this.config.endDate) || new Date(date.getTime() + 24 * 60 * 60 * 1000);
      return { start, end };
    }

    const start = new Date(date);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }

  getRenderableConfig(now) {
    if (this.config.preset !== 'custom') {
      this.applyPresetToConfig(now);
      this.ui.startDate.value = this.config.startDate;
      this.ui.endDate.value = this.config.endDate;
    }

    const startDate = this.parseDateTimeLocal(this.config.startDate);
    const endDate = this.parseDateTimeLocal(this.config.endDate);

    return {
      title: this.config.title,
      bubbleLabel: this.config.bubbleLabel,
      preset: this.config.preset,
      startDate,
      endDate,
      highlightEnabled: this.config.highlightEnabled,
      highlightAmount: this.config.highlightAmount,
      highlightUnit: this.config.highlightUnit,
      fractalOrder: this.config.fractalOrder,
    };
  }

  getSerializableConfig() {
    return {
      v: 1,
      title: this.config.title,
      bubbleLabel: this.config.bubbleLabel,
      preset: this.config.preset,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      highlightEnabled: this.config.highlightEnabled,
      highlightAmount: this.config.highlightAmount,
      highlightUnit: this.config.highlightUnit,
      fractalOrder: this.config.fractalOrder,
    };
  }

  refreshCode() {
    const json = JSON.stringify(this.getSerializableConfig());
    const encoded = btoa(unescape(encodeURIComponent(json)));
    this.ui.code.value = encoded;
    localStorage.setItem(this.storageKey, encoded);
  }

  readSavedCode() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      return;
    }

    try {
      this.applySerializedCode(saved, false);
      this.ui.code.value = saved;
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  loadCodeFromTextarea() {
    try {
      this.applySerializedCode(this.ui.code.value.trim(), true);
      this.ui.statusPill.textContent = 'Code loaded';
      this.flashButton(this.ui.loadCode, 'Loaded');
    } catch (error) {
      this.ui.statusPill.textContent = 'Invalid code';
      window.alert(error.message);
    }
  }

  applySerializedCode(encoded, updateCodeField) {
    if (!encoded) {
      throw new Error('Le code est vide.');
    }

    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);

    this.config.title = parsed.title || 'Hilbert Timeflow';
    this.config.bubbleLabel = parsed.bubbleLabel || 'Checkpoint';
    this.config.preset = parsed.preset || 'current-hour';
    this.config.startDate = parsed.startDate || this.config.startDate;
    this.config.endDate = parsed.endDate || this.config.endDate;
    this.config.highlightEnabled = parsed.highlightEnabled !== false;
    this.config.highlightAmount = Math.max(1, Number(parsed.highlightAmount) || 24);
    this.config.highlightUnit = ['minutes', 'hours', 'days'].includes(parsed.highlightUnit)
      ? parsed.highlightUnit
      : 'hours';
    this.config.fractalOrder = Math.min(7, Math.max(1, Number(parsed.fractalOrder) || 6));

    this.syncFormFromConfig();
    this.resetIntroAnimation();
    this.refreshCode();

    if (updateCodeField) {
      this.ui.code.value = encoded;
    }
  }

  render(timestamp) {
    const now = new Date();
    const config = this.getRenderableConfig(now);

    this.ui.previewTitle.textContent = config.title;
    this.ui.statPreset.textContent = this.getPresetLabel(config.preset);
    this.ui.statHighlight.textContent = config.highlightEnabled
      ? `${config.highlightAmount} ${config.highlightUnit}`
      : 'Off';

    if (!(config.startDate instanceof Date) || Number.isNaN(config.startDate.getTime())) {
      this.ui.statusPill.textContent = 'Invalid start';
      return;
    }

    if (!(config.endDate instanceof Date) || Number.isNaN(config.endDate.getTime())) {
      this.ui.statusPill.textContent = 'Invalid end';
      return;
    }

    if (config.endDate <= config.startDate) {
      this.ui.statusPill.textContent = 'End must be after start';
      return;
    }

    this.drawScene(config, now, timestamp);
  }

  drawScene(config, now, timestamp) {
    const finalProgress = this.progressBetween(config.startDate, config.endDate, now);
    const progress = this.getAnimatedProgress(finalProgress, timestamp);
    const highlightStart = this.getHighlightStart(config, now);
    const highlightProgress = config.highlightEnabled
      ? Math.min(this.progressBetween(config.startDate, config.endDate, highlightStart), progress)
      : progress;

    const rect = {
      x: 170,
      y: 220,
      width: 760,
      height: 760,
    };

    const palette = {
      background: '#f5f5eb',
      black: '#141414',
      green: '#2caa52',
      yellow: '#f5cd41',
      paper: '#fffdf5',
      frame: '#e8e0c9',
    };

    const basePoints = this.mapPointsToRect(this.hilbertPoints(config.fractalOrder), rect);
    const points = this.densifyPolyline(basePoints);
    const completedPoints = this.slicePolylineByRatio(points, 0, progress);
    const yellowPoints = config.highlightEnabled
      ? this.slicePolylineByRatio(points, highlightProgress, progress)
      : [];
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const progressPoint = completedPoints[completedPoints.length - 1] || startPoint;
    const remainingMs = Math.max(config.endDate.getTime() - now.getTime(), 0);
    const remainingLabel = this.formatDuration(remainingMs);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = palette.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = palette.paper;
    this.ctx.fillRect(rect.x - 34, rect.y - 34, rect.width + 68, rect.height + 68);
    this.ctx.strokeStyle = palette.frame;
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(rect.x - 34, rect.y - 34, rect.width + 68, rect.height + 68);

    this.drawPolyline(points, palette.black, 5);
    this.drawPolyline(completedPoints, palette.green, 5);
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

    this.drawCornerFlag(92, 930, palette);
    this.drawConnector(endPoint, palette);
    this.drawBubble(1045, 930, config.bubbleLabel, palette);
    this.drawHeader(config.title, progress, remainingLabel, palette);
    this.drawLegend(config.highlightEnabled, config.highlightAmount, config.highlightUnit, palette);

    this.ui.statusPill.textContent = finalProgress >= 1 ? 'Completed' : 'Tracking now';
    this.ui.statProgress.textContent = `${(finalProgress * 100).toFixed(1)}%`;
    this.ui.statRemaining.textContent = remainingLabel;
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

  drawLegend(highlightEnabled, amount, unit, palette) {
    const x = 150;
    const y = 1084;
    const highlightLabel = highlightEnabled ? `Last ${amount} ${unit}` : 'Highlight off';

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
    this.ctx.fillText(highlightLabel, x + 304, y - 4);

    this.ctx.fillStyle = palette.black;
    this.ctx.fillRect(x + 560, y, 30, 18);
    this.ctx.fillText('Remaining path', x + 604, y - 4);
  }

  drawCornerFlag(baseX, baseY, palette) {
    const poleTop = baseY - 92;
    const flagWidth = 108;
    const flagHeight = 58;

    this.ctx.lineWidth = 6;
    this.ctx.strokeStyle = palette.black;
    this.ctx.beginPath();
    this.ctx.moveTo(baseX, poleTop);
    this.ctx.lineTo(baseX, baseY);
    this.ctx.stroke();

    this.ctx.fillStyle = palette.paper;
    this.ctx.strokeStyle = palette.black;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.roundRect(baseX, poleTop, flagWidth, flagHeight, 14);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = palette.black;
    this.ctx.font = '700 20px "Trebuchet MS", "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('START', baseX + flagWidth / 2, poleTop + flagHeight / 2);
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
    const bubble = {
      outerRadius: 84,
      innerRadius: 67,
      spikeCount: 18,
    };

    this.ctx.beginPath();
    for (let index = 0; index < bubble.spikeCount * 2; index += 1) {
      const angle = (index / (bubble.spikeCount * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = index % 2 === 0 ? bubble.outerRadius : bubble.innerRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (index === 0) {
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

  progressBetween(start, end, current) {
    const total = end.getTime() - start.getTime();
    if (total <= 0) {
      return 0;
    }

    return this.clamp((current.getTime() - start.getTime()) / total, 0, 1);
  }

  getHighlightStart(config, now) {
    if (!config.highlightEnabled) {
      return now;
    }

    const unitToMs = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    const delta = unitToMs[config.highlightUnit] * config.highlightAmount;
    return new Date(now.getTime() - delta);
  }

  getAnimatedProgress(targetProgress, timestamp) {
    if (this.introAnimation.startTime === null) {
      this.introAnimation.startTime = timestamp;
    }

    const elapsed = timestamp - this.introAnimation.startTime;
    const ratio = this.clamp(elapsed / this.introAnimation.durationMs, 0, 1);
    const eased = ratio < 0.5
      ? 4 * ratio * ratio * ratio
      : 1 - Math.pow(-2 * ratio + 2, 3) / 2;

    return targetProgress * eased;
  }

  drawPolyline(points, color, width) {
    if (points.length < 2) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      this.ctx.lineTo(points[index].x, points[index].y);
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }

  hilbertPoints(order) {
    const points = [];

    const visit = (x0, y0, xi, xj, yi, yj, depth) => {
      if (depth <= 0) {
        points.push({
          x: x0 + (xi + yi) / 2,
          y: y0 + (xj + yj) / 2,
        });
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
    return points.map((point) => {
      const rotated = {
        x: point.y,
        y: 1 - point.x,
      };

      return {
        x: rect.x + rotated.x * rect.width,
        y: rect.y + rotated.y * rect.height,
      };
    });
  }

  densifyPolyline(points, subdivisions = 24) {
    if (points.length < 2) {
      return points;
    }

    const densePoints = [points[0]];
    for (let index = 1; index < points.length; index += 1) {
      const start = points[index - 1];
      const end = points[index];

      for (let step = 1; step <= subdivisions; step += 1) {
        const ratio = step / subdivisions;
        densePoints.push({
          x: start.x + (end.x - start.x) * ratio,
          y: start.y + (end.y - start.y) * ratio,
        });
      }
    }
    return densePoints;
  }

  getPathMetrics(points) {
    const lengths = [0];
    let totalLength = 0;

    for (let index = 1; index < points.length; index += 1) {
      totalLength += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
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

    for (let index = 1; index < lengths.length; index += 1) {
      if (targetLength <= lengths[index]) {
        const segmentLength = lengths[index] - lengths[index - 1];
        const ratio = segmentLength === 0 ? 0 : (targetLength - lengths[index - 1]) / segmentLength;
        return {
          x: points[index - 1].x + (points[index].x - points[index - 1].x) * ratio,
          y: points[index - 1].y + (points[index].y - points[index - 1].y) * ratio,
        };
      }
    }

    return points[points.length - 1];
  }

  slicePolylineByRatio(points, startRatio, endRatio) {
    if (points.length < 2 || endRatio <= startRatio) {
      return [];
    }

    const { lengths, totalLength } = this.getPathMetrics(points);
    const startLength = this.clamp(startRatio, 0, 1) * totalLength;
    const endLength = this.clamp(endRatio, 0, 1) * totalLength;
    const sliced = [this.pointAtLength(points, lengths, startLength)];

    for (let index = 1; index < points.length - 1; index += 1) {
      if (lengths[index] > startLength && lengths[index] < endLength) {
        sliced.push(points[index]);
      }
    }

    sliced.push(this.pointAtLength(points, lengths, endLength));
    return sliced;
  }

  getPresetLabel(preset) {
    const labels = {
      'current-hour': 'Current Hour',
      'current-day': 'Current Day',
      'current-month': 'Current Month',
      custom: 'Custom',
    };

    return labels[preset] || 'Custom';
  }

  formatDuration(ms) {
    if (ms <= 0) {
      return 'done';
    }

    const totalMinutes = Math.ceil(ms / (60 * 1000));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  toDateTimeLocalValue(date) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  parseDateTimeLocal(value) {
    return value ? new Date(value) : null;
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
