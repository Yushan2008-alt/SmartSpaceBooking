const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function uploadDummy(endpoint, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----Boundary' + Math.random().toString(36).substring(2);
    const url = new URL(BASE_URL + endpoint);
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const head = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([head, samplePng, tail]);

    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payload.length,
          'Authorization': `Bearer ${token}`,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runQA() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   FINAL QA PASS — SMART SPACE BOOKING (UKK RPL PAKET B)       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
    } else {
      console.error(`  ✗ [FAIL] ${name} ${detail ? '(' + detail + ')' : ''}`);
      throw new Error(`QA Failed on: ${name}`);
    }
  }

  // 1. Root & Health
  console.log('--- 1. ROOT & HEALTH ---');
  const root = await request('GET', '/');
  assert('GET /', root.status === 200 && root.data?.status === true, root.data?.data?.name);

  const health = await request('GET', '/health');
  assert('GET /health', health.status === 200 && health.data?.data?.status === 'UP');

  // 2. Auth Module
  console.log('\n--- 2. AUTH MODULE ---');
  const adminLogin = await request('POST', '/api/auth/login', { username: 'admin_moklet', password: 'Admin123!' });
  assert('Admin Login', adminLogin.status === 200 && !!adminLogin.data?.data?.access_token);
  const adminToken = adminLogin.data.data.access_token;

  const memberLogin = await request('POST', '/api/auth/login', { username: 'johndoe', password: 'Secret123!' });
  assert('Member Login', memberLogin.status === 200 && !!memberLogin.data?.data?.access_token);
  const memberToken = memberLogin.data.data.access_token;

  const memberProfile = await request('GET', '/api/auth/profile', null, memberToken);
  assert('Member Profile', memberProfile.status === 200 && memberProfile.data?.data?.role === 'member');

  // 3. Spaces Module
  console.log('\n--- 3. SPACES MODULE ---');
  const types = await request('GET', '/api/spaces/types');
  assert('GET /api/spaces/types', types.status === 200 && types.data?.data?.length === 3);

  const spaces = await request('GET', '/api/spaces');
  assert('GET /api/spaces', spaces.status === 200 && spaces.data?.data?.length > 0);
  const testSpace = spaces.data.data[0];

  const spaceDetail = await request('GET', `/api/spaces/${testSpace.id}`);
  assert('GET /api/spaces/:id', spaceDetail.status === 200 && spaceDetail.data?.data?.id === testSpace.id);

  const avail = await request('GET', `/api/spaces/availability?id_space=${testSpace.id}&tanggal=2026-12-01&jam_mulai=10:00&durasi_jam=2`);
  assert('GET /api/spaces/availability', avail.status === 200 && typeof avail.data?.data?.available === 'boolean');

  // 4. Diskon Module
  console.log('\n--- 4. DISKON MODULE ---');
  const diskonActive = await request('GET', '/api/diskon/active');
  assert('GET /api/diskon/active', diskonActive.status === 200 && Array.isArray(diskonActive.data?.data));

  const promoCheck = await request('POST', '/api/diskon/check', { nama_diskon: 'DISKONHEMAT20', total_harga: 100000 });
  assert('POST /api/diskon/check', promoCheck.status === 200 && promoCheck.data?.data?.potongan_diskon === 20000);

  const promoDetail = await request('GET', `/api/diskon/${promoCheck.data.data.diskon.id}`);
  assert('GET /api/diskon/:id', promoDetail.status === 200 && promoDetail.data?.data?.nama_diskon === 'DISKONHEMAT20');

  // 5. Reservasi Member & State Machine
  console.log('\n--- 5. RESERVASI & WORKFLOW CHECK-IN/OUT ---');
  const randomDay = String(Math.floor(Math.random() * 25) + 1).padStart(2, '0');
  const booking = await request('POST', '/api/reservasi', {
    id_space: testSpace.id,
    tanggal_reservasi: `2027-01-${randomDay}`,
    jam_mulai: '08:00',
    durasi_jam: 2,
    kode_promo: 'DISKONHEMAT20',
  }, memberToken);
  assert('POST /api/reservasi', booking.status === 201 && booking.data?.data?.status === 'belum_dikonfirm');
  const bId = booking.data.data.id;

  const myBookings = await request('GET', '/api/reservasi/my', null, memberToken);
  assert('GET /api/reservasi/my', myBookings.status === 200 && myBookings.data?.data?.length > 0);

  const myHistory = await request('GET', '/api/reservasi/my/history?month=12&year=2026', null, memberToken);
  assert('GET /api/reservasi/my/history', myHistory.status === 200 && myHistory.data?.data?.total_pengeluaran >= 0);

  const eticket = await request('GET', `/api/reservasi/${bId}/e-ticket`, null, memberToken);
  assert('GET /api/reservasi/:id/e-ticket', eticket.status === 200 && !!eticket.data?.data?.e_ticket?.qr_code_payload);

  const bDetail = await request('GET', `/api/reservasi/${bId}`, null, memberToken);
  assert('GET /api/reservasi/:id', bDetail.status === 200 && bDetail.data?.data?.id === bId);

  // Admin Approve
  const approve = await request('PATCH', `/api/admin/reservasi/${bId}/status`, { status: 'disetujui' }, adminToken);
  assert('Admin Approve (disetujui)', approve.status === 200 && approve.data?.data?.status === 'disetujui');

  // Admin Check-in
  const checkIn = await request('POST', `/api/admin/reservasi/${bId}/check-in`, null, adminToken);
  assert('Admin Check-in (aktif)', checkIn.status === 200 && checkIn.data?.data?.status === 'aktif');

  // Admin Check-out
  const checkOut = await request('POST', `/api/admin/reservasi/${bId}/check-out`, null, adminToken);
  assert('Admin Check-out (selesai)', checkOut.status === 200 && checkOut.data?.data?.status === 'selesai');

  // 6. Admin Module CRUD
  console.log('\n--- 6. ADMIN MASTER DATA CRUD ---');
  const adminProfile = await request('GET', '/api/admin/profile', null, adminToken);
  assert('GET /api/admin/profile', adminProfile.status === 200 && !!adminProfile.data?.data?.nama_coworking);

  const adminMembers = await request('GET', '/api/admin/members', null, adminToken);
  assert('GET /api/admin/members', adminMembers.status === 200 && Array.isArray(adminMembers.data?.data));

  const adminSpaces = await request('GET', '/api/admin/spaces', null, adminToken);
  assert('GET /api/admin/spaces', adminSpaces.status === 200 && Array.isArray(adminSpaces.data?.data));

  const adminDiskon = await request('GET', '/api/admin/diskon', null, adminToken);
  assert('GET /api/admin/diskon', adminDiskon.status === 200 && Array.isArray(adminDiskon.data?.data));

  const adminReservasi = await request('GET', '/api/admin/reservasi', null, adminToken);
  assert('GET /api/admin/reservasi', adminReservasi.status === 200 && Array.isArray(adminReservasi.data?.data));

  // 7. Reports
  console.log('\n--- 7. REPORTS MODULE ---');
  const repMonthly = await request('GET', '/api/admin/reports/monthly?month=12&year=2026', null, adminToken);
  assert('GET /api/admin/reports/monthly', repMonthly.status === 200 && repMonthly.data?.data?.total_transaksi > 0);

  const repIncome = await request('GET', '/api/admin/reports/income?month=12&year=2026', null, adminToken);
  assert('GET /api/admin/reports/income', repIncome.status === 200 && typeof repIncome.data?.data?.realisasi_pendapatan === 'number');

  // 8. Uploads
  console.log('\n--- 8. UPLOAD MODULE ---');
  const up1 = await uploadDummy('/api/upload/image', adminToken);
  assert('POST /api/upload/image', up1.status === 201 && !!up1.data?.data?.url);

  const up2 = await uploadDummy('/api/upload/spaces', adminToken);
  assert('POST /api/upload/spaces', up2.status === 201 && !!up2.data?.data?.url);

  const up3 = await uploadDummy('/api/upload/members', adminToken);
  assert('POST /api/upload/members', up3.status === 201 && !!up3.data?.data?.url);

  // 9. Swagger
  console.log('\n--- 9. SWAGGER DOCUMENTATION ---');
  const docs = await request('GET', '/docs-json');
  assert('GET /docs-json', docs.status === 200 && !!docs.data?.paths);

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`  QA RESULT: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
  console.log('════════════════════════════════════════════════════════════════\n');
}

runQA().catch((e) => {
  console.error('\nQA FAILED WITH ERROR:', e);
  process.exit(1);
});
