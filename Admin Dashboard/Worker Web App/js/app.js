// ─── Hunar Worker Desktop Web App Logic ──────────────────────────────────────────
const Store = {
  key: 'hunar_worker_desktop_state_v1',
  get(key, defaultVal) {
    try {
      const data = JSON.parse(localStorage.getItem(this.key) || '{}');
      return data[key] !== undefined ? data[key] : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },
  set(key, val) {
    try {
      const data = JSON.parse(localStorage.getItem(this.key) || '{}');
      data[key] = val;
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (e) {}
  },
};

const STEP_ORDER = [
  'visit-scheduled',
  'on-the-way',
  'visit-in-progress',
  'repair-negotiating',
  'repair-approved',
  'in-progress',
  'completed',
];

const STEP_LABELS = {
  'visit-scheduled': { label: 'Visit Scheduled', sub: 'Rs. 285 agreed' },
  'on-the-way': { label: 'On the Way', sub: 'Customer notified' },
  'visit-in-progress': { label: 'Inspecting', sub: 'At premises' },
  'repair-negotiating': { label: 'Quote Sent', sub: 'Awaiting approval' },
  'repair-approved': { label: 'Repair Approved', sub: 'Rs. 2,985 locked' },
  'in-progress': { label: 'Repair in Progress', sub: 'Work ongoing' },
  'completed': { label: 'Completed', sub: 'Payment ready' },
};

window.App = {
  currentPage: 'dashboard',
  online: true,
  selectedJob: null,
  activeJobStatus: 'repair-approved',
  jobsFilter: 'All',
  jobsSearch: '',
  earningsPeriod: 'month',
  profileTab: 'overview',
  rateStars: 0,
  rateTags: [],
  inspectionPhotos: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=160&h=120&fit=crop',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=160&h=120&fit=crop',
  ],

  init() {
    this.online = Store.get('online', true);
    this.activeJobStatus = Store.get('activeJobStatus', 'repair-approved');
    this.selectedJob = Store.get('selectedJob', MOCK.ACTIVE_JOB);
    this.inspectionPhotos = Store.get('inspectionPhotos', this.inspectionPhotos);

    this.updateOnlineUI();
    this.bindEvents();

    // Check hash route or default to dashboard
    const hash = window.location.hash.replace('#', '');
    const validPages = ['dashboard', 'jobs', 'reviews', 'earnings', 'profile'];
    const initialPage = validPages.includes(hash) ? hash : 'dashboard';
    this.navigate(initialPage);
  },

  navigate(pageId) {
    this.currentPage = pageId;
    window.location.hash = pageId;

    // Update sidebar nav active state
    document.querySelectorAll('.nav-link').forEach((el) => {
      const p = el.getAttribute('data-page');
      el.classList.toggle('active', p === pageId);
    });

    // Update views visibility
    document.querySelectorAll('.view-container').forEach((el) => {
      el.classList.toggle('active', el.id === `view-${pageId}`);
    });

    // Update topbar titles & search bar visibility
    const titles = {
      dashboard: { title: 'Dashboard', sub: 'Thursday, 10 September 2026' },
      jobs: { title: 'My Jobs', sub: '4 total jobs · 1 active · 3 nearby' },
      reviews: { title: 'Reviews & Ratings', sub: '94 verified customer reviews' },
      earnings: { title: 'Earnings & Payouts', sub: 'September 2026 summary' },
      profile: { title: 'Profile & Settings', sub: 'Account, Services & Verification' },
    };

    const info = titles[pageId] || { title: 'Worker App', sub: '' };
    const tEl = document.getElementById('topbar-title');
    const sEl = document.getElementById('topbar-subtitle');
    if (tEl) tEl.textContent = info.title;
    if (sEl) sEl.textContent = info.sub;

    const searchBox = document.getElementById('global-search-box');
    if (searchBox) {
      searchBox.style.display = (pageId === 'dashboard' || pageId === 'jobs') ? 'block' : 'none';
    }

    // Render corresponding view
    if (pageId === 'dashboard') this.renderDashboard();
    else if (pageId === 'jobs') this.renderJobsPage();
    else if (pageId === 'reviews') this.renderReviewsPage();
    else if (pageId === 'earnings') this.renderEarningsPage();
    else if (pageId === 'profile') this.renderProfilePage();
  },

  toggleOnline() {
    this.online = !this.online;
    Store.set('online', this.online);
    this.updateOnlineUI();
    this.showToast(this.online ? 'You are now Online. Ready to receive jobs!' : 'You are now Offline.', this.online ? 'success' : 'info');
  },

  updateOnlineUI() {
    const sw = document.getElementById('online-switch');
    const dot = document.getElementById('online-dot');
    const txt = document.getElementById('online-text');
    if (sw) sw.classList.toggle('active', this.online);
    if (dot) {
      dot.className = `status-dot ${this.online ? '' : 'offline'}`;
    }
    if (txt) {
      txt.textContent = this.online ? 'Online' : 'Offline';
      txt.style.color = this.online ? '#4ADE80' : '#94A3B8';
    }
  },

  // ─── DASHBOARD VIEW ─────────────────────────────────────────────────────────
  renderDashboard() {
    const tbody = document.getElementById('dash-nearby-tbody');
    if (tbody) {
      tbody.innerHTML = MOCK.NEARBY_JOBS.map((j) => `
        <div class="table-row" style="grid-template-columns: 5fr 2fr 2fr 2fr 1fr;" onclick="App.selectJobFromDash('${j.id}')">
          <div class="flex items-center gap-3">
            <div style="width:34px;height:34px;border-radius:6px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
              ${j.categoryIcon}
            </div>
            <div style="min-width:0">
              <p class="font-600 text-sm c-navy truncate">${j.title}</p>
              <p class="text-xs c-gray truncate">${j.area}</p>
            </div>
          </div>
          <span class="text-xs c-gray">${j.category}</span>
          <span class="text-xs c-gray flex items-center gap-1">${ICONS.mapPin} ${j.distance}</span>
          <span class="font-600 text-sm c-navy">Rs. ${j.visitFee}</span>
          <div class="flex items-center justify-end gap-1">
            ${j.urgency === 'urgent' ? '<span class="badge badge-red">Urgent</span>' : ''}
            <span style="color:var(--gray)">${ICONS.chevronRight}</span>
          </div>
        </div>
      `).join('');
    }

    const cbody = document.getElementById('dash-completed-tbody');
    if (cbody) {
      cbody.innerHTML = MOCK.COMPLETED_JOBS.slice(0, 3).map((j) => `
        <div class="flex items-center justify-between p-3" style="border-bottom:1px solid var(--border)">
          <div>
            <p class="text-sm font-600 c-navy">${j.title}</p>
            <p class="text-xs c-gray">${j.customer} · ${j.date}</p>
          </div>
          <div class="flex items-center gap-3">
            <span style="color:var(--warning);font-size:13px">${'★'.repeat(j.rating)}</span>
            <span class="font-600 text-sm c-primary">Rs. ${j.amount.toLocaleString()}</span>
            <span class="badge badge-green">Paid</span>
          </div>
        </div>
      `).join('');
    }

    // Active Job Panel on Dashboard
    this.renderDashActiveJobCard();
  },

  renderDashActiveJobCard() {
    const card = document.getElementById('dash-active-job-card');
    if (!card) return;
    const aj = MOCK.ACTIVE_JOB;
    const nextBtnText = this.getNextActionLabel(this.activeJobStatus);

    card.innerHTML = `
      <div class="p-4" style="border-bottom:1px solid var(--border)">
        <div class="flex items-center justify-between mb-1">
          <span class="badge badge-teal">${aj.category}</span>
          <span class="badge badge-red">URGENT</span>
        </div>
        <h3 class="font-700 text-base c-navy mt-2">${aj.title}</h3>
        <p class="text-xs c-gray mt-1 flex items-center gap-1">${ICONS.mapPin} ${aj.exactAddress}</p>
      </div>
      <div class="p-4" style="background:#F8FAFC;border-bottom:1px solid var(--border)">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs c-gray">Customer</p>
            <p class="text-sm font-600 c-navy">${aj.customerName}</p>
          </div>
          <div class="flex gap-2">
            <a href="tel:${aj.customerPhone}" class="btn btn-outline btn-sm">${ICONS.phone} Call</a>
            <button onclick="App.showToast('Connecting to chat with ${aj.customerName}...', 'info')" class="btn btn-outline btn-sm">${ICONS.chat} Chat</button>
          </div>
        </div>
      </div>
      <div class="p-4">
        <div class="flex justify-between text-xs mb-2">
          <span class="c-gray">Current Status</span>
          <span class="font-600 c-primary">${STEP_LABELS[this.activeJobStatus]?.label || this.activeJobStatus}</span>
        </div>
        <div class="flex justify-between text-xs mb-4">
          <span class="c-gray">Total Locked Escrow</span>
          <span class="font-700 c-navy">Rs. ${aj.totalCost.toLocaleString()}</span>
        </div>
        ${nextBtnText ? `
          <button onclick="App.handleNextActiveStep()" class="btn btn-primary w-full">${nextBtnText} →</button>
        ` : `
          <button onclick="App.navigate('jobs')" class="btn btn-outline w-full">View Details in My Jobs</button>
        `}
      </div>
    `;
  },

  selectJobFromDash(id) {
    const job = MOCK.NEARBY_JOBS.find((j) => j.id === id);
    if (job) {
      this.selectedJob = job;
      Store.set('selectedJob', job);
    }
    this.navigate('jobs');
  },

  // ─── MY JOBS VIEW ───────────────────────────────────────────────────────────
  renderJobsPage() {
    this.renderJobsList();
    this.renderSelectedJobDetails();
  },

  renderJobsList() {
    const container = document.getElementById('jobs-list-container');
    if (!container) return;

    const all = [{ ...MOCK.ACTIVE_JOB, status: this.activeJobStatus }, ...MOCK.NEARBY_JOBS];
    const filtered = all.filter((j) => {
      const matchFilter =
        this.jobsFilter === 'All' ||
        (this.jobsFilter === 'Nearby' && j.id !== MOCK.ACTIVE_JOB.id) ||
        (this.jobsFilter === 'Active' && j.id === MOCK.ACTIVE_JOB.id) ||
        (this.jobsFilter === 'Offer Sent' && j.status === 'offer-sent');
      const matchSearch =
        !this.jobsSearch ||
        j.title.toLowerCase().includes(this.jobsSearch.toLowerCase()) ||
        j.area.toLowerCase().includes(this.jobsSearch.toLowerCase());
      return matchFilter && matchSearch;
    });

    container.innerHTML = filtered.map((j) => {
      const isSelected = this.selectedJob && this.selectedJob.id === j.id;
      const isActiveJob = j.id === MOCK.ACTIVE_JOB.id;
      const statusLabel = isActiveJob ? STEP_LABELS[this.activeJobStatus]?.label : j.status;

      return `
        <div class="job-card-item ${isSelected ? 'selected' : ''}" onclick="App.selectJob('${j.id}')">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h4 class="font-600 text-sm c-navy leading-tight">${j.title}</h4>
            ${j.urgency === 'urgent' ? '<span class="badge badge-red" style="font-size:9px">URGENT</span>' : ''}
          </div>
          <p class="text-xs c-gray mb-2">${j.category} · ${j.area}</p>
          <div class="flex items-center justify-between">
            <span class="badge ${isActiveJob ? 'badge-teal' : 'badge-gray'}" style="font-size:10px">${statusLabel}</span>
            <span class="font-700 text-xs c-navy">Rs. ${j.visitFee}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  selectJob(id) {
    if (id === MOCK.ACTIVE_JOB.id) {
      this.selectedJob = { ...MOCK.ACTIVE_JOB, status: this.activeJobStatus };
    } else {
      this.selectedJob = MOCK.NEARBY_JOBS.find((j) => j.id === id);
    }
    Store.set('selectedJob', this.selectedJob);
    this.renderJobsList();
    this.renderSelectedJobDetails();
  },

  filterJobs(filter) {
    this.jobsFilter = filter;
    document.querySelectorAll('.filter-pill').forEach((el) => {
      el.classList.toggle('active', el.textContent.trim() === filter);
    });
    this.renderJobsList();
  },

  searchJobs(query) {
    this.jobsSearch = query.trim();
    this.renderJobsList();
  },

  renderSelectedJobDetails() {
    const panel = document.getElementById('jobs-detail-panel');
    if (!panel) return;
    const j = this.selectedJob || MOCK.ACTIVE_JOB;
    const isActive = j.id === MOCK.ACTIVE_JOB.id;

    if (isActive) {
      this.renderActiveJobWorkspace(panel, j);
    } else {
      this.renderNearbyJobOfferWorkspace(panel, j);
    }
  },

  renderActiveJobWorkspace(container, j) {
    const currentIdx = STEP_ORDER.indexOf(this.activeJobStatus);
    const nextBtnText = this.getNextActionLabel(this.activeJobStatus);

    container.innerHTML = `
      <div class="panel" style="padding:28px 32px">
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="badge badge-teal">${j.category}</span>
              <span class="badge badge-red">URGENT</span>
              <span class="text-xs c-gray">ID: ${j.id}</span>
            </div>
            <h2 class="font-700 text-xl c-navy">${j.title}</h2>
            <p class="text-xs c-gray mt-1.5 flex items-center gap-1.5">${ICONS.mapPin} ${j.exactAddress}</p>
          </div>
          <div class="flex gap-2.5">
            <a href="tel:${j.customerPhone}" class="btn btn-outline btn-sm">${ICONS.phone} Call</a>
            <button onclick="App.showToast('Connecting to chat with ${j.customerName}...', 'info')" class="btn btn-outline btn-sm">${ICONS.chat} Chat</button>
            <button onclick="App.openDisputeModal()" class="btn btn-danger btn-sm">${ICONS.alertTriangle} Dispute</button>
          </div>
        </div>

        <!-- 7-Step Stepper -->
        <div class="stepper-container" style="padding:24px 28px;margin-bottom:24px">
          <div class="stepper-track">
            ${STEP_ORDER.map((stepKey, idx) => {
              const isDone = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const info = STEP_LABELS[stepKey];
              return `
                <div class="step-node ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}">
                  <div class="step-circle">${isDone ? ICONS.check : idx + 1}</div>
                  <span class="step-name">${info.label}</span>
                  <span class="step-subtext">${info.sub}</span>
                </div>
                ${idx < STEP_ORDER.length - 1 ? `<div class="stepper-line ${idx < currentIdx ? 'done' : ''}"></div>` : ''}
              `;
            }).join('')}
          </div>
        </div>

        <!-- Safety Notice -->
        <div class="p-4 mb-6 rounded-lg" style="background:#EFF6FF;border-left:4px solid #3B82F6;display:flex;align-items:center;gap:14px">
          <span style="color:#2563EB;display:flex;flex-shrink:0">${ICONS.shield}</span>
          <span class="text-xs" style="color:#1E3A8A;line-height:1.5">
            <strong>Safety & Escrow Protected:</strong> Visit fee of Rs. 285 is pre-authorized. Once approved, the full repair amount of Rs. 2,985 remains held in escrow until completion.
          </span>
        </div>

        <!-- Invoice / Cost Breakdown Card -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div style="border:1px solid var(--border);border-radius:12px;padding:22px 24px;background:#fff;box-shadow:var(--shadow-sm)">
            <h4 class="font-700 text-sm c-navy mb-3">Itemized Approved Cost</h4>
            <div class="flex justify-between text-xs py-2" style="border-bottom:1px solid var(--border)">
              <span class="c-gray">Agreed Visit & Diagnosis Fee</span>
              <span class="font-600 c-navy">Rs. ${j.visitFee}</span>
            </div>
            <div class="flex justify-between text-xs py-2" style="border-bottom:1px solid var(--border)">
              <span class="c-gray">Parts (1-inch PVC Elbow + Valve)</span>
              <span class="font-600 c-navy">Rs. 1,200</span>
            </div>
            <div class="flex justify-between text-xs py-2" style="border-bottom:1px solid var(--border)">
              <span class="c-gray">Labor & Pipe Welding</span>
              <span class="font-600 c-navy">Rs. 1,500</span>
            </div>
            <div class="flex justify-between text-sm pt-3 font-700 c-navy">
              <span>Total Customer Payable</span>
              <span>Rs. ${j.totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div style="border:1px solid var(--border);border-radius:12px;padding:22px 24px;background:#fff;box-shadow:var(--shadow-sm)">
            <h4 class="font-700 text-sm c-navy mb-3">Worker Net Earnings</h4>
            <div class="flex justify-between text-xs py-2" style="border-bottom:1px solid var(--border)">
              <span class="c-gray">Gross Repair Total</span>
              <span class="font-600 c-navy">Rs. ${j.totalCost.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-xs py-2" style="border-bottom:1px solid var(--border)">
              <span class="c-gray">Hunar Platform Commission (15%)</span>
              <span class="font-600" style="color:var(--error)">-Rs. 448</span>
            </div>
            <div class="flex justify-between text-sm pt-3 font-700" style="color:var(--success)">
              <span>Net Worker Payout</span>
              <span>Rs. ${j.workerPayout.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Contextual Action Bar -->
        <div class="flex items-center justify-between p-5 rounded-xl" style="background:#F1F5F9;border:1px solid var(--border)">
          <div>
            <p class="text-xs c-gray">Action Required</p>
            <p class="text-sm font-700 c-navy mt-0.5">Current: ${STEP_LABELS[this.activeJobStatus]?.label}</p>
          </div>
          <div class="flex gap-2.5">
            <button onclick="App.openInspectionModal()" class="btn btn-outline btn-sm">${ICONS.camera} Inspection Report</button>
            <button onclick="App.openRepairQuoteModal()" class="btn btn-outline btn-sm">${ICONS.wrench} Repair Quote</button>
            ${nextBtnText ? `<button onclick="App.handleNextActiveStep()" class="btn btn-primary btn-sm" style="padding:8px 18px;font-size:13px">${nextBtnText} →</button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderNearbyJobOfferWorkspace(container, j) {
    const isOfferSent = j.status === 'offer-sent';

    container.innerHTML = `
      <div class="panel" style="padding:28px 32px">
        <div class="flex items-start justify-between mb-5">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="badge badge-teal">${j.category}</span>
              ${j.urgency === 'urgent' ? '<span class="badge badge-red">URGENT</span>' : ''}
              <span class="text-xs c-gray">Posted ${j.postedTime}</span>
            </div>
            <h2 class="font-700 text-xl c-navy">${j.title}</h2>
            <p class="text-xs c-gray mt-1.5 flex items-center gap-1.5">${ICONS.mapPin} ${j.area} · ${j.distance}</p>
          </div>
          <div class="text-right">
            <p class="text-xs c-gray">Customer's Budget</p>
            <p class="font-700 text-lg c-primary mt-0.5">${j.repairEstimate}</p>
          </div>
        </div>

        <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:24px">
          <h4 class="font-700 text-xs uppercase tracking-wide c-gray mb-2">Customer Description</h4>
          <p class="text-sm c-navy leading-relaxed" style="line-height:1.6">${j.description}</p>
        </div>

        ${isOfferSent ? `
          <div style="background:#FEF9C3;border:1.5px solid #FACC15;border-radius:12px;padding:20px 24px;margin-top:12px">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-700 text-sm" style="color:#854D0E;margin-bottom:3px">Offer Sent: Rs. ${j.visitFee} Visit Fee</p>
                <p class="text-xs" style="color:#A16207;line-height:1.5">Awaiting customer response. Customer may accept or counter-offer.</p>
              </div>
              <button onclick="App.simulateCustomerCounter('${j.id}')" class="btn btn-outline btn-sm" style="flex-shrink:0;background:#fff;border-color:#FDE047;font-weight:600;padding:8px 16px">Simulate Counter (Demo)</button>
            </div>
          </div>
        ` : `
          <div style="background:#FAFAFA;border:1.5px solid var(--border);border-radius:12px;padding:24px;margin-top:12px">
            <h4 class="font-700 text-sm c-navy mb-4">Send Your Service Proposal</h4>
            <div class="grid grid-cols-2 gap-5 mb-4">
              <div class="field" style="margin-bottom:0">
                <label>Your Visit / Inspection Fee (Rs.)</label>
                <input type="number" id="offer-fee-input" value="${j.visitFee}" step="50" style="background:#fff" />
              </div>
              <div class="field" style="margin-bottom:0">
                <label>Estimated Arrival / Schedule</label>
                <input type="text" id="offer-time-input" value="Today within 45 mins" style="background:#fff" />
              </div>
            </div>
            <div class="field mb-4">
              <label>Message / Note to Customer</label>
              <textarea id="offer-note-input" rows="3" placeholder="Explain your experience, tools you will bring, or confirm availability..." style="background:#fff"></textarea>
            </div>
            <button onclick="App.sendOffer('${j.id}')" class="btn btn-primary w-full" style="padding:12px 20px;font-size:14px;font-weight:700">Send Proposal Offer →</button>
          </div>
        `}
      </div>
    `;
  },

  getNextActionLabel(status) {
    if (status === 'visit-scheduled') return 'Start Visit — On My Way';
    if (status === 'on-the-way') return "I've Arrived at Site";
    if (status === 'visit-in-progress') return 'Start Inspection Report';
    if (status === 'repair-negotiating') return 'Review & Approve Quote';
    if (status === 'repair-approved') return 'Start Repair';
    if (status === 'in-progress') return 'Mark Repair Complete';
    if (status === 'completed') return 'Confirm Cash Received';
    return null;
  },

  handleNextActiveStep() {
    if (this.activeJobStatus === 'visit-in-progress') {
      this.openInspectionModal();
      return;
    }
    if (this.activeJobStatus === 'repair-negotiating') {
      this.openRepairQuoteModal();
      return;
    }

    const idx = STEP_ORDER.indexOf(this.activeJobStatus);
    if (idx < STEP_ORDER.length - 1) {
      this.activeJobStatus = STEP_ORDER[idx + 1];
      Store.set('activeJobStatus', this.activeJobStatus);
      this.showToast(`Job status updated: ${STEP_LABELS[this.activeJobStatus]?.label}`, 'success');
      this.renderJobsPage();
      this.renderDashboard();
    }
  },

  sendOffer(jobId) {
    const job = MOCK.NEARBY_JOBS.find((j) => j.id === jobId);
    if (job) {
      job.status = 'offer-sent';
      this.showToast('Proposal sent to customer successfully!', 'success');
      this.renderJobsPage();
    }
  },

  simulateCustomerCounter(jobId) {
    const job = MOCK.NEARBY_JOBS.find((j) => j.id === jobId);
    if (job) {
      const modal = document.getElementById('modal-counter-offer');
      if (modal) {
        document.getElementById('counter-customer-name').textContent = job.customerName;
        modal.classList.add('open');
      }
    }
  },

  acceptCustomerCounter() {
    document.getElementById('modal-counter-offer')?.classList.remove('open');
    this.activeJobStatus = 'visit-scheduled';
    Store.set('activeJobStatus', this.activeJobStatus);
    this.showToast('Counter-offer accepted! Visit scheduled.', 'success');
    this.selectedJob = { ...MOCK.ACTIVE_JOB, status: 'visit-scheduled' };
    this.renderJobsPage();
    this.renderDashboard();
  },

  // ─── INSPECTION MODAL ───────────────────────────────────────────────────────
  openInspectionModal() {
    this.renderInspectionPhotos();
    document.getElementById('modal-inspection')?.classList.add('open');
  },

  closeInspectionModal() {
    document.getElementById('modal-inspection')?.classList.remove('open');
  },

  renderInspectionPhotos() {
    const gallery = document.getElementById('inspection-gallery');
    if (!gallery) return;
    gallery.innerHTML = `
      ${this.inspectionPhotos.map((url, i) => `
        <div style="position:relative;width:90px;height:70px;border-radius:6px;overflow:hidden;border:1px solid var(--border)">
          <img src="${url}" style="width:100%;height:100%;object-fit:cover" />
          <button onclick="App.deleteInspectionPhoto(${i})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;cursor:pointer;font-size:10px">×</button>
        </div>
      `).join('')}
      <button onclick="App.addInspectionPhoto()" class="btn btn-outline" style="width:90px;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px">
        ${ICONS.plus} Add Photo
      </button>
    `;
  },

  addInspectionPhoto() {
    const sample = [
      'https://images.unsplash.com/photo-1542013936693-884638332954?w=160&h=120&fit=crop',
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=160&h=120&fit=crop',
    ];
    this.inspectionPhotos.push(sample[this.inspectionPhotos.length % sample.length]);
    Store.set('inspectionPhotos', this.inspectionPhotos);
    this.renderInspectionPhotos();
  },

  deleteInspectionPhoto(idx) {
    this.inspectionPhotos.splice(idx, 1);
    Store.set('inspectionPhotos', this.inspectionPhotos);
    this.renderInspectionPhotos();
  },

  updateInspectionTotal() {
    const parts = parseInt(document.getElementById('insp-parts-input')?.value || '0', 10);
    const labor = parseInt(document.getElementById('insp-labor-input')?.value || '0', 10);
    const visit = 285;
    const total = parts + labor + visit;
    const el = document.getElementById('insp-total-display');
    if (el) el.textContent = `Rs. ${total.toLocaleString()}`;
  },

  saveInspection() {
    this.closeInspectionModal();
    this.activeJobStatus = 'repair-negotiating';
    Store.set('activeJobStatus', this.activeJobStatus);
    this.showToast('Inspection saved and quote submitted for customer approval.', 'success');
    this.renderJobsPage();
    this.renderDashboard();
  },

  // ─── REPAIR QUOTE MODAL ─────────────────────────────────────────────────────
  openRepairQuoteModal() {
    document.getElementById('modal-repair-quote')?.classList.add('open');
  },

  closeRepairQuoteModal() {
    document.getElementById('modal-repair-quote')?.classList.remove('open');
  },

  approveRepairQuote() {
    this.closeRepairQuoteModal();
    this.activeJobStatus = 'repair-approved';
    Store.set('activeJobStatus', this.activeJobStatus);
    this.showToast('Customer approved the repair! You may now begin work.', 'success');
    this.renderJobsPage();
    this.renderDashboard();
  },

  // ─── DISPUTE MODAL ─────────────────────────────────────────────────────────
  openDisputeModal() {
    document.getElementById('modal-dispute')?.classList.add('open');
  },

  closeDisputeModal() {
    document.getElementById('modal-dispute')?.classList.remove('open');
  },

  submitDispute() {
    const reason = document.getElementById('dispute-reason')?.value;
    if (!reason) {
      this.showToast('Please provide a reason for the dispute.', 'error');
      return;
    }
    this.closeDisputeModal();
    this.showToast('Dispute submitted. Hunar support will review within 2 hours.', 'info');
  },

  // ─── REVIEWS VIEW ───────────────────────────────────────────────────────────
  renderReviewsPage() {
    const list = document.getElementById('reviews-list');
    if (!list) return;

    list.innerHTML = MOCK.REVIEWS.map((r, i) => `
      <div class="p-5" style="${i < MOCK.REVIEWS.length - 1 ? 'border-bottom:1px solid var(--border)' : ''}">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light);color:var(--primary);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${r.customerName.split(' ').map(n=>n[0]).join('')}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-600 text-sm c-navy">${r.customerName}</span>
                <span style="color:var(--warning);font-size:13px">${'★'.repeat(r.stars)}</span>
                <span class="badge badge-gray">${r.jobCategory}</span>
              </div>
              <p class="text-xs c-gray mt-0.5 mb-2">${r.date}</p>
              <p class="text-sm c-navy leading-relaxed">${r.text}</p>
              <div class="flex flex-wrap gap-1 mt-2">
                ${r.tags.map((t) => `<span class="badge badge-gray" style="text-transform:none">${t}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  setRatingStars(n) {
    this.rateStars = n;
    document.querySelectorAll('.rate-star-btn').forEach((btn, idx) => {
      btn.style.color = idx < n ? 'var(--warning)' : 'var(--border-dim)';
    });
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
    const lbl = document.getElementById('rate-star-label');
    if (lbl) lbl.textContent = labels[n] || '';
  },

  toggleRateTag(btn, tag) {
    if (this.rateTags.includes(tag)) {
      this.rateTags = this.rateTags.filter((t) => t !== tag);
      btn.classList.remove('active');
    } else if (this.rateTags.length < 3) {
      this.rateTags.push(tag);
      btn.classList.add('active');
    }
  },

  submitCustomerRating() {
    if (this.rateStars === 0) {
      this.showToast('Please select a star rating.', 'error');
      return;
    }
    this.showToast('Thank you! Your rating for Ahmed Raza has been recorded.', 'success');
    this.rateStars = 0;
    this.rateTags = [];
    document.querySelectorAll('.rate-star-btn').forEach((b) => b.style.color = 'var(--border-dim)');
    document.getElementById('rate-star-label').textContent = '';
    document.querySelectorAll('.rate-tag-btn').forEach((b) => b.classList.remove('active'));
    document.getElementById('rate-comment').value = '';
  },

  // ─── EARNINGS VIEW ──────────────────────────────────────────────────────────
  renderEarningsPage() {
    this.renderEarningsChart();
    this.renderTransactionsTable();
  },

  setEarningsPeriod(period) {
    this.earningsPeriod = period;
    document.querySelectorAll('.earnings-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-period') === period);
    });
    this.renderEarningsChart();
  },

  renderEarningsChart() {
    const container = document.getElementById('earnings-chart-container');
    if (!container) return;

    if (this.earningsPeriod === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const heights = [60, 40, 75, 50, 90, 65, 100];
      container.innerHTML = `
        <div style="display:flex;align-items:flex-end;gap:24px;height:180px;margin-bottom:12px;padding:0 20px">
          ${days.map((d, i) => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end">
              <span style="font-size:10px;font-weight:600;color:var(--navy);margin-bottom:6px">${i === 6 ? 'Rs. 2.5k' : ''}</span>
              <div style="width:100%;max-width:42px;height:${heights[i]}%;background:${i === 6 ? 'var(--primary)' : '#CBD5E1'};border-radius:6px 6px 0 0;transition:all 0.2s"></div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:24px;padding:0 20px">
          ${days.map((d) => `<span style="flex:1;text-align:center;font-size:12px;font-weight:600;color:var(--gray)">${d}</span>`).join('')}
        </div>
      `;
    } else if (this.earningsPeriod === 'month') {
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      const heights = [65, 88, 70, 100, 92, 45];
      const vals = ['42k', '58k', '49k', '71k', '63k', '8.5k'];
      container.innerHTML = `
        <div style="display:flex;align-items:flex-end;gap:32px;height:180px;margin-bottom:12px;padding:0 20px">
          ${months.map((m, i) => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end">
              <span style="font-size:11px;font-weight:700;color:${i === 5 ? 'var(--primary)' : 'var(--navy)'};margin-bottom:6px">Rs. ${vals[i]}</span>
              <div style="width:100%;max-width:54px;height:${heights[i]}%;background:${i === 5 ? 'var(--primary)' : '#CBD5E1'};border-radius:6px 6px 0 0;transition:all 0.2s"></div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:32px;padding:0 20px">
          ${months.map((m) => `<span style="flex:1;text-align:center;font-size:12px;font-weight:600;color:var(--gray)">${m}</span>`).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="display:flex;align-items:flex-end;gap:12px;height:180px;margin-bottom:12px;padding:0 20px">
          ${Array.from({ length: 12 }).map((_, i) => `
            <div style="flex:1;display:flex;justify-content:center;height:100%;align-items:flex-end">
              <div style="width:100%;max-width:32px;background:${i >= 8 ? 'var(--primary)' : '#CBD5E1'};height:${[50,60,70,65,80,85,90,75,80,95,40,30][i]}%;border-radius:4px 4px 0 0"></div>
            </div>
          `).join('')}
        </div>
        <p class="text-xs c-gray text-center mt-2">Full Year 2026 Monthly Breakdown</p>
      `;
    }
  },

  renderTransactionsTable() {
    const tbody = document.getElementById('earnings-transactions-tbody');
    if (!tbody) return;

    tbody.innerHTML = MOCK.COMPLETED_JOBS.map((j) => {
      const comm = Math.round(j.amount * 0.15);
      const net = j.amount - comm;
      return `
        <div class="table-row" style="grid-template-columns: 1fr 4fr 2fr 2fr 1fr 2fr 2fr 1fr">
          <span class="text-xs c-gray font-600">${j.id}</span>
          <span class="font-600 text-sm c-navy truncate">${j.title}</span>
          <span class="text-xs c-gray">${j.customer}</span>
          <span class="text-xs c-gray">${j.date}</span>
          <span style="color:var(--warning);font-size:12px">${'★'.repeat(j.rating)}</span>
          <span class="text-xs c-navy">Rs. ${j.amount.toLocaleString()}</span>
          <span class="text-xs font-600 c-primary">Rs. ${net.toLocaleString()}</span>
          <span class="badge badge-green">Paid</span>
        </div>
      `;
    }).join('');
  },

  exportEarningsCSV() {
    this.showToast('Exporting transaction history to CSV...', 'info');
    setTimeout(() => this.showToast('Transaction statement downloaded.', 'success'), 1200);
  },

  // ─── PROFILE VIEW ───────────────────────────────────────────────────────────
  renderProfilePage() {
    this.setProfileTab(this.profileTab);
    this.renderProfileServicesGrid();
  },

  setProfileTab(tab) {
    this.profileTab = tab;
    document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.profile-sub-view').forEach((view) => {
      view.style.display = view.id === `prof-sub-${tab}` ? 'block' : 'none';
    });
  },

  renderProfileServicesGrid() {
    const grid = document.getElementById('profile-services-grid');
    if (!grid) return;

    grid.innerHTML = MOCK.CATEGORIES.map((cat) => {
      const isSelected = cat.id === 'plumbing' || cat.id === 'ac';
      const subSkills = MOCK.SUB_SKILLS[cat.id] || [];

      return `
        <div class="panel p-4" style="border-left: 3px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span style="font-size:20px">${cat.icon}</span>
              <h4 class="font-600 text-sm c-navy">${cat.label}</h4>
            </div>
            <button class="toggle-switch ${isSelected ? 'active' : ''}" onclick="this.classList.toggle('active')">
              <span class="toggle-knob"></span>
            </button>
          </div>
          ${subSkills.length > 0 ? `
            <div class="flex flex-wrap gap-1 mt-3">
              ${subSkills.map((s, idx) => `
                <span class="badge ${idx < 2 ? 'badge-teal' : 'badge-gray'}" style="text-transform:none;cursor:pointer" onclick="this.classList.toggle('badge-teal');this.classList.toggle('badge-gray')">${s}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  selectRadius(val, btn) {
    document.querySelectorAll('.radius-pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('radius-val-label').textContent = `${val} km`;
    this.showToast(`Service coverage updated to ${val} km.`, 'info');
  },

  saveProfileChanges() {
    this.showToast('Profile information and settings updated successfully.', 'success');
  },

  // ─── UTILITIES ─────────────────────────────────────────────────────────────
  showToast(message, type = 'info') {
    const existing = document.getElementById('toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notice';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--primary)';
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--gray);cursor:pointer;font-size:16px;margin-left:8px">×</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  bindEvents() {
    // Global search input
    const search = document.getElementById('global-search-input');
    if (search) {
      search.addEventListener('input', (e) => {
        if (this.currentPage === 'jobs') this.searchJobs(e.target.value);
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
