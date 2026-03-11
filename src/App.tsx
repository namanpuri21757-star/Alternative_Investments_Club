import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Chart: any;
  }
}

const cryptoData = [
  { name: 'Bitcoin (BTC)', cap: '$1.32T', addr: '952,000', nvt: 48, dev: 8, conc: 12, rating: 'FAIR', stats: [80, 90, 40, 85, 90] },
  { name: 'Ethereum (ETH)', cap: '$384B', addr: '631,000', nvt: 22, dev: 9, conc: 14, rating: 'UNDERVALUED', stats: [70, 85, 80, 95, 85] },
  { name: 'Solana (SOL)', cap: '$67B', addr: '487,000', nvt: 18, dev: 7, conc: 19, rating: 'UNDERVALUED', stats: [60, 75, 85, 70, 80] },
  { name: 'Avalanche (AVAX)', cap: '$14B', addr: '89,000', nvt: 61, dev: 6, conc: 28, rating: 'OVERVALUED', stats: [30, 40, 30, 60, 65] },
  { name: 'Chainlink (LINK)', cap: '$9B', addr: '41,000', nvt: 74, dev: 7, conc: 22, rating: 'OVERVALUED', stats: [20, 35, 20, 75, 75] },
  { name: 'Cardano (ADA)', cap: '$18B', addr: '72,000', nvt: 82, dev: 5, conc: 31, rating: 'OVERVALUED', stats: [25, 30, 15, 50, 60] },
  { name: 'Polkadot (DOT)', cap: '$11B', addr: '38,000', nvt: 55, dev: 8, conc: 24, rating: 'FAIR', stats: [20, 30, 35, 80, 70] },
  { name: 'Uniswap (UNI)', cap: '$6B', addr: '94,000', nvt: 19, dev: 9, conc: 17, rating: 'UNDERVALUED', stats: [35, 50, 82, 90, 82] }
];

const equityData = [
  { name: 'Stripe', industry: 'Fintech', privateVal: 50, revenue: 15, bear: 90, bull: 150 },
  { name: 'SpaceX', industry: 'Aerospace', privateVal: 180, revenue: 8, bear: 48, bull: 80 },
  { name: 'Databricks', industry: 'Enterprise AI', privateVal: 43, revenue: 2.4, bear: 14.4, bull: 24 },
  { name: 'Klarna', industry: 'BNPL Fintech', privateVal: 6.7, revenue: 2.3, bear: 13.8, bull: 23 },
  { name: 'Chime', industry: 'Neobank', privateVal: 25, revenue: 1.5, bear: 9, bull: 15 },
  { name: 'Epic Games', industry: 'Gaming/Tech', privateVal: 31.5, revenue: 5.5, bear: 33, bull: 55 }
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<any>(null);
  const [cryptoFilter, setCryptoFilter] = useState('ALL');
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoData[1]);
  const [scenario, setScenario] = useState<'bear' | 'bull'>('bear');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Custom Cursor
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = mouseX + 'px';
        cursorDotRef.current.style.top = mouseY + 'px';
      }
    };

    const animateCursor = () => {
      let lerp = 0.15;
      cursorX += (mouseX - cursorX) * lerp;
      cursorY += (mouseY - cursorY) * lerp;
      if (cursorRef.current) {
        cursorRef.current.style.left = cursorX + 'px';
        cursorRef.current.style.top = cursorY + 'px';
      }
      requestAnimationFrame(animateCursor);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animateCursor();

    const handleHover = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = 'translate(-50%, -50%) scale(2.5)';
        cursorRef.current.style.background = 'var(--dim-gold)';
      }
    };
    const handleLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorRef.current.style.background = 'transparent';
      }
    };

    const interactiveElements = document.querySelectorAll('a, button, tr, .filter-btn');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleHover);
      el.addEventListener('mouseleave', handleLeave);
    });

    // Scroll Behavior
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          const countAttr = entry.target.getAttribute('data-count');
          if (countAttr) {
            animateCounter(entry.target as HTMLElement, parseInt(countAttr));
          }
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal, [data-count]').forEach(el => observer.observe(el));

    // Canvas Animation
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let nodes: any[] = [];
        const nodeCount = 80;

        const resize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Node {
          x: number; y: number; vx: number; vy: number; radius: number; pulse: number;
          constructor() {
            this.x = Math.random() * canvas!.width;
            this.y = Math.random() * canvas!.height;
            this.vx = (Math.random() - 0.5) * 0.6;
            this.vy = (Math.random() - 0.5) * 0.6;
            this.radius = 2;
            this.pulse = 0;
          }
          update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
            if (this.pulse > 0) this.pulse -= 0.05;
          }
          draw() {
            ctx!.beginPath();
            ctx!.arc(this.x, this.y, this.radius + (this.pulse * 2), 0, Math.PI * 2);
            ctx!.fillStyle = this.pulse > 0 ? `rgba(201, 168, 76, ${0.6 + this.pulse})` : 'rgba(201, 168, 76, 0.6)';
            ctx!.fill();
          }
        }

        for (let i = 0; i < nodeCount; i++) nodes.push(new Node());

        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < nodes.length; i++) {
            nodes[i].update();
            nodes[i].draw();
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 140) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                const alpha = (1 - dist / 140) * 0.12;
                ctx.strokeStyle = `rgba(201, 168, 76, ${alpha + (nodes[i].pulse * 0.2)})`;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          }
          requestAnimationFrame(animate);
        };
        animate();

        const pulseInterval = setInterval(() => {
          const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
          randomNode.pulse = 1;
        }, 3000);

        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', resize);
          clearInterval(pulseInterval);
          observer.disconnect();
        };
      }
    }
  }, []);

  useEffect(() => {
    // Radar Chart Init
    const initRadar = () => {
      if (window.Chart) {
        const ctx = (document.getElementById('radarChart') as HTMLCanvasElement).getContext('2d');
        if (radarChartRef.current) radarChartRef.current.destroy();
        radarChartRef.current = new window.Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Active Addresses', 'Transaction Vol', 'NVT (Inverted)', 'Dev Activity', 'Decentralization'],
            datasets: [{
              data: selectedCrypto.stats,
              backgroundColor: 'rgba(201, 168, 76, 0.1)',
              borderColor: '#C9A84C',
              pointBackgroundColor: '#C9A84C',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              r: {
                angleLines: { color: '#1F242C' },
                grid: { color: '#1F242C' },
                pointLabels: { color: '#6B7480', font: { family: 'JetBrains Mono', size: 10 } },
                ticks: { display: false },
                suggestedMin: 0,
                suggestedMax: 100
              }
            },
            plugins: { legend: { display: false } },
            animation: { duration: 600 }
          }
        });
      }
    };

    if (window.Chart) {
      initRadar();
    } else {
      const checkChart = setInterval(() => {
        if (window.Chart) {
          initRadar();
          clearInterval(checkChart);
        }
      }, 100);
    }
  }, [selectedCrypto]);

  const animateCounter = (el: HTMLElement, target: number) => {
    const duration = 1800;
    const startTime = performance.now();

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeValue = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(easeValue * target);
      el.innerText = currentCount.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('aic@greenwichhighschool.edu');
    const btn = document.querySelector('.copy-btn') as HTMLElement;
    if (btn) {
      btn.style.color = 'var(--ice)';
      setTimeout(() => btn.style.color = 'var(--text-dim)', 1000);
    }
  };

  const maxGap = 132;

  return (
    <>
      <div id="cursor" ref={cursorRef}></div>
      <div id="cursor-dot" ref={cursorDotRef}></div>

      <div className="ticker-wrap">
        <div className="ticker">
          <span>BTC $67,420 ▲2.3%</span>
          <span>ETH $3,180 ▼0.8%</span>
          <span>SOL $148 ▲5.1%</span>
          <span>STRIPE (PRIVATE) ~$65B</span>
          <span>DATABRICKS (PRIVATE) ~$43B</span>
          <span>NVT INDEX: ELEVATED</span>
          <span>AIC RESEARCH ACTIVE</span>
          <span>BTC $67,420 ▲2.3%</span>
          <span>ETH $3,180 ▼0.8%</span>
          <span>SOL $148 ▲5.1%</span>
          <span>STRIPE (PRIVATE) ~$65B</span>
          <span>DATABRICKS (PRIVATE) ~$43B</span>
          <span>NVT INDEX: ELEVATED</span>
          <span>AIC RESEARCH ACTIVE</span>
        </div>
      </div>

      <nav className={isScrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <div className="nav-left">
            <span className="logo-aic">AIC</span>
            <div className="logo-divider"></div>
            <span className="logo-text">ALTERNATIVE INVESTMENTS CLUB</span>
          </div>
          <div className="nav-right">
            <a href="#about" className="nav-link">About</a>
            <a href="#research" className="nav-link">Research</a>
            <a href="#project" className="nav-link">Project</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
        </div>
      </nav>

      <section id="hero">
        <canvas id="hero-canvas" ref={canvasRef}></canvas>
        <div className="hero-content reveal">
          <div className="hero-label">GREENWICH HIGH SCHOOL · EST. 2024</div>
          <h1 className="hero-title">
            <span className="hero-title-thin">PRICING THE</span>
            <span className="hero-title-bold">UNPRICEABLE</span>
          </h1>
          <p className="hero-desc">We apply institutional frameworks to alternative assets most analysts ignore.</p>
        </div>
        <div className="hero-pills active">
          <div className="pill">
            <span className="pill-label">GUEST SPEAKER</span>
            <span className="pill-name">TODD BOEHLY</span>
            <span className="pill-sub">Eldridge Industries · Chelsea FC</span>
          </div>
          <div className="pill">
            <span className="pill-label">GUEST SPEAKER</span>
            <span className="pill-name">GUSTAVO EIBEN</span>
            <span className="pill-sub">Aqua Capital Partners</span>
          </div>
        </div>
      </section>

      <section id="about" className="section-padding">
        <div className="container">
          <div className="label reveal">01 / ABOUT</div>
          <div className="about-grid">
            <div className="reveal">
              <h2 className="pull-quote">"We think like investors before we ever become one."</h2>
              <p className="about-text">The Alternative Investments Club at Greenwich High School is dedicated to exploring the complex world of private equity, growth equity, and digital assets. We bridge the gap between academic theory and institutional practice by applying rigorous valuation models to non-traditional markets.</p>
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-label">GUEST SPEAKERS</span>
                  <span className="stat-value" data-count="2">0</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">ASSETS UNDER ANALYSIS</span>
                  <span className="stat-value" data-count="45">0</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">RESEARCH WEEKS</span>
                  <span className="stat-value" data-count="4">0</span>
                </div>
              </div>
            </div>
            <div className="team-grid reveal">
              <div className="team-card">
                <span className="role-label">FOUNDER</span>
                <h3 className="team-name">Matias Roitman</h3>
                <div className="team-divider"></div>
              </div>
              <div className="team-card">
                <span className="role-label">FOUNDER</span>
                <h3 className="team-name">Naman Puri</h3>
                <div className="team-divider"></div>
              </div>
              <div className="team-card">
                <span className="role-label">PRESIDENT</span>
                <h3 className="team-name">Noah Coppel</h3>
                <div className="team-divider"></div>
              </div>
              <div className="team-card">
                <span className="role-label">PRESIDENT</span>
                <h3 className="team-name">Maxime Shea</h3>
                <div className="team-divider"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="research" className="section-padding">
        <div className="container">
          <div className="label reveal">02 / RESEARCH FRAMEWORK</div>
          <div className="research-header reveal">
            <h2 className="research-title">Are alternative assets being<br /><span>priced correctly?</span></h2>
          </div>
          <div className="method-grid reveal">
            <div className="method-col">
              <span className="method-label">DIGITAL ASSETS DIVISION</span>
              <p className="method-mission">Identify valuation inefficiencies by comparing token prices against five on-chain network health metrics.</p>
              <ul className="method-list">
                <li>Daily Active Addresses</li>
                <li>Transaction Volume (USD)</li>
                <li>NVT Ratio (Network Value to Transactions)</li>
                <li>Developer Activity (Github Commits)</li>
                <li>Token Concentration (Top Wallet %)</li>
              </ul>
              <span className="method-output">Ranked efficiency scoring across 20–30 tokens</span>
            </div>
            <div className="method-col">
              <span className="method-label">PRIVATE MARKETS DIVISION</span>
              <p className="method-mission">Quantify the valuation gap between late-stage private companies and their implied public market value.</p>
              <ul className="method-list">
                <li>Last-round private valuation</li>
                <li>Revenue estimation (PitchBook / public sources)</li>
                <li>Public comp selection and multiple extraction</li>
                <li>Bull / Bear scenario modeling</li>
                <li>Gap calculation and directional thesis</li>
              </ul>
              <span className="method-output">Valuation gap table across 10–15 private companies</span>
            </div>
          </div>
        </div>
        <div className="data-sources reveal">
          DATA SOURCES: Glassnode · Etherscan · PitchBook · Crunchbase · Bloomberg Comps · SEC Filings
        </div>
      </section>

      <section id="project" className="section-padding">
        <div className="container">
          <div className="label reveal">03 / LIVE RESEARCH OUTPUT</div>
          
          <div className="project-header reveal">
            <h3 className="hero-title-bold" style={{ fontSize: '32px' }}>NETWORK EFFICIENCY SCANNER</h3>
            <div className="filter-bar">
              {['ALL', 'UNDERVALUED', 'OVERVALUED'].map(f => (
                <button 
                  key={f}
                  className={`filter-btn ${cryptoFilter === f ? 'active' : ''}`} 
                  onClick={() => setCryptoFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="crypto-section reveal">
            <div className="table-wrap">
              <table id="crypto-table">
                <thead>
                  <tr>
                    <th>ASSET</th>
                    <th>MARKET CAP</th>
                    <th>ACTIVE ADDR (24H)</th>
                    <th>NVT RATIO</th>
                    <th>DEV SCORE</th>
                    <th>CONCENTRATION</th>
                    <th>RATING</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoData.filter(item => cryptoFilter === 'ALL' || item.rating === cryptoFilter).map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={selectedCrypto.name === item.name ? 'selected' : ''}
                      onClick={() => setSelectedCrypto(item)}
                    >
                      <td>{item.name}</td>
                      <td>{item.cap}</td>
                      <td>{item.addr}</td>
                      <td>{item.nvt}</td>
                      <td>{item.dev}/10</td>
                      <td>{item.conc}%</td>
                      <td><span className={`rating-badge rating-${item.rating.toLowerCase()}`}>{item.rating}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="footnote">* Sample data for research demonstration. Methodology document published Week 1. Live API integration: Glassnode (pending).</div>
            </div>
            <div className="chart-panel">
              <div className="chart-label">METRIC PROFILE</div>
              <canvas id="radarChart"></canvas>
            </div>
          </div>

          <div className="project-header reveal" style={{ marginTop: '120px' }}>
            <h3 className="hero-title-bold" style={{ fontSize: '32px' }}>VALUATION GAP ANALYSIS</h3>
            <div className="filter-bar">
              <button 
                className={`filter-btn ${scenario === 'bear' ? 'active' : ''}`} 
                onClick={() => setScenario('bear')}
              >
                BEAR SCENARIO 6×
              </button>
              <button 
                className={`filter-btn ${scenario === 'bull' ? 'active' : ''}`} 
                onClick={() => setScenario('bull')}
              >
                BULL SCENARIO 10×
              </button>
            </div>
          </div>

          <div className="equity-grid reveal">
            {equityData.map((item, idx) => {
              const implied = scenario === 'bear' ? item.bear : item.bull;
              const gap = implied - item.privateVal;
              const isPositive = gap >= 0;
              const gapColor = isPositive ? 'var(--ice)' : 'var(--danger)';
              const arrow = isPositive ? '▲' : '▼';
              const magnitude = (Math.abs(gap) / maxGap) * 100;

              return (
                <div className="equity-card" key={idx}>
                  <div className="card-header">
                    <span className="industry-tag">{item.industry}</span>
                    <h4 className="company-name">{item.name}</h4>
                  </div>
                  <div className="card-body">
                    <div className="val-row">
                      <span className="val-label">LAST PRIVATE VAL.</span>
                      <span className="val-label">IMPLIED PUBLIC</span>
                    </div>
                    <div className="val-values">
                      <span className="val-main">${item.privateVal}B</span>
                      <span className="val-implied" style={{ color: gapColor }}>${implied}B</span>
                    </div>
                    <div className="gap-row">
                      <div className="gap-text" style={{ color: gapColor }}>
                        VALUATION GAP: {isPositive ? '+' : ''}${gap.toFixed(1)}B {arrow}
                      </div>
                      <div className="magnitude-bar-bg">
                        <div className="magnitude-bar" style={{ width: `${magnitude}%`, background: gapColor }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="footnote reveal">Revenue estimates sourced from public reporting and PitchBook. Multiples derived from public fintech, aerospace, and enterprise software comparable sets. All figures are estimates.</div>
        </div>
      </section>

      <section id="contact" className="section-padding">
        <div className="container">
          <div className="label reveal">04 / CONTACT</div>
          <div className="contact-grid">
            <div className="reveal">
              <h2 className="contact-title">Open to serious<br /><span>conversations.</span></h2>
              <form id="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <input type="text" className="form-input" id="name" placeholder=" " required />
                  <label htmlFor="name" className="form-label">NAME</label>
                </div>
                <div className="form-group">
                  <input type="email" className="form-input" id="email" placeholder=" " required />
                  <label htmlFor="email" className="form-label">EMAIL</label>
                </div>
                <div className="form-group">
                  <textarea className="form-input" id="message" rows={1} placeholder=" " required></textarea>
                  <label htmlFor="message" className="form-label">MESSAGE</label>
                </div>
                <button type="submit" className="submit-btn">SEND MESSAGE</button>
              </form>
            </div>
            <div className="reveal">
              <p className="contact-info-text">We welcome conversations with finance professionals, faculty, and fellow researchers.</p>
              <div className="contact-line">
                <span className="contact-line-label">GENERAL INQUIRIES</span>
                <div className="contact-email-wrap">
                  <a href="mailto:aic@greenwichhighschool.edu" className="contact-email">aic@greenwichhighschool.edu</a>
                  <button className="copy-btn" onClick={copyEmail}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container footer-inner">
          <div className="footer-left">© 2025 AIC — Greenwich High School</div>
          <div className="footer-center">THINKING LIKE INVESTORS BEFORE WE EVER BECOME ONE</div>
          <div className="footer-right">
            <a href="#about" className="footer-link">About</a>
            <a href="#research" className="footer-link">Research</a>
            <a href="#contact" className="footer-link">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
