/**
 * Yenepoya Student Portal - Application Logic
 * Handles validation, local storage request management, tracking, and modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // Storage key for student portal requests
  const STORAGE_KEY = 'yenepoya_student_requests_v1';

  // Initialize Supabase Cloud Database Client
  let supabase = null;
  if (typeof window.supabase !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    try {
      supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      console.log('Supabase Cloud Database connected: ', CONFIG.SUPABASE_URL);
    } catch (err) {
      console.warn('Supabase initialization error:', err);
    }
  }

  // Seed sample requests if empty for realistic demo experience
  seedSampleData();

  // DOM Elements
  const form = document.getElementById('studentRequestForm');
  const submitBtn = document.getElementById('submitRequestBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');

  // Input Elements
  const studentNameInput = document.getElementById('studentName');
  const campusIdInput = document.getElementById('campusId');
  const studentBranchInput = document.getElementById('studentBranch');
  const queryTypeInput = document.getElementById('queryType');
  const emailIdInput = document.getElementById('emailId');
  const whichYearInput = document.getElementById('whichYear');
  const phoneNumberInput = document.getElementById('phoneNumber');

  // Modal Triggers
  const navMyRequests = document.getElementById('navMyRequests');
  const navTracking = document.getElementById('navTracking');
  const navFeedback = document.getElementById('navFeedback');
  const navTerms = document.getElementById('navTerms');
  const navAdmin = document.getElementById('navAdmin');
  const supportDeskLink = document.getElementById('supportDeskLink');

  const mobNavMyRequests = document.getElementById('mobNavMyRequests');
  const mobNavTracking = document.getElementById('mobNavTracking');
  const mobNavFeedback = document.getElementById('mobNavFeedback');
  const mobNavTerms = document.getElementById('mobNavTerms');
  const mobNavAdmin = document.getElementById('mobNavAdmin');

  // Modal Dialogs
  const modalMyRequests = document.getElementById('modalMyRequests');
  const modalTracking = document.getElementById('modalTracking');
  const modalFeedback = document.getElementById('modalFeedback');
  const modalTerms = document.getElementById('modalTerms');
  const modalSupport = document.getElementById('modalSupport');
  const modalSuccess = document.getElementById('modalSuccess');
  const modalAdminLogin = document.getElementById('modalAdminLogin');
  const modalAdminDashboard = document.getElementById('modalAdminDashboard');

  // Admin Dashboard Elements
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPasscode = document.getElementById('adminPasscode');
  const adminPasscodeError = document.getElementById('adminPasscodeError');
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminStatusFilter = document.getElementById('adminStatusFilter');
  const adminPartnerFilter = document.getElementById('adminPartnerFilter');
  const adminTableBody = document.getElementById('adminTableBody');

  let isAdminAuthenticated = false;

  // Tracking Elements
  const trackInput = document.getElementById('trackInput');
  const trackSubmitBtn = document.getElementById('trackSubmitBtn');
  const trackingResult = document.getElementById('trackingResult');
  const btnTrackNow = document.getElementById('btnTrackNow');

  // Success Modal Elements
  const successTicketId = document.getElementById('successTicketId');
  const successDetailsBox = document.getElementById('successDetailsBox');

  // Star Rating Elements
  const ratingStars = document.getElementById('ratingStars');
  let selectedRating = 5;

  // --------------------------------------------------------------------------
  // Mobile Nav Toggle
  // --------------------------------------------------------------------------
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  // --------------------------------------------------------------------------
  // Modal Controller Functions
  // --------------------------------------------------------------------------
  function openModal(modal) {
    if (!modal) return;
    closeAllModals();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (mobileNav) mobileNav.classList.remove('open');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }

  // Close buttons with data-close attribute
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      const targetModal = document.getElementById(targetId);
      closeModal(targetModal);
    });
  });

  // Close modal when clicking on dark backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  // ESC key to close active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Attach Navigation Click Handlers
  if (navMyRequests) navMyRequests.addEventListener('click', () => { renderMyRequests(); openModal(modalMyRequests); });
  if (mobNavMyRequests) mobNavMyRequests.addEventListener('click', () => { renderMyRequests(); openModal(modalMyRequests); });

  function handleOpenTracking() {
    openModal(modalTracking);
    if (trackInput && trackInput.value.trim()) {
      searchTicket(trackInput.value.trim());
    } else {
      const list = getStoredRequests();
      if (list.length > 0) {
        const latest = list[0];
        trackInput.value = latest.campusId || latest.ticketId || '';
        searchTicket(trackInput.value);
      }
    }
    setTimeout(() => { if (trackInput) trackInput.focus(); }, 150);
  }

  if (navTracking) navTracking.addEventListener('click', handleOpenTracking);
  if (mobNavTracking) mobNavTracking.addEventListener('click', handleOpenTracking);

  if (navFeedback) navFeedback.addEventListener('click', () => { openModal(modalFeedback); });
  if (mobNavFeedback) mobNavFeedback.addEventListener('click', () => { openModal(modalFeedback); });

  if (navTerms) navTerms.addEventListener('click', () => { openModal(modalTerms); });
  if (mobNavTerms) mobNavTerms.addEventListener('click', () => { openModal(modalTerms); });

  function handleAdminClick() {
    if (isAdminAuthenticated) {
      renderAdminDashboard();
      openModal(modalAdminDashboard);
    } else {
      openModal(modalAdminLogin);
      setTimeout(() => { if (adminPasscode) adminPasscode.focus(); }, 150);
    }
  }

  if (navAdmin) navAdmin.addEventListener('click', handleAdminClick);
  if (mobNavAdmin) mobNavAdmin.addEventListener('click', handleAdminClick);

  if (supportDeskLink) supportDeskLink.addEventListener('click', (e) => { e.preventDefault(); openModal(modalSupport); });

  // --------------------------------------------------------------------------
  // Form Validation & Submission
  // --------------------------------------------------------------------------
  function validateField(input, errorElementId, validatorFn) {
    const formGroup = input.closest('.form-group');
    const isValid = validatorFn(input.value.trim());
    
    if (!isValid) {
      input.classList.add('is-invalid');
      formGroup.classList.add('has-error');
      return false;
    } else {
      input.classList.remove('is-invalid');
      formGroup.classList.remove('has-error');
      return true;
    }
  }

  const customQueryBox = document.getElementById('customQueryBox');
  const customQueryDetail = document.getElementById('customQueryDetail');

  // Real-time input validation listeners
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\s\-()]{7,15}$/;

  studentNameInput.addEventListener('input', () => {
    validateField(studentNameInput, 'studentNameError', v => v.length >= 2);
  });

  // Restrict campusId to 5 numeric digits in real-time
  campusIdInput.addEventListener('input', (e) => {
    campusIdInput.value = campusIdInput.value.replace(/\D/g, '').slice(0, 5);
    validateField(campusIdInput, 'campusIdError', v => /^\d{5}$/.test(v));
  });

  studentBranchInput.addEventListener('change', () => {
    validateField(studentBranchInput, 'studentBranchError', v => v !== '');
  });

  queryTypeInput.addEventListener('change', () => {
    const isOther = queryTypeInput.value.includes('Other');
    if (customQueryBox) {
      customQueryBox.style.display = isOther ? 'block' : 'none';
      if (isOther && customQueryDetail) customQueryDetail.focus();
    }
    validateField(queryTypeInput, 'queryTypeError', v => v !== '');
  });

  emailIdInput.addEventListener('input', () => {
    validateField(emailIdInput, 'emailIdError', v => emailRegex.test(v));
  });

  whichYearInput.addEventListener('change', () => {
    validateField(whichYearInput, 'whichYearError', v => v !== '');
  });

  phoneNumberInput.addEventListener('input', () => {
    phoneNumberInput.value = phoneNumberInput.value.replace(/[^\d+\s\-()]/g, '').slice(0, 15);
    validateField(phoneNumberInput, 'phoneNumberError', v => phoneRegex.test(v));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = validateField(studentNameInput, 'studentNameError', v => v.length >= 2);
    const isCampusIdValid = validateField(campusIdInput, 'campusIdError', v => /^\d{5}$/.test(v));
    const isBranchValid = validateField(studentBranchInput, 'studentBranchError', v => v !== '');
    const isQueryValid = validateField(queryTypeInput, 'queryTypeError', v => v !== '');
    const isEmailValid = validateField(emailIdInput, 'emailIdError', v => emailRegex.test(v));
    const isYearValid = validateField(whichYearInput, 'whichYearError', v => v !== '');
    const isPhoneValid = validateField(phoneNumberInput, 'phoneNumberError', v => phoneRegex.test(v));

    if (!isNameValid || !isCampusIdValid || !isBranchValid || !isQueryValid || !isEmailValid || !isYearValid || !isPhoneValid) {
      // Find first invalid input and focus
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      showToast('Please correct the highlighted fields before submitting.', 'info');
      return;
    }

    // Submit animation
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Generate Ticket
    const randomTicketNum = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `YEN-2026-${randomTicketNum}`;

    let queryText = queryTypeInput.value;
    if (queryText.includes('Other') && customQueryDetail && customQueryDetail.value.trim()) {
      queryText = `Other: ${customQueryDetail.value.trim()}`;
    }

    const selectedPartnerEl = form.querySelector('input[name="industryPartner"]:checked');
    const selectedPartner = selectedPartnerEl ? selectedPartnerEl.value : 'Not Applicable';

    const newRequest = {
      ticketId: ticketId,
      studentName: studentNameInput.value.trim(),
      campusId: campusIdInput.value.trim(),
      branch: `${studentBranchInput.value} (${whichYearInput.value})`,
      partner: selectedPartner,
      query: queryText,
      email: emailIdInput.value.trim(),
      year: whichYearInput.value,
      phone: phoneNumberInput.value.trim(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending'
    };

    // Formspree payload
    const formspreePayload = {
      _subject: `[Yenepoya Portal] New Request: ${newRequest.studentName} (${newRequest.campusId}) - ${newRequest.ticketId}`,
      _replyto: newRequest.email,
      ticket_id: newRequest.ticketId,
      student_name: newRequest.studentName,
      campus_id: newRequest.campusId,
      branch: newRequest.branch,
      partner: newRequest.partner,
      request_type: newRequest.query,
      email: newRequest.email,
      phone: newRequest.phone,
      submission_time: newRequest.date
    };

    // Save directly to Supabase document_requests table
    saveRequest(newRequest);

    // Send to Formspree endpoint via AJAX
    const endpoint = (typeof CONFIG !== 'undefined' && CONFIG.FORMSPREE_ENDPOINT) 
      ? CONFIG.FORMSPREE_ENDPOINT 
      : 'https://formspree.io/f/xzebbwrv';

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formspreePayload)
    })
    .catch(error => {
      console.warn('Formspree notification notice:', error);
    })
    .finally(() => {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;

      // Populate Success Modal
      successTicketId.textContent = ticketId;
      successDetailsBox.innerHTML = `
        <div><strong>Student:</strong> <span>${escapeHtml(newRequest.studentName)} (${escapeHtml(newRequest.campusId)})</span></div>
        <div><strong>Course / Year:</strong> <span>${escapeHtml(newRequest.branch)}</span></div>
        <div><strong>Program Partner:</strong> <span>${escapeHtml(newRequest.partner)}</span></div>
        <div><strong>Document Requested:</strong> <span>${escapeHtml(newRequest.query)}</span></div>
        <div><strong>Status:</strong> <span style="color: #d97706; font-weight: 700;">Pending Review</span></div>
      `;

      // Track now button setup
      btnTrackNow.onclick = () => {
        closeModal(modalSuccess);
        openModal(modalTracking);
        trackInput.value = newRequest.campusId;
        searchTicket(newRequest.campusId);
      };

      // Open Success Modal
      openModal(modalSuccess);

      // Reset Form
      form.reset();
      if (customQueryBox) customQueryBox.style.display = 'none';
      document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    });
  });

  // --------------------------------------------------------------------------
  // Storage Keys & Supabase document_requests Table Helper
  // --------------------------------------------------------------------------
  const MY_REQUESTS_KEY = 'yenepoya_my_personal_requests';
  const ADMIN_CACHE_KEY = 'yenepoya_admin_cached_requests';

  function getMyPersonalRequests() {
    try {
      const data = localStorage.getItem(MY_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveMyPersonalRequest(request) {
    const list = getMyPersonalRequests();
    if (!list.some(r => r.ticketId === request.ticketId)) {
      list.unshift(request);
      localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(list));
    }
  }

  function getStoredAdminRequests() {
    try {
      const data = localStorage.getItem(ADMIN_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  async function fetchSupabaseDocumentRequests() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('document_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const formatted = data.map(d => ({
            id: d.id,
            ticketId: `DOC-${d.id}`,
            studentName: d.student_name || '',
            campusId: d.student_id || '',
            branch: d.course || '',
            partner: d.industry_partner || 'Not Applicable',
            query: d.document_type || '',
            purpose: d.purpose || '',
            email: d.email || '',
            date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
            status: d.status || 'Pending'
          }));
          localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(formatted));
          return formatted;
        } else if (error) {
          console.warn('Supabase fetch notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase error:', err);
      }
    }
    return getStoredAdminRequests();
  }

  async function saveRequest(request) {
    // 1. Save strictly to this student's personal submissions
    saveMyPersonalRequest(request);

    // 2. Cache in admin list
    const adminList = getStoredAdminRequests();
    if (!adminList.some(r => r.ticketId === request.ticketId)) {
      adminList.unshift(request);
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(adminList));
    }

    // 3. Insert into Supabase document_requests table
    if (supabase) {
      try {
        const { data, error } = await supabase.from('document_requests').insert([{
          student_name: request.studentName,
          student_id: request.campusId,
          email: request.email,
          course: request.branch,
          industry_partner: request.partner,
          document_type: request.query,
          purpose: request.phone ? `Phone: ${request.phone}` : 'Student Document Request',
          status: 'Pending'
        }]).select();

        if (error) {
          console.error('Supabase document_requests insert error:', error);
        } else if (data && data.length > 0) {
          console.log('Saved to document_requests table ID:', data[0].id);
          request.id = data[0].id;
          request.ticketId = `DOC-${data[0].id}`;

          // Update personal requests with server ID
          const myRequests = getMyPersonalRequests();
          const match = myRequests.find(r => r.ticketId === request.ticketId || (r.campusId === request.campusId && r.query === request.query));
          if (match) {
            match.id = data[0].id;
            match.ticketId = `DOC-${data[0].id}`;
            localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(myRequests));
          }
        }
      } catch (err) {
        console.error('Supabase insert exception:', err);
      }
    }
  }

  // Load from document_requests on initialization
  if (supabase) {
    fetchSupabaseDocumentRequests();

    // Supabase Real-time updates on document_requests table
    try {
      supabase.channel('public:document_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'document_requests' }, () => {
          if (modalAdminDashboard && modalAdminDashboard.classList.contains('active')) {
            renderAdminDashboard();
          }
          renderMyRequests();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription notice:', e);
    }
  }

  async function renderMyRequests() {
    const container = document.getElementById('myRequestsList');
    if (!container) return;

    let list = getMyPersonalRequests();

    // If Supabase is available, sync live status for personal submissions
    if (supabase && list.length > 0) {
      try {
        const studentIds = [...new Set(list.map(r => r.campusId).filter(Boolean))];
        if (studentIds.length > 0) {
          const { data } = await supabase.from('document_requests').select('*').in('student_id', studentIds);
          if (data && data.length > 0) {
            list = list.map(item => {
              const remote = data.find(d => String(d.id) === String(item.id) || (d.student_id === item.campusId && d.document_type === item.query));
              if (remote) {
                item.status = remote.status || item.status;
                if (remote.id) item.id = remote.id;
              }
              return item;
            });
            localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(list));
          }
        }
      } catch (e) {}
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <line x1="9" y1="12" x2="15" y2="12"></line>
              <line x1="9" y1="16" x2="13" y2="16"></line>
            </svg>
          </div>
          <p>You haven't submitted any requests yet.</p>
          <small style="color: #94a3b8; margin-top: 4px; display: block;">Fill out the main portal form to submit and track your document requests here.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => {
      const statusLower = (item.status || 'Pending').toLowerCase();
      const trackId = item.campusId || item.ticketId || item.id;
      return `
        <div class="req-item-card" style="cursor: pointer;" onclick="window.trackPersonalRequest('${escapeHtml(trackId)}')">
          <div style="flex: 1;">
            <div class="req-meta-top">
              <span class="req-ticket-tag">${escapeHtml(item.ticketId || ('DOC-' + (item.id || '')))}</span>
              <span class="req-date-tag">• ${escapeHtml(item.date)}</span>
            </div>
            <div class="req-query-title">${escapeHtml(item.query)}</div>
            <div class="req-branch-info">${escapeHtml(item.studentName)} (${escapeHtml(item.campusId)}) | ${escapeHtml(item.branch)}</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            <span class="status-badge status-${statusLower}">${escapeHtml(item.status || 'Pending')}</span>
            <span style="font-size: 0.76rem; font-weight: 700; color: #002b66;">Track Timeline &rarr;</span>
          </div>
        </div>
      `;
    }).join('');
  }

  window.trackPersonalRequest = function(ticketId) {
    closeModal(modalMyRequests);
    openModal(modalTracking);
    if (trackInput) trackInput.value = ticketId;
    searchTicket(ticketId);
  };

  async function searchTicket(query) {
    const q = (query || '').trim();
    if (!q) {
      const list = getStoredRequests();
      if (list.length > 0) {
        return searchTicket(list[0].campusId || list[0].ticketId);
      }
      trackingResult.innerHTML = `<div style="color: #e11d48; font-size: 0.88rem; padding: 12px 0;">Please enter your 5-digit Student ID or Request Number.</div>`;
      return;
    }

    trackingResult.innerHTML = `
      <div class="tracking-card" style="text-align: center; padding: 28px 20px; color: #64748b;">
        <div style="font-weight: 600; color: #002244; margin-bottom: 4px;">Searching Request Records...</div>
        <small style="color: #94a3b8;">Checking live database status for "${escapeHtml(q)}"</small>
      </div>
    `;

    let list = getStoredRequests();
    let match = list.find(item => 
      item.campusId === q || 
      (item.ticketId && item.ticketId.toUpperCase() === q.toUpperCase()) || 
      String(item.id) === q ||
      (item.studentName && item.studentName.toLowerCase().includes(q.toLowerCase()))
    );

    // If not found in local cache, search Supabase document_requests
    if (!match && supabase) {
      try {
        let queryBuilder = supabase.from('document_requests').select('*');
        if (!isNaN(Number(q))) {
          queryBuilder = queryBuilder.or(`student_id.eq.${q},id.eq.${Number(q)}`);
        } else {
          queryBuilder = queryBuilder.or(`student_id.ilike.%${q}%,student_name.ilike.%${q}%`);
        }
        const { data } = await queryBuilder.limit(1);
        if (data && data.length > 0) {
          const d = data[0];
          match = {
            id: d.id,
            ticketId: `DOC-${d.id}`,
            studentName: d.student_name,
            campusId: d.student_id,
            branch: d.course,
            partner: d.industry_partner || 'Not Applicable',
            query: d.document_type,
            email: d.email,
            date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
            status: d.status || 'Pending'
          };
        }
      } catch (err) {
        console.warn('Supabase query search error:', err);
      }
    }

    if (match) {
      const statusRaw = match.status || 'Pending';
      const statusLower = statusRaw.toLowerCase();

      // Step mapping: 1: Request Submitted, 2: Accepted, 3: Processing, 4: Ready, 5: Hand Over
      let currentStep = 1;
      let handoverTimeText = "Tomorrow at 11:00 AM";
      let handoverSub = "Location: Administrative Office, Counter 3 (Student Section)";

      if (statusLower === 'pending') {
        currentStep = 1;
        handoverTimeText = "Tomorrow at 11:00 AM";
      } else if (statusLower === 'accepted' || statusLower === 'approved') {
        currentStep = 2;
        handoverTimeText = "Tomorrow at 11:00 AM";
      } else if (statusLower === 'processing' || statusLower === 'in processing') {
        currentStep = 3;
        handoverTimeText = "Today by 4:00 PM";
      } else if (statusLower === 'ready' || statusLower === 'ready for pickup') {
        currentStep = 4;
        handoverTimeText = "Ready for Collection Now";
        handoverSub = "Available immediately at Administrative Office, Counter 3";
      } else if (statusLower === 'completed' || statusLower === 'hand over' || statusLower === 'handed over') {
        currentStep = 5;
        handoverTimeText = "Handed Over & Completed";
        handoverSub = "Document successfully issued to student";
      } else if (statusLower === 'rejected') {
        currentStep = 0;
        handoverTimeText = "Request Not Approved";
        handoverSub = "Please visit Administrative Office for clarification";
      }

      // Render comprehensive tracking card with visual timeline
      trackingResult.innerHTML = `
        <div class="tracking-card">
          <!-- Top Header with ID & Live Status Badge -->
          <div class="tracking-card-header">
            <div>
              <span class="tracking-req-label">REQUEST ID</span>
              <div class="tracking-req-id">${escapeHtml(match.ticketId || ('REQ-' + match.id))}</div>
              <div class="tracking-sub-date">Submitted on: ${escapeHtml(match.date)}</div>
            </div>
            <div>
              <span class="status-badge status-${statusLower}">${escapeHtml(statusRaw)}</span>
            </div>
          </div>

          <!-- Document & Student Snapshot -->
          <div class="tracking-doc-info-box">
            <div class="tracking-info-row">
              <span class="info-label">DOCUMENT NAME:</span>
              <span class="info-value doc-name-highlight">${escapeHtml(match.query)}</span>
            </div>
            <div class="tracking-info-row">
              <span class="info-label">STUDENT:</span>
              <span class="info-value">${escapeHtml(match.studentName)} (${escapeHtml(match.campusId)}) | ${escapeHtml(match.branch)}</span>
            </div>
          </div>

          <!-- Expected Handover Box -->
          <div class="tracking-handover-box">
            <div class="handover-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <div class="handover-label">EXPECTED HANDOVER TIME</div>
              <div class="handover-time">${handoverTimeText}</div>
              <small class="handover-location">${handoverSub}</small>
            </div>
          </div>

          <!-- 5-Step Visual Timeline: Request Submitted -> Accepted -> Processing -> Ready -> Hand Over -->
          ${currentStep > 0 ? `
          <div class="visual-timeline-wrapper">
            <div class="timeline-title">REQUEST TIMELINE PROGRESS</div>
            <div class="timeline-stepper">
              
              <!-- 1. Request Submitted -->
              <div class="timeline-step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}">
                <div class="step-marker">
                  ${currentStep > 1 ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '1'}
                </div>
                <div class="step-text">
                  <div class="step-name">Request Submitted</div>
                  <div class="step-sub">Logged</div>
                </div>
              </div>
              <div class="timeline-line ${currentStep >= 2 ? 'active' : ''}"></div>

              <!-- 2. Accepted -->
              <div class="timeline-step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}">
                <div class="step-marker">
                  ${currentStep > 2 ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '2'}
                </div>
                <div class="step-text">
                  <div class="step-name">Accepted</div>
                  <div class="step-sub">Verified</div>
                </div>
              </div>
              <div class="timeline-line ${currentStep >= 3 ? 'active' : ''}"></div>

              <!-- 3. Processing -->
              <div class="timeline-step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}">
                <div class="step-marker">
                  ${currentStep > 3 ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '3'}
                </div>
                <div class="step-text">
                  <div class="step-name">Processing</div>
                  <div class="step-sub">Printing</div>
                </div>
              </div>
              <div class="timeline-line ${currentStep >= 4 ? 'active' : ''}"></div>

              <!-- 4. Ready -->
              <div class="timeline-step ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}">
                <div class="step-marker">
                  ${currentStep > 4 ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '4'}
                </div>
                <div class="step-text">
                  <div class="step-name">Ready</div>
                  <div class="step-sub">Attested</div>
                </div>
              </div>
              <div class="timeline-line ${currentStep >= 5 ? 'active' : ''}"></div>

              <!-- 5. Hand Over -->
              <div class="timeline-step ${currentStep >= 5 ? 'completed' : ''} ${currentStep === 5 ? 'active' : ''}">
                <div class="step-marker">
                  ${currentStep === 5 ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '5'}
                </div>
                <div class="step-text">
                  <div class="step-name">Hand Over</div>
                  <div class="step-sub">Collected</div>
                </div>
              </div>

            </div>
          </div>` : `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-sm); padding: 14px 18px; color: #991b1b; font-size: 0.88rem;">
            <strong>Request Notice:</strong> This request could not be processed. Please check in with the Student Administration Counter.
          </div>
          `}
        </div>
      `;
    } else {
      trackingResult.innerHTML = `
        <div class="tracking-card" style="text-align: center; color: #64748b;">
          <p>No active record matching <strong>"${escapeHtml(query)}"</strong> was found.</p>
          <small>Check your Student ID (5-digits) or Reference ID in your confirmation email.</small>
        </div>
      `;
    }
  }

  if (trackSubmitBtn && trackInput) {
    trackSubmitBtn.addEventListener('click', () => searchTicket(trackInput.value));
    trackInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchTicket(trackInput.value);
    });
  }

  // --------------------------------------------------------------------------
  // Feedback Form Star Rating
  // --------------------------------------------------------------------------
  if (ratingStars) {
    const starBtns = ratingStars.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.getAttribute('data-star'));
        starBtns.forEach(s => {
          const starVal = parseInt(s.getAttribute('data-star'));
          if (starVal <= selectedRating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      });
    });
  }

  const feedbackForm = document.getElementById('feedbackForm');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal(modalFeedback);
      showToast('Thank you! Your feedback has been recorded.', 'success');
      feedbackForm.reset();
    });
  }

  // --------------------------------------------------------------------------
  // Admin Dashboard Management (Supabase document_requests)
  // --------------------------------------------------------------------------
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPasscode = adminPasscode.value.trim();

      // Acceptable administrative passcodes
      if (enteredPasscode === 'admin123' || enteredPasscode === '1234' || enteredPasscode === 'admin') {
        isAdminAuthenticated = true;
        adminPasscode.value = '';
        if (adminPasscodeError) adminPasscodeError.style.display = 'none';
        closeModal(modalAdminLogin);
        renderAdminDashboard();
        openModal(modalAdminDashboard);
        showToast('Admin access authorized.', 'success');
      } else {
        if (adminPasscodeError) adminPasscodeError.style.display = 'block';
        adminPasscode.classList.add('is-invalid');
      }
    });
  }

  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
      isAdminAuthenticated = false;
      closeModal(modalAdminDashboard);
      showToast('Admin logged out successfully.', 'info');
    });
  }

  async function renderAdminDashboard() {
    const list = await fetchSupabaseDocumentRequests();

    // Metric Statistics Calculation
    const totalCount = list.length;
    const pendingCount = list.filter(r => (r.status || '').toLowerCase() === 'pending').length;
    const approvedCount = list.filter(r => (r.status || '').toLowerCase() === 'approved').length;
    const completedCount = list.filter(r => (r.status || '').toLowerCase() === 'completed').length;

    const statTotalEl = document.getElementById('statTotal');
    const statPendingEl = document.getElementById('statPending');
    const statApprovedEl = document.getElementById('statApproved');
    const statCompletedEl = document.getElementById('statCompleted');

    if (statTotalEl) statTotalEl.textContent = totalCount;
    if (statPendingEl) statPendingEl.textContent = pendingCount;
    if (statApprovedEl) statApprovedEl.textContent = approvedCount;
    if (statCompletedEl) statCompletedEl.textContent = completedCount;

    // Filters
    const searchQuery = (adminSearchInput ? adminSearchInput.value.trim().toLowerCase() : '');
    const statusFilter = (adminStatusFilter ? adminStatusFilter.value : 'ALL');
    const partnerFilter = (adminPartnerFilter ? adminPartnerFilter.value : 'ALL');

    const filtered = list.filter(item => {
      // Status Filter
      if (statusFilter !== 'ALL') {
        if ((item.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Partner Filter
      if (partnerFilter !== 'ALL') {
        const itemPartner = item.partner || 'Not Applicable';
        if (itemPartner !== partnerFilter) return false;
      }

      // Search Filter
      if (searchQuery) {
        const fullText = `${item.id || ''} ${item.ticketId || ''} ${item.studentName} ${item.campusId} ${item.branch} ${item.query} ${item.email} ${item.partner || ''}`.toLowerCase();
        if (!fullText.includes(searchQuery)) return false;
      }

      return true;
    });

    if (!adminTableBody) return;

    if (filtered.length === 0) {
      adminTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 36px; color: #94a3b8;">
            No student requests matching the current filters.
          </td>
        </tr>
      `;
      return;
    }

    adminTableBody.innerHTML = filtered.map((req) => {
      const partnerVal = req.partner || 'Not Applicable';
      const statusVal = req.status || 'Pending';
      const statusLower = statusVal.toLowerCase();
      const recordIdentifier = req.id ? req.id : req.ticketId;

      return `
        <tr>
          <td><span class="table-ticket-id">${escapeHtml(req.ticketId || ('DOC-' + req.id))}</span></td>
          <td>
            <div class="table-student-name">${escapeHtml(req.studentName)}</div>
            <span class="table-campus-id">ID: ${escapeHtml(req.campusId)}</span>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(req.branch)}</div>
          </td>
          <td>
            <span class="partner-badge">${escapeHtml(partnerVal)}</span>
          </td>
          <td>
            <div class="table-request-highlight">${escapeHtml(req.query)}</div>
          </td>
          <td>
            <div style="font-size: 0.8rem; font-weight: 500;">${escapeHtml(req.email)}</div>
          </td>
          <td>
            <div style="font-size: 0.78rem; color: #64748b; white-space: nowrap;">${escapeHtml(req.date)}</div>
          </td>
          <td>
            <select class="status-changer ${statusLower}" onchange="window.updateAdminRequestStatus('${recordIdentifier}', this.value)">
              <option value="Pending" ${statusLower === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="Accepted" ${statusLower === 'accepted' || statusLower === 'approved' ? 'selected' : ''}>Accepted</option>
              <option value="Processing" ${statusLower === 'processing' || statusLower === 'in processing' ? 'selected' : ''}>Processing</option>
              <option value="Ready" ${statusLower === 'ready' || statusLower === 'ready for pickup' ? 'selected' : ''}>Ready</option>
              <option value="Completed" ${statusLower === 'completed' || statusLower === 'hand over' || statusLower === 'handed over' ? 'selected' : ''}>Completed</option>
              <option value="Rejected" ${statusLower === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </td>
          <td>
            <button type="button" class="btn-delete-row" title="Delete Request" onclick="window.deleteAdminRequest('${recordIdentifier}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Live status updater accessible from inline onchange (Supabase document_requests table)
  window.updateAdminRequestStatus = async function(recordId, newStatus) {
    const list = getStoredRequests();
    const item = list.find(r => (r.id == recordId || r.ticketId == recordId || r.campusId == recordId));
    if (item) {
      item.status = newStatus;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    // Update in Supabase document_requests
    if (supabase) {
      try {
        let query;
        if (!isNaN(Number(recordId))) {
          query = supabase.from('document_requests').update({ status: newStatus }).eq('id', Number(recordId));
        } else {
          query = supabase.from('document_requests').update({ status: newStatus }).eq('student_id', recordId);
        }
        const { error } = await query;
        if (error) console.error('Supabase status update error:', error);
      } catch (err) {
        console.error('Supabase update exception:', err);
      }
    }

    renderAdminDashboard();
    showToast(`Status updated to ${newStatus}.`, 'success');
  };

  // Delete request from document_requests table
  window.deleteAdminRequest = async function(recordId) {
    if (!confirm(`Are you sure you want to remove this request record?`)) return;

    let list = getStoredRequests();
    list = list.filter(r => (r.id != recordId && r.ticketId != recordId && r.campusId != recordId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    if (supabase) {
      try {
        if (!isNaN(Number(recordId))) {
          await supabase.from('document_requests').delete().eq('id', Number(recordId));
        } else {
          await supabase.from('document_requests').delete().eq('student_id', recordId);
        }
      } catch (err) {
        console.error('Supabase delete exception:', err);
      }
    }

    renderAdminDashboard();
    showToast(`Request removed.`, 'info');
  };

  // Filter and search listeners
  if (adminSearchInput) adminSearchInput.addEventListener('input', renderAdminDashboard);
  if (adminStatusFilter) adminStatusFilter.addEventListener('change', renderAdminDashboard);
  if (adminPartnerFilter) adminPartnerFilter.addEventListener('change', renderAdminDashboard);

  // CSV Export utility
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      const list = getStoredAdminRequests();
      if (list.length === 0) {
        showToast('No requests available to export.', 'info');
        return;
      }

      const headers = ['ID', 'Student Name', 'Student ID', 'Course', 'Industry Partner', 'Document Type', 'Email', 'Date', 'Status'];
      const rows = list.map(r => [
        `"${(r.id || r.ticketId || '').replace ? (r.id || r.ticketId || '').replace(/"/g, '""') : (r.id || '')}"`,
        `"${(r.studentName || '').replace(/"/g, '""')}"`,
        `"${(r.campusId || '').replace(/"/g, '""')}"`,
        `"${(r.branch || '').replace(/"/g, '""')}"`,
        `"${(r.partner || 'Not Applicable').replace(/"/g, '""')}"`,
        `"${(r.query || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.date || '').replace(/"/g, '""')}"`,
        `"${(r.status || 'Pending').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Yenepoya_Document_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Student requests exported to CSV.', 'success');
    });
  }

  // --------------------------------------------------------------------------
  // Helper Toast & Escaping
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(match) {
      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match];
    });
  }
});
