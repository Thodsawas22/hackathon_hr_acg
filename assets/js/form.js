/* global window, document, localStorage, FileReader, fetch */

(function () {
  const $ = (id) => document.getElementById(id);
  const state = { applications: [] };

  // Load any existing submissions
  try {
    state.applications = JSON.parse(localStorage.getItem('applications') || '[]');
  } catch { state.applications = []; }

  const dob = $('dob'), age = $('age'), statusLine = $('formStatus');

  // Age calculation
  function computeAge(iso) {
    if (!iso) return '';
    const d = new Date(iso), today = new Date();
    let A = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) A--;
    return A < 0 || Number.isNaN(A) ? '' : String(A);
  }
  dob?.addEventListener('change', () => age.value = computeAge(dob.value));

  // Convert to CSV
  function toCSV(rows) {
    const keys = Object.keys(rows[0] || {});
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = keys.map(esc).join(',');
    const lines = rows.map(r => keys.map(k => esc(r[k])).join(','));
    return [header, ...lines].join('\r\n');
  }

  // Export button
  $('exportBtn')?.addEventListener('click', () => {
    if (state.applications.length === 0) {
      alert('ยังไม่มีข้อมูลใบสมัครในเบราว์เซอร์นี้');
      return;
    }
    const blob = new Blob([toCSV(state.applications)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'applications.csv'; a.click();
    URL.revokeObjectURL(url);
  });

  // Submit
  $('submitBtn')?.addEventListener('click', async () => {
    statusLine.textContent = '';

    // Minimal required fields
    const required = [
      ['workArea', 'พื้นที่ที่ต้องการปฏิบัติงาน'],
      ['role1', 'ตำแหน่งที่ 1'],
      ['firstName', 'ชื่อ'],
      ['lastName', 'นามสกุล'],
      ['dob', 'วันเกิด'],
      ['phone', 'เบอร์โทรศัพท์'],
      ['email', 'E-Mail']
    ];
    for (const [id, label] of required) {
      const el = $(id);
      if (!el || !el.value) {
        alert(`กรุณากรอก: ${label}`);
        el?.focus();
        return;
      }
    }

    // Build record
    const rec = {
      submittedAt: new Date().toISOString(),
      workArea: $('workArea').value,
      role1: $('role1').value,
      role2: $('role2').value,
      firstName: $('firstName').value.trim(),
      lastName: $('lastName').value.trim(),
      nickname: $('nickname').value.trim(),
      dob: $('dob').value,
      age: computeAge($('dob').value),
      startDate: $('startDate').value,
      expectedSalary: $('expectedSalary').value,
      email: $('email').value.trim(),
      phone: $('phone').value.trim(),
      address: $('address').value.trim(),
      military: $('military').value,
      nationality: $('nationality').value.trim(),
      tattoo: $('tattoo').value,
      driverLicense: $('driverLicense').value,
      resumeName: ($('resume').files[0]?.name) || ''
    };

    // Save locally
    state.applications.push(rec);
    localStorage.setItem('applications', JSON.stringify(state.applications));

    // Optional: POST to backend if configured
    if (window.SUBMIT_ENDPOINT) {
      try {
        await fetch(window.SUBMIT_ENDPOINT, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(rec)
        });
      } catch (e) {
        console.warn('Failed posting to endpoint:', e);
      }
    }

    // UX feedback
    statusLine.textContent = 'ส่งใบสมัครเรียบร้อย (บันทึกไว้ในเบราว์เซอร์นี้ และพร้อมส่งไปเซิร์ฟเวอร์ถ้าตั้งค่าไว้)';
    // Clear simple fields (keep area/role)
    ['firstName','lastName','nickname','dob','startDate','expectedSalary','email','phone','address','nationality']
      .forEach(id => { const el = $(id); if (el) el.value = ''; });
    age.value = '';
    $('resume').value = '';
  });
})();
