class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    this.createParticles(80);
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles(count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: this.getColor(),
      });
    }
  }

  getColor() {
    const colors = ['#00ff41', '#00d4ff', '#7b2ff7', '#ffffff'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        p.vx -= dx * 0.00005;
        p.vy -= dy * 0.00005;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
    }

    this.drawConnections();
    this.ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(0, 255, 65, ${0.06 * (1 - dist / 140)})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }
}

class SnakeGame {
  constructor(canvasId, scoreId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById(scoreId);
    this.grid = 15;
    this.tileCount = Math.floor(this.canvas.width / this.grid);
    this.winScore = 10;
    this.reset();
    this.running = false;
    this.loop = null;
  }

  reset() {
    const mid = Math.floor(this.tileCount / 2);
    this.snake = [{ x: mid, y: mid }];
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.scoreEl.textContent = '0';
    this.gameOver = false;
    this.won = false;
  }

  setDirection(x, y) {
    if (!this.running) return;
    if (x === 0 && y === 0) return;
    if (this.direction.x !== 0 && x !== 0) return;
    if (this.direction.y !== 0 && y !== 0) return;
    this.nextDirection = { x, y };
  }

  spawnFood() {
    const pos = {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount),
    };
    for (const s of this.snake) {
      if (s.x === pos.x && s.y === pos.y) return this.spawnFood();
    }
    return pos;
  }

  start() {
    if (this.running) return;
    this.reset();
    this.running = true;
    this.setupKeys();
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.loop) {
      clearTimeout(this.loop);
      this.loop = null;
    }
    this.removeKeys();
  }

  setupKeys() {
    this._keyHandler = (e) => {
      if (!this.running) return;
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w') this.setDirection(0, -1);
      else if (k === 'ArrowDown' || k === 's') this.setDirection(0, 1);
      else if (k === 'ArrowLeft' || k === 'a') this.setDirection(-1, 0);
      else if (k === 'ArrowRight' || k === 'd') this.setDirection(1, 0);
    };
    document.addEventListener('keydown', this._keyHandler);

    this._touchButtons = document.querySelectorAll('.dpad-btn[data-dir]');
    this._touchHandler = (e) => {
      const dir = e.currentTarget.getAttribute('data-dir');
      if (dir === 'up') this.setDirection(0, -1);
      else if (dir === 'down') this.setDirection(0, 1);
      else if (dir === 'left') this.setDirection(-1, 0);
      else if (dir === 'right') this.setDirection(1, 0);
      e.preventDefault();
    };
    this._touchButtons.forEach((btn) => {
      btn.addEventListener('touchstart', this._touchHandler, { passive: false });
      btn.addEventListener('mousedown', this._touchHandler);
    });

    this._swipeHandler = (e) => {
      if (!this.running || e.target.closest('.game-controls')) return;
      const touch = e.touches[0];
      if (!this._swipeStart) {
        this._swipeStart = { x: touch.clientX, y: touch.clientY };
        return;
      }
      const dx = touch.clientX - this._swipeStart.x;
      const dy = touch.clientY - this._swipeStart.y;
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.setDirection(dx > 0 ? 1 : -1, 0);
        } else {
          this.setDirection(0, dy > 0 ? 1 : -1);
        }
        this._swipeStart = null;
      }
    };
    this._swipeEndHandler = () => { this._swipeStart = null; };
    this.canvas.addEventListener('touchstart', (e) => {
      this._swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    this.canvas.addEventListener('touchmove', this._swipeHandler);
    this.canvas.addEventListener('touchend', this._swipeEndHandler);
  }

  removeKeys() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    if (this._touchHandler && this._touchButtons) {
      this._touchButtons.forEach((btn) => {
        btn.removeEventListener('touchstart', this._touchHandler);
        btn.removeEventListener('mousedown', this._touchHandler);
      });
      this._touchButtons = null;
      this._touchHandler = null;
    }
    if (this._swipeHandler) {
      this.canvas.removeEventListener('touchmove', this._swipeHandler);
      this.canvas.removeEventListener('touchend', this._swipeEndHandler);
      this._swipeHandler = null;
      this._swipeEndHandler = null;
    }
  }

  tick() {
    if (!this.running) {
      if (this.gameOver && !this.won) {
        this.loop = setTimeout(() => {
          this.reset();
          this.running = true;
          this.tick();
        }, 800);
      }
      return;
    }
    this.update();
    this.draw();
    const speed = Math.max(80, 160 - this.score * 3);
    this.loop = setTimeout(() => this.tick(), speed);
  }

  update() {
    this.direction = { ...this.nextDirection };

    if (this.direction.x === 0 && this.direction.y === 0) return;

    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };

    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver = true;
      this.running = false;
      return;
    }

    for (const s of this.snake) {
      if (s.x === head.x && s.y === head.y) {
        this.gameOver = true;
        this.running = false;
        return;
      }
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.scoreEl.textContent = this.score;
      if (this.score >= this.winScore) {
        this.won = true;
        this.running = false;
        return;
      }
      this.food = this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const gw = this.canvas.width / this.tileCount;
    const gh = this.canvas.height / this.tileCount;

    if (this.gameOver || this.won) {
      this.ctx.fillStyle = this.won ? 'rgba(0, 255, 65, 0.03)' : 'rgba(255, 0, 60, 0.03)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    for (let i = 0; i < this.snake.length; i++) {
      const s = this.snake[i];
      const ratio = 1 - (i / this.snake.length) * 0.4;
      this.ctx.fillStyle = this.won
        ? `rgba(0, 255, 65, ${ratio})`
        : `rgba(0, 212, 255, ${ratio})`;
      this.ctx.shadowColor = this.won
        ? 'rgba(0, 255, 65, 0.3)'
        : 'rgba(0, 212, 255, 0.3)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillRect(s.x * gw + 1, s.y * gh + 1, gw - 2, gh - 2);
    }

    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = this.won ? '#00ff41' : '#00ff41';
    this.ctx.shadowColor = 'rgba(0, 255, 65, 0.5)';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(this.food.x * gw + gw / 2, this.food.y * gh + gh / 2, gw / 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.tileCount; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * gw, 0);
      this.ctx.lineTo(i * gw, this.canvas.height);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * gh);
      this.ctx.lineTo(this.canvas.width, i * gh);
      this.ctx.stroke();
    }

    if (this.won) {
      this.ctx.fillStyle = '#00ff41';
      this.ctx.shadowColor = 'rgba(0, 255, 65, 0.8)';
      this.ctx.shadowBlur = 20;
      this.ctx.font = 'bold 18px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2 - 10);
      this.ctx.shadowBlur = 10;
      this.ctx.font = '11px monospace';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText('Score 10 reached', this.canvas.width / 2, this.canvas.height / 2 + 16);
    } else if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(255, 0, 60, 0.6)';
      this.ctx.shadowBlur = 0;
      this.ctx.font = 'bold 14px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
}

class Simulation {
  constructor() {
    this.DEV_MODE = false;

    this.terminal = document.getElementById('terminal-body');
    this.landing = document.getElementById('landing');
    this.simulation = document.getElementById('simulation');
    this.startBtn = document.getElementById('start-btn');
    this.progressSection = document.getElementById('progress-section');
    this.progressLabel = document.getElementById('progress-label');
    this.progressFill = document.getElementById('progress-fill');
    this.progressPercent = document.getElementById('progress-percent');
    this.warningOverlay = document.getElementById('warning-overlay');
    this.warningContent = document.getElementById('warning-content');
    this.countdown = document.getElementById('countdown');
    this.warningProgressFill = document.getElementById('warning-progress-fill');
    this.glitchBars = document.getElementById('glitch-bars');
    this.warningTitle = document.querySelector('.warning-title');
    this.warningSub = document.getElementById('warning-sub');
    this.warningCounter = document.getElementById('warning-counter');
    this.warningProgressBar = document.getElementById('warning-progress-bar');
    this.warningIcon = document.getElementById('warning-icon');
    this.warningFinal = document.getElementById('warning-final');
    this.warningSound = document.getElementById('warning-sound');
    this.cameraAlert = document.getElementById('camera-alert');
    this.micAlert = document.getElementById('mic-alert');
    this.ransomwareNote = document.getElementById('ransomware-note');
    this.strobeOverlay = document.getElementById('strobe-overlay');
    this.cameraContainer = document.getElementById('camera-container');
    this.cameraFeed = document.getElementById('camera-feed');
    this.gameArea = document.getElementById('game-area');
    this.simulationEl = document.getElementById('simulation');
    this.snakeGame = new SnakeGame('game-canvas', 'snake-score');
    this.devNav = document.getElementById('dev-nav');
    this.cameraStream = null;

    this.stopped = false;
    this.init();

    if (this.DEV_MODE) {
      this.devNav.classList.remove('hidden');
      document.body.style.paddingTop = '40px';
      this.setupDevNav();
    }
  }

  init() {
    this.startBtn.addEventListener('click', () => this.begin());
  }

  setupDevNav() {
    const buttons = {
      'nav-landing': () => this.skipTo('landing'),
      'nav-boot': () => this.skipTo('boot'),
      'nav-info': () => this.skipTo('info'),
      'nav-hacking': () => this.skipTo('hacking'),
      'nav-escalation': () => this.skipTo('escalation'),
    };
    for (const [id, fn] of Object.entries(buttons)) {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', fn);
    }
  }

  resetState() {
    this.stopped = true;
    document.body.classList.remove('shake', 'final-active');
    this.warningTitle.classList.remove('active');
    this.glitchBars.classList.remove('active');
    this.glitchBars.classList.add('hidden');
    this.warningOverlay.classList.add('hidden');
    this.strobeOverlay.classList.remove('active');
    this.strobeOverlay.classList.add('hidden');
    this.cameraAlert.classList.add('hidden');
    this.micAlert.classList.add('hidden');
    this.ransomwareNote.classList.add('hidden');
    if (this.warningSound) {
      this.warningSound.pause();
      this.warningSound.currentTime = 0;
    }
    this.cameraContainer.classList.remove('active');
    this.cameraContainer.classList.add('hidden');
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    this.snakeGame.stop();
    this.gameArea.classList.add('hidden');
    this.simulationEl.classList.remove('game-mode');
    this.progressSection.classList.add('hidden');
    this.landing.classList.add('hidden');
    this.simulation.classList.add('hidden');
    this.startBtn.style.pointerEvents = 'auto';
  }

  async skipTo(name) {
    this.resetState();
    await this.sleep(100);

    const phases = {
      landing: async () => {
        this.landing.classList.remove('hidden');
      },
      boot: async () => {
        this.stopped = false;
        this.landing.classList.add('hidden');
        this.simulation.classList.remove('hidden');
        this.clearTerminal();
        await this.bootPhase();
      },
      info: async () => {
        this.stopped = false;
        this.landing.classList.add('hidden');
        this.simulation.classList.remove('hidden');
        this.clearTerminal();
        await this.bootPhase();
        if (this.stopped) return;
        await this.infoPhase();
      },
      hacking: async () => {
        this.stopped = false;
        this.landing.classList.add('hidden');
        this.simulation.classList.remove('hidden');
        this.clearTerminal();
        await this.bootPhase();
        if (this.stopped) return;
        await this.infoPhase();
        if (this.stopped) return;
        await this.hackingPhase();
      },
      escalation: async () => {
        this.stopped = false;
        this.landing.classList.add('hidden');
        this.simulation.classList.remove('hidden');
        this.clearTerminal();
        await this.bootPhase();
        if (this.stopped) return;
        await this.infoPhase();
        if (this.stopped) return;
        await this.hackingPhase();
        if (this.stopped) return;
        this.simulation.classList.add('hidden');
        await this.escalationPhase();
      },
    };

    const fn = phases[name];
    if (fn) await fn();
  }

  async begin() {
    this.startBtn.style.pointerEvents = 'none';
    this.stopped = false;

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.cameraFeed.srcObject = this.cameraStream;
    } catch {}

    await this.sleep(200);
    this.landing.classList.add('hidden');
    await this.sleep(800);
    this.simulation.classList.remove('hidden');
    await this.bootPhase();
    if (this.stopped) return;
    await this.infoPhase();
    if (this.stopped) return;
    await this.hackingPhase();
    if (this.stopped) return;
    await this.escalationPhase();
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ========== TERMINAL HELPERS ==========

  rand(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  fakeIP() {
    return `${this.rand(10, 223)}.${this.rand(0, 255)}.${this.rand(0, 255)}.${this.rand(1, 254)}`;
  }

  fakePort() {
    return this.rand(1024, 65535);
  }

  fakeHex(len) {
    let s = '';
    for (let i = 0; i < len; i++) s += '0123456789ABCDEF'[this.rand(0, 15)];
    return s;
  }

  async typeLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    this.terminal.appendChild(line);
    for (const char of text) {
      if (this.stopped) return;
      line.textContent += char;
      this.terminal.scrollTop = this.terminal.scrollHeight;
      await this.sleep(3 + Math.random() * 6);
    }
    this.terminal.scrollTop = this.terminal.scrollHeight;
    return line;
  }

  async typeFastLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    this.terminal.appendChild(line);
    this.terminal.scrollTop = this.terminal.scrollHeight;
    await this.sleep(200);
    return line;
  }

  async terminalBlank() {
    await this.sleep(400);
    const blank = document.createElement('div');
    blank.className = 'terminal-line dim';
    blank.textContent = '\u00A0';
    this.terminal.appendChild(blank);
    return blank;
  }

  clearTerminal() {
    this.terminal.innerHTML = '';
    const prompt = document.createElement('div');
    prompt.className = 'terminal-prompt';
    prompt.innerHTML = '$ <span class="cursor blink">_</span>';
    this.terminal.appendChild(prompt);
  }

  // ========== PROGRESS HELPERS ==========

  async showProgress(label, duration = 3000) {
    this.progressSection.classList.remove('hidden');
    this.progressLabel.textContent = label;
    this.progressFill.style.width = '0%';
    this.progressPercent.textContent = '0%';

    const startTime = performance.now();
    return new Promise((resolve) => {
      const animate = (now) => {
        if (this.stopped) return resolve();
        const elapsed = now - startTime;
        const pct = Math.min((elapsed / duration) * 100, 100);
        this.progressFill.style.width = `${pct}%`;
        this.progressPercent.textContent = `${Math.round(pct)}%`;
        if (pct < 100) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  hideProgress() {
    this.progressSection.classList.add('hidden');
  }

  // ========== BROWSER INFO ==========

  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const version = ua.match(/(Chrome|Firefox|Safari|Edge)\/([\d.]+)/);
    const browserVersion = version ? version[2] : '';

    return {
      browser: browser + (browserVersion ? ' ' + browserVersion : ''),
      os,
      resolution: `${screen.width}x${screen.height}`,
      language: navigator.language || navigator.userLanguage || 'en-US',
      time: new Date().toLocaleString(),
      online: navigator.onLine ? 'Online' : 'Offline',
      cores: navigator.hardwareConcurrency || 'N/A',
    };
  }

  // ========== PHASES ==========

  async bootPhase() {
    await this.sleep(200);
    await this.typeLine('Initializing secure connection...', 'dim');
    await this.sleep(300);
    await this.typeLine('  [ OK ] TLS handshake complete', 'dim');
    await this.typeLine('Establishing encrypted tunnel...', 'dim');
    await this.sleep(250);
    await this.typeLine('  [ OK ] AES-256 tunnel active', 'dim');
    await this.typeLine('Scanning open ports...', 'dim');
    await this.sleep(200);
    await this.typeLine(`  [ OK ] Port ${this.fakePort()} open`, 'dim');
    await this.typeLine(`  [ OK ] Port ${this.fakePort()} open`, 'dim');
    await this.typeLine(`  [ OK ] Port ${this.fakePort()} open`, 'dim');
    await this.sleep(200);
    await this.typeLine('Bypassing network firewall...', 'dim');
    await this.sleep(300);
    await this.typeLine('  [ OK] Firewall rules bypassed', 'dim');
    await this.typeLine('Spoofing MAC address...', 'dim');
    await this.sleep(200);
    await this.typeLine(`  [ OK ] MAC: ${this.fakeHex(2)}:${this.fakeHex(2)}:${this.fakeHex(2)}:${this.fakeHex(2)}:${this.fakeHex(2)}:${this.fakeHex(2)}`, 'dim');
    await this.typeLine('Authenticating session key...', 'dim');
    await this.sleep(250);
    await this.typeLine(`  [ OK ] Session: ${this.fakeHex(32)}`, 'dim');
    await this.typeLine('', 'dim');
    await this.typeLine('[ OK ] Connection established.', 'green');
    await this.sleep(200);
    await this.typeLine('', 'dim');
    await this.typeLine('ACCESS GRANTED', 'bold');
    await this.sleep(150);
    await this.typeLine(`[>] Routing through ${this.fakeIP()}:${this.fakePort()}...`, 'dim');
    await this.sleep(300);
    await this.typeLine('[ OK ] Target device found.', 'green');
    await this.sleep(150);
    await this.typeLine(`[>] Resolving host ${this.fakeIP()}...`, 'dim');
    await this.sleep(200);
    await this.typeLine('[ OK] Remote shell acquired.', 'green');
    await this.sleep(200);
    await this.typeLine('', 'dim');
    await this.typeLine('$ whoami', 'dim');
    await this.sleep(100);
    await this.typeLine('  root', 'green');
    await this.typeLine('$ id', 'dim');
    await this.sleep(80);
    await this.typeLine('  uid=0(root) gid=0(root) groups=0(root)', 'green');
    await this.typeLine('$ cat /etc/shadow', 'dim');
    await this.sleep(120);
    await this.typeLine(`  ${this.fakeHex(32)}:${this.fakeHex(48)}:18000:0:99999:7:::`, 'green');
    await this.typeLine('$ uname -a', 'dim');
    await this.sleep(80);
    await this.typeLine('  Linux target 5.15.0-generic x86_64 GNU/Linux', 'green');
    await this.typeLine('$', 'dim');
    await this.sleep(300);
  }

  async infoPhase() {
    await this.typeLine('', 'dim');
    await this.typeLine('========================================', 'dim');
    await this.typeLine('  DEVICE INFORMATION ACQUIRED', 'cyan');
    await this.typeLine('========================================', 'dim');
    await this.sleep(200);

    const info = this.getBrowserInfo();

    const items = [
      { label: 'Browser', value: info.browser },
      { label: 'Operating System', value: info.os },
      { label: 'Screen Resolution', value: info.resolution },
      { label: 'Language', value: info.language },
      { label: 'System Time', value: info.time },
      { label: 'Network Status', value: info.online },
      { label: 'CPU Cores', value: info.cores },
    ];

    for (const item of items) {
      if (this.stopped) return;
      await this.typeLine(`  ${item.label.padEnd(20)} : ${item.value}`);
      await this.sleep(this.rand(80, 150));
    }

    await this.typeLine('========================================', 'dim');
    await this.sleep(150);
    await this.typeLine('', 'dim');
    await this.typeLine('[!] Target fully identified.', 'cyan');
    await this.sleep(100);
    await this.typeLine('[!] Device is now accessible.', 'cyan');
    await this.sleep(200);
  }

  async hackingPhase() {
    this.gameArea.classList.remove('hidden');
    this.simulationEl.classList.add('game-mode');
    this.snakeGame.start();

    await this.typeLine('', 'dim');
    await this.typeLine('========================================', 'red');
    await this.typeLine('  INITIALIZING DATA EXTRACTION', 'red');
    await this.typeLine('========================================', 'red');
    await this.sleep(200);

    const steps = [
      { label: 'Scanning file system...', duration: 800, files: true },
      { label: 'Indexing documents...', duration: 600, files: true },
      { label: 'Extracting saved credentials...', duration: 1000 },
      { label: 'Accessing browser history...', duration: 500 },
      { label: 'Downloading contact list...', duration: 700 },
      { label: 'Analyzing network traffic...', duration: 800 },
      { label: 'Collecting system logs...', duration: 500 },
      { label: 'Scanning email cache...', duration: 700 },
      { label: 'Extracting location data...', duration: 600 },
      { label: 'Encrypting target files...', duration: 1200 },
    ];

    const fakeFiles = [
      `/Users/${this.getBrowserInfo().os === 'Windows' ? 'Admin' : 'user'}/Documents/passwords.docx`,
      `/Users/${this.getBrowserInfo().os === 'Windows' ? 'Admin' : 'user'}/Photos/vacation_2024.jpg`,
      `/Users/${this.getBrowserInfo().os === 'Windows' ? 'Admin' : 'user'}/Bank/statement_2025.pdf`,
      `/Users/${this.getBrowserInfo().os === 'Windows' ? 'Admin' : 'user'}/Desktop/private_notes.txt`,
    ];

    for (const step of steps) {
      if (this.stopped) return;
      await this.showProgress(step.label, step.duration);
      if (step.files) {
        const f = fakeFiles[this.rand(0, fakeFiles.length - 1)];
        await this.typeFastLine(`  [>] Reading ${f}`, 'dim');
      }
      await this.sleep(80);
      this.progressSection.classList.add('hidden');
      await this.typeFastLine(`  [ OK ] ${step.label.split('...')[0]} complete.`, 'dim');
      await this.sleep(this.rand(50, 100));
    }

    await this.typeLine('', 'dim');
    await this.typeLine('========================================', 'red');
    await this.typeLine('  ALL DATA EXTRACTED SUCCESSFULLY', 'red');
    await this.typeLine('========================================', 'red');
    await this.sleep(200);
    await this.typeLine('[!] Encrypting extracted data...', 'red');
    await this.sleep(150);
    await this.typeLine('[!] Encryption protocol initiated.', 'red');
    await this.sleep(300);

    this.snakeGame.stop();
    this.gameArea.classList.add('hidden');
    this.simulationEl.classList.remove('game-mode');
  }

  async escalationPhase() {
    this.clearTerminal();
    await this.sleep(150);

    this.warningOverlay.classList.remove('hidden');
    this.glitchBars.classList.remove('hidden');
    this.glitchBars.classList.add('active');

    if (this.warningSound) {
      this.warningSound.currentTime = 0;
      this.warningSound.play().catch(() => {});
    }

    this.cameraAlert.classList.remove('hidden');

    if (this.cameraStream) {
      this.cameraContainer.classList.remove('hidden');
      this.cameraContainer.classList.add('active');
    }

    setTimeout(() => {
      if (!this.stopped) this.micAlert.classList.remove('hidden');
    }, 2000);

    for (let i = 0; i < 3; i++) {
      if (this.stopped) return;
      document.body.classList.add('shake');
      this.warningTitle.classList.add('active');
      await this.sleep(60);
      document.body.classList.remove('shake');
      this.warningTitle.classList.remove('active');
      await this.sleep(100);
    }

    let count = 10;
    this.countdown.textContent = count;
    this.warningProgressFill.style.width = '0%';

    const startTime = performance.now();
    const totalDuration = 5000;

    while (count > 0) {
      if (this.stopped) return;
      this.countdown.textContent = count;

      if (count > 0 && count % 3 === 0) {
        document.body.classList.add('shake');
        await this.sleep(80);
        document.body.classList.remove('shake');
      }

      if (count === 5) {
        this.warningTitle.textContent = 'ENCRYPTION ACTIVE';
        this.warningTitle.setAttribute('data-text', 'ENCRYPTION ACTIVE');
      }

      if (count === 3) {
        this.warningTitle.textContent = 'DATA LOCKED';
        this.warningTitle.setAttribute('data-text', 'DATA LOCKED');
      }

      if (count % 2 === 0) {
        this.warningTitle.classList.add('active');
        await this.sleep(60);
        this.warningTitle.classList.remove('active');
      }

      const elapsed = performance.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      this.warningProgressFill.style.width = `${pct}%`;

      await this.sleep(500);
      count--;
    }

    this.countdown.textContent = '0';
    this.warningProgressFill.style.width = '100%';

    await this.sleep(200);

    this.finalizeHack();
  }

  async typeLineInto(element, text, className = '') {
    element.className = `final-line ${className}`;
    for (const char of text) {
      if (this.stopped) return;
      element.textContent += char;
      await this.sleep(15 + Math.random() * 10);
    }
  }

  finalizeHack() {
    this.warningTitle.textContent = 'YOU\'VE BEEN HACKED';
    this.warningTitle.setAttribute('data-text', 'YOU\'VE BEEN HACKED');
    this.warningTitle.classList.add('active');
    this.warningContent.classList.add('final-state');
    this.warningFinal.classList.remove('hidden');
    this.stopped = false;

    this.simulation.classList.add('hidden');
    this.strobeOverlay.classList.remove('hidden');
    this.strobeOverlay.classList.add('active');
    document.body.classList.add('final-active');

    if (this.cameraStream) {
      this.cameraContainer.classList.remove('hidden');
      this.cameraContainer.classList.add('active');
    }

    setTimeout(() => {
      if (!this.stopped) this.ransomwareNote.classList.remove('hidden');
    }, 3000);

    const lines = [
      '> ALL PERSONAL DATA ENCRYPTED',
      '> SYSTEM ACCESS COMPROMISED',
      '> YOUR DEVICE IS NOW LOCKED',
      '> THIS IS WHAT HAPPENS WHEN YOU CLICK UNKNOWN LINKS',
    ];

    lines.forEach((text, i) => {
      const el = document.getElementById(`final-line-${i + 1}`);
      if (el) {
        setTimeout(() => {
          if (!this.stopped) this.typeLineInto(el, text);
        }, (i + 1) * 600);
      }
    });
  }
}

// ========== START ==========

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('particles');
  new ParticleSystem(canvas);
  new Simulation();
});
