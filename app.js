/**
 * Yenepoya Student Portal - Application Logic
 * Handles validation, local storage request management, tracking, and modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // Storage key for student portal requests
  const STORAGE_KEY = 'yenepoya_student_requests_v1';

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
  const supportDeskLink = document.getElementById('supportDeskLink');

  const mobNavMyRequests = document.getElementById('mobNavMyRequests');
  const mobNavTracking = document.getElementById('mobNavTracking');
  const mobNavFeedback = document.getElementById('mobNavFeedback');
  const mobNavTerms = document.getElementById('mobNavTerms');

  // Modal Dialogs
  const modalMyRequests = document.getElementById('modalMyRequests');
  const modalTracking = document.getElementById('modalTracking');
  const modalFeedback = document.getElementById('modalFeedback');
  const modalTerms = document.getElementById('modalTerms');
  const modalSupport = document.getElementById('modalSupport');
  const modalSuccess = document.getElementById('modalSuccess');

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

  if (navTracking) navTracking.addEventListener('click', () => { openModal(modalTracking); });
  if (mobNavTracking) mobNavTracking.addEventListener('click', () => { openModal(modalTracking); });

  if (navFeedback) navFeedback.addEventListener('click', () => { openModal(modalFeedback); });
  if (mobNavFeedback) mobNavFeedback.addEventListener('click', () => { openModal(modalFeedback); });

  if (navTerms) navTerms.addEventListener('click', () => { openModal(modalTerms); });
  if (mobNavTerms) mobNavTerms.addEventListener('click', () => { openModal(modalTerms); });

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

    setTimeout(() => {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;

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
        branch: studentBranchInput.value,
        partner: selectedPartner,
        query: queryText,
        email: emailIdInput.value.trim(),
        year: whichYearInput.value,
        phone: phoneNumberInput.value.trim(),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'Received (In Review)',
        statusType: 'received'
      };

      // Save to localStorage
      saveRequest(newRequest);

      // Populate Success Modal
      successTicketId.textContent = ticketId;
      successDetailsBox.innerHTML = `
        <div><strong>Student:</strong> <span>${escapeHtml(newRequest.studentName)} (${escapeHtml(newRequest.campusId)})</span></div>
        <div><strong>Branch / Year:</strong> <span>${escapeHtml(newRequest.branch)} - ${escapeHtml(newRequest.year)}</span></div>
        <div><strong>Program Partner:</strong> <span>${escapeHtml(newRequest.partner)}</span></div>
        <div><strong>Request:</strong> <span>${escapeHtml(newRequest.query)}</span></div>
        <div><strong>Status:</strong> <span style="color: #0284c7; font-weight: 600;">Received (Under Processing)</span></div>
      `;

      // Track now button setup
      btnTrackNow.onclick = () => {
        closeModal(modalSuccess);
        openModal(modalTracking);
        trackInput.value = ticketId;
        searchTicket(ticketId);
      };

      // Open Success Modal
      openModal(modalSuccess);

      // Reset Form
      form.reset();
      document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

    }, 700);
  });

  // --------------------------------------------------------------------------
  // LocalStorage Helper & Tracking Search
  // --------------------------------------------------------------------------
  function getStoredRequests() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  function saveRequest(request) {
    const list = getStoredRequests();
    list.unshift(request);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function renderMyRequests() {
    const container = document.getElementById('myRequestsList');
    if (!container) return;

    const list = getStoredRequests();
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
          <p>No requests found. Submit a request using the main portal form.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="req-item-card">
        <div style="flex: 1;">
          <div class="req-meta-top">
            <span class="req-ticket-tag">${escapeHtml(item.ticketId)}</span>
            <span class="req-date-tag">• ${escapeHtml(item.date)}</span>
          </div>
          <div class="req-query-title">${escapeHtml(item.query)}</div>
          <div class="req-branch-info">${escapeHtml(item.studentName)} | ${escapeHtml(item.branch)} (${escapeHtml(item.year)})</div>
        </div>
        <div>
          <span class="status-badge ${getStatusClass(item.statusType)}">${escapeHtml(item.status)}</span>
        </div>
      </div>
    `).join('');
  }

  function getStatusClass(type) {
    if (type === 'resolved') return 'status-resolved';
    if (type === 'progress') return 'status-progress';
    return 'status-received';
  }

  function searchTicket(query) {
    const q = query.trim().toUpperCase();
    if (!q) {
      trackingResult.innerHTML = `<div style="color: #e11d48; font-size: 0.88rem;">Please enter a valid Ticket ID or Campus Registration Number.</div>`;
      return;
    }

    const list = getStoredRequests();
    const match = list.find(item => item.ticketId.toUpperCase() === q || item.campusId.toUpperCase() === q);

    if (match) {
      trackingResult.innerHTML = `
        <div class="tracking-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <strong style="color: #002244; font-size: 1.05rem;">${escapeHtml(match.ticketId)}</strong>
              <div style="color: #64748b; font-size: 0.8rem; margin-top: 2px;">Submitted on: ${escapeHtml(match.date)}</div>
            </div>
            <span class="status-badge ${getStatusClass(match.statusType)}">${escapeHtml(match.status)}</span>
          </div>
          <div style="margin-bottom: 8px; font-size: 0.9rem;">
            <strong>Request Detail:</strong> ${escapeHtml(match.query)}
          </div>
          <div style="font-size: 0.85rem; color: #475569;">
            <strong>Student:</strong> ${escapeHtml(match.studentName)} (${escapeHtml(match.campusId)}) | ${escapeHtml(match.branch)}
          </div>
        </div>
      `;
    } else {
      trackingResult.innerHTML = `
        <div class="tracking-card" style="text-align: center; color: #64748b;">
          <p>No active record matching <strong>"${escapeHtml(query)}"</strong> was found.</p>
          <small>Check your Reference ID in the confirmation email or "My Requests" tab.</small>
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
  // Seed initial sample data for demonstration
  // --------------------------------------------------------------------------
  function seedSampleData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const initialRequests = [
        {
          ticketId: 'YEN-2026-10492',
          studentName: 'Mohammed Rayan',
          campusId: '22084',
          branch: 'Computer Science & Engineering',
          query: 'Bonafide Certificate for Visa Application',
          email: 'm.rayan@yenepoya.edu.in',
          year: '3rd Year',
          phone: '9845123450',
          date: 'Aug 24, 2026, 11:30 AM',
          status: 'Resolved (Issued)',
          statusType: 'resolved'
        },
        {
          ticketId: 'YEN-2026-10853',
          studentName: 'Mohammed Rayan',
          campusId: '22084',
          branch: 'Computer Science & Engineering',
          query: 'Semester Grade Card Duplicate Request',
          email: 'm.rayan@yenepoya.edu.in',
          year: '3rd Year',
          phone: '9845123450',
          date: 'Aug 27, 2026, 03:15 PM',
          status: 'In Processing',
          statusType: 'progress'
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRequests));
    }
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
