// ─── CONFIG ───────────────────────────────────────────────
// Replace with your Connected App credentials
const SF_CONFIG = {
  clientId:     '3MVG9GCMQoQ6rpzSFKT_GJXYiurEPug8jg0xA4a.jA0ISyGA6sBDbjqWhM6V87r_QjT63LtvzWko.2y2UefN.',
  redirectUri:  'http://localhost:8080/callback.html',
  loginUrl:     'https://login.salesforce.com'
};

// ─── AUTH ─────────────────────────────────────────────────
const Auth = {
  login() {
    const url = `${SF_CONFIG.loginUrl}/services/oauth2/authorize`
      + `?response_type=token`
      + `&client_id=${SF_CONFIG.clientId}`
      + `&redirect_uri=${encodeURIComponent(SF_CONFIG.redirectUri)}`;
    window.location.href = url;
  },

  handleCallback() {
    const hash = window.location.hash.substring(1);
    if (!hash) return false;
    const params = Object.fromEntries(new URLSearchParams(hash));
    if (params.access_token) {
      sessionStorage.setItem('sf_token',    params.access_token);
      sessionStorage.setItem('sf_instance', params.instance_url);
      return true;
    }
    return false;
  },

  getToken()    { return sessionStorage.getItem('sf_token'); },
  getInstance() { return sessionStorage.getItem('sf_instance'); },
  isLoggedIn()  { return !!this.getToken(); },

  logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
};

// ─── API ──────────────────────────────────────────────────
const API = {
  async query(soql) {
    const res = await fetch(
      `${Auth.getInstance()}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
      { headers: { Authorization: `Bearer ${Auth.getToken()}` } }
    );
    if (!res.ok) throw new Error(`SOQL failed: ${res.status}`);
    const data = await res.json();
    return data.records;
  },

  // ── Dashboard stats ──────────────────────────────────────
async getDashboardStats() {
  const [patients, doctors, appts, invoices] = await Promise.all([
    this.query(`SELECT COUNT(Id) total FROM Patient__c WHERE Patient_Status__c = 'Active'`),
    this.query(`SELECT COUNT(Id) total FROM Doctor__c WHERE Doctor_Status__c = 'Active'`),
    this.query(`SELECT COUNT(Id) total FROM Appointment__c WHERE Appointment_Date__c = TODAY AND Status__c != 'Cancelled'`),
    this.query(`SELECT COUNT(Id) total FROM Invoice__c WHERE Payment_Status__c IN ('Unpaid','Partially Paid')`)
  ]);
  return {
    totalPatients:     patients[0].total,
    activeDoctors:     doctors[0].total,
    todayAppointments: appts[0].total,
    pendingInvoices:   invoices[0].total
  };
},

  // ── Today's appointments ─────────────────────────────────
  async getTodayAppointments() {
  return this.query(`
    SELECT Id, Name, Status__c, Type__c, Token_Number__c,
      Appointment_Time__c,
      Patient__r.First_Name__c, Patient__r.Last_Name__c,
      Doctor__r.Name
    FROM Appointment__c
    WHERE Appointment_Date__c = TODAY
    AND Status__c != 'Cancelled'
    ORDER BY Appointment_Time__c ASC
    LIMIT 20
  `);
},

  // ── Overdue invoices ─────────────────────────────────────
async getOverdueInvoices() {
  return this.query(`
    SELECT Id, Invoice_Number__c, Due_Date__c, Outstanding_Balance__c, Payment_Status__c,
      Patient__r.First_Name__c, Patient__r.Last_Name__c
    FROM Invoice__c
    WHERE Payment_Status__c IN ('Unpaid','Partially Paid')
    AND Due_Date__c < TODAY
    ORDER BY Due_Date__c ASC
    LIMIT 5
  `);
},

  // ── Patients list ─────────────────────────────────────────
  async getPatients(search = '') {
    const filter = search
      ? `AND (Patient__c.First_Name__c LIKE '%${search}%' OR Last_Name__c LIKE '%${search}%')`
      : '';
    return this.query(`
      SELECT Id, Name, First_Name__c, Last_Name__c, Gender__c,
        Phone__c, Patient_Status__c, Age__c, Primary_Doctor__r.Name
      FROM Patient__c
      WHERE Patient_Status__c != null ${filter}
      ORDER BY CreatedDate DESC
      LIMIT 50
    `);
  },

  // ── Appointments list ─────────────────────────────────────
  async getAppointments() {
    return this.query(`
      SELECT Id, Name, Status__c, Type__c, Appointment_Date__c,
        Appointment_Time__c, Token_Number__c,
        Patient__r.First_Name__c, Patient__r.Last_Name__c,
        Doctor__r.Name
      FROM Appointment__c
      ORDER BY Appointment_Date__c DESC, Appointment_Time__c ASC
      LIMIT 50
    `);
  },

  // ── Doctors list ──────────────────────────────────────────
  async getDoctors() {
    return this.query(`
      SELECT Id, Name, Specialization__c, Department__c,
        Doctor_Status__c, Is_Available__c, Phone__c,
        Years_of_Experience__c, Consultation_Fee__c
      FROM Doctor__c
      WHERE Doctor_Status__c = 'Active'
      ORDER BY Name ASC
      LIMIT 50
    `);
  },

  // ── Doctor appointment counts (for performance bars) ──────
  async getDoctorAppointmentCounts() {
    return this.query(`
      SELECT Doctor__c, Doctor__r.Name, COUNT(Id) total
      FROM Appointment__c
      WHERE Appointment_Date__c = THIS_MONTH
      AND Status__c != 'Cancelled'
      GROUP BY Doctor__c, Doctor__r.Name
      ORDER BY COUNT(Id) DESC
      LIMIT 10
    `);
  },

  // ── Book appointment ──────────────────────────────────────
  async createAppointment(data) {
    const res = await fetch(
      `${Auth.getInstance()}/services/data/v59.0/sobjects/Appointment__c/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err[0]?.message || `Create failed: ${res.status}`);
    }
    return res.json();
  },

  // ── Search patients (for booking autocomplete) ────────────
  async searchPatients(term) {
    return this.query(`
      SELECT Id, Name, First_Name__c, Last_Name__c, Phone__c
      FROM Patient__c
      WHERE First_Name__c LIKE '%${term}%'
      OR Last_Name__c LIKE '%${term}%'
      LIMIT 10
    `);
  }
};

// ─── HELPERS ──────────────────────────────────────────────
function guardAuth() {
  if (!Auth.isLoggedIn()) window.location.href = 'login.html';
}

function initials(first, last) {
  return ((first||'')[0] + (last||'')[0]).toUpperCase();
}

function avatarColor(str) {
  const colors = [
    ['#E6F1FB','#185FA5'], ['#fce4ec','#880e4f'],
    ['#e8f5e9','#2e7d32'], ['#fff3e0','#e65100'],
    ['#f3e5f5','#6a1b9a'], ['#E1F5EE','#0F6E56']
  ];
  let h = 0;
  for (let c of (str||'')) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[Math.abs(h) % colors.length];
}

function statusBadge(status) {
  const map = {
    'Completed':   'b-green',
    'Confirmed':   'b-blue',
    'Scheduled':   'b-orange',
    'Cancelled':   'b-red',
    'In Progress': 'b-blue',
    'Active':      'b-green',
    'Admitted':    'b-blue',
    'Discharged':  'b-gray',
    'Unpaid':      'b-red',
    'Partially Paid': 'b-orange',
    'Paid':        'b-green'
  };
  return `<span class="badge ${map[status]||'b-gray'}">${status}</span>`;
}

function daysSince(dateStr) {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 0)  return `In ${Math.abs(diff)} days`;
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
