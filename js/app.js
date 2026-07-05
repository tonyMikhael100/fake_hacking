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
    this.devNav = document.getElementById('dev-nav');

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
    document.body.classList.remove('shake');
    this.warningTitle.classList.remove('active');
    this.glitchBars.classList.remove('active');
    this.glitchBars.classList.add('hidden');
    this.warningOverlay.classList.add('hidden');
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

  async typeLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    this.terminal.appendChild(line);
    for (const char of text) {
      if (this.stopped) return;
      line.textContent += char;
      this.terminal.scrollTop = this.terminal.scrollHeight;
      await this.sleep(12 + Math.random() * 16);
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
    await this.sleep(300);
    return line;
  }

  async terminalBlank() {
    await this.sleep(600);
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
    await this.sleep(400);
    await this.typeLine('Initializing secure connection...', 'dim');
    await this.sleep(1400);
    await this.typeLine('Establishing encrypted tunnel...', 'dim');
    await this.sleep(1200);
    await this.typeLine('Bypassing network protocols...', 'dim');
    await this.sleep(1500);
    await this.typeLine('Spoofing MAC address...', 'dim');
    await this.sleep(1000);
    await this.typeLine('Authenticating session key...', 'dim');
    await this.sleep(1200);
    await this.typeLine('', 'dim');
    await this.typeLine('[ OK ] Connection established.', 'green');
    await this.sleep(800);
    await this.typeLine('', 'dim');
    await this.typeLine('ACCESS GRANTED', 'bold');
    await this.sleep(600);
    await this.typeLine('Connecting to remote device...', 'dim');
    await this.sleep(1800);
    await this.typeLine('[ OK ] Target device found.', 'green');
    await this.sleep(400);
  }

  async infoPhase() {
    await this.typeLine('', 'dim');
    await this.typeLine('================================', 'dim');
    await this.typeLine('  DEVICE INFORMATION ACQUIRED', 'cyan');
    await this.typeLine('================================', 'dim');
    await this.sleep(600);

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
      await this.sleep(500 + Math.random() * 300);
    }

    await this.typeLine('================================', 'dim');
    await this.sleep(500);
    await this.typeLine('', 'dim');
    await this.typeLine('[!] Target fully identified.', 'cyan');
    await this.sleep(400);
    await this.typeLine('[!] Device is now accessible.', 'cyan');
    await this.sleep(800);
  }

  async hackingPhase() {
    await this.typeLine('', 'dim');
    await this.typeLine('================================', 'red');
    await this.typeLine('  INITIALIZING DATA EXTRACTION', 'red');
    await this.typeLine('================================', 'red');
    await this.sleep(600);

    const steps = [
      { label: 'Scanning file system...', duration: 3200 },
      { label: 'Indexing documents...', duration: 2800 },
      { label: 'Extracting saved credentials...', duration: 3500 },
      { label: 'Accessing browser history...', duration: 2600 },
      { label: 'Analyzing network traffic...', duration: 3000 },
      { label: 'Collecting system logs...', duration: 2400 },
      { label: 'Encrypting target files...', duration: 3800 },
    ];

    for (const step of steps) {
      if (this.stopped) return;
      await this.showProgress(step.label, step.duration);
      await this.sleep(200);
      this.progressSection.classList.add('hidden');
      await this.typeFastLine(`  [ OK ] ${step.label.split('...')[0]} complete.`, 'dim');
      await this.sleep(300);
    }

    await this.typeLine('', 'dim');
    await this.typeLine('[!] All operations completed successfully.', 'red');
    await this.sleep(500);
    await this.typeLine('[!] Encryption protocol initiated.', 'red');
    await this.sleep(400);
  }

  async escalationPhase() {
    this.clearTerminal();
    await this.sleep(300);

    this.warningOverlay.classList.remove('hidden');
    this.glitchBars.classList.remove('hidden');
    this.glitchBars.classList.add('active');

    for (let i = 0; i < 5; i++) {
      if (this.stopped) return;
      document.body.classList.add('shake');
      this.warningTitle.classList.add('active');
      await this.sleep(100);
      document.body.classList.remove('shake');
      this.warningTitle.classList.remove('active');
      await this.sleep(200);
    }

    let count = 10;
    this.countdown.textContent = count;
    this.warningProgressFill.style.width = '0%';

    const startTime = performance.now();
    const totalDuration = 10000;

    while (count > 0) {
      if (this.stopped) return;
      this.countdown.textContent = count;

      if (count > 0 && count % 3 === 0) {
        document.body.classList.add('shake');
        await this.sleep(150);
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
        await this.sleep(100);
        this.warningTitle.classList.remove('active');
      }

      const elapsed = performance.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      this.warningProgressFill.style.width = `${pct}%`;

      await this.sleep(1000);
      count--;
    }

    this.countdown.textContent = '0';
    this.warningProgressFill.style.width = '100%';

    await this.sleep(500);

    this.finalizeHack();
  }

  async typeLineInto(element, text, className = '') {
    element.className = `final-line ${className}`;
    for (const char of text) {
      if (this.stopped) return;
      element.textContent += char;
      await this.sleep(30 + Math.random() * 20);
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
        }, (i + 1) * 1200);
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
