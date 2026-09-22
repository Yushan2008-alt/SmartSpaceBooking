const https = require('https');

const BASE_URL = 'https://smart-space-booking-eta.vercel.app';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = https.request(url, { method, headers }, (res) => {
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

function uploadFile(endpoint, filename, mimetype, contentBuffer, token = null) {
  return new Promise((resolve, reject) => {
    const boundary = '----Boundary' + Math.random().toString(36).substring(2);
    const url = new URL(BASE_URL + endpoint);
    const head = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimetype}\r\n\r\n`
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([head, contentBuffer, tail]);

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = https.request(url, { method: 'POST', headers }, (res) => {
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
    req.write(payload);
    req.end();
  });
}

async function runDetailedValidationTest() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   TEST INPUT DATA SWAGGER DETAIL & BOUNDARY/EDGE-CASES (VERCEL LIVE)       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const results = [];
  function record(category, testName, expectedStatus, actualStatus, passed, note = '') {
    results.push({ category, testName, expectedStatus, actualStatus, passed, note });
    const mark = passed ? '✓ [PASS]' : '✗ [FAIL / BUG]';
    console.log(`${mark} [${category}] ${testName} -> Exp: ${expectedStatus}, Act: ${actualStatus} ${note ? '| ' + note : ''}`);
  }

  // --- PRE-REQUISITE: LOGIN SEEDED USERS ---
  const adminLogin = await request('POST', '/api/auth/login', { username: 'admin_moklet', password: 'Admin123!' });
  const adminToken = adminLogin.data?.data?.access_token;

  const memberLogin = await request('POST', '/api/auth/login', { username: 'johndoe', password: 'Secret123!' });
  const memberToken = memberLogin.data?.data?.access_token;

  // 1. AUTH MODULE INPUT VALIDATION
  console.log('\n--- 1. AUTH DTO VALIDATIONS ---');
  // 1.1 Member register missing required fields
  const regBad1 = await request('POST', '/api/auth/register/member', { username: 'user_missing_fields' });
  record('Auth', 'Register Member: Missing required fields', 400, regBad1.status, regBad1.status === 400, regBad1.data?.message);

  // 1.2 Member register short password (< 6 chars)
  const regBad2 = await request('POST', '/api/auth/register/member', {
    username: 'user_short_pass_' + Date.now(),
    password: '123',
    nama_member: 'Short Pass',
    instansi: 'SMK',
    alamat: 'Malang',
    telp: '08123',
  });
  record('Auth', 'Register Member: Password < 6 chars', 400, regBad2.status, regBad2.status === 400, regBad2.data?.message);

  // 1.3 Member register duplicate username
  const regDup = await request('POST', '/api/auth/register/member', {
    username: 'johndoe',
    password: 'Password123!',
    nama_member: 'Duplicate John',
    instansi: 'SMK',
    alamat: 'Malang',
    telp: '081234567890',
  });
  record('Auth', 'Register Member: Duplicate username', 409, regDup.status, regDup.status === 409, regDup.data?.message);

  // 1.4 Admin Space register missing fields
  const regAdmBad = await request('POST', '/api/auth/register/admin-space', {
    username: 'admin_incomplete_' + Date.now(),
    password: 'AdminPassword123!',
  });
  record('Auth', 'Register Admin: Missing coworking info', 400, regAdmBad.status, regAdmBad.status === 400, regAdmBad.data?.message);

  // 1.5 Login wrong credentials
  const loginWrong = await request('POST', '/api/auth/login', { username: 'johndoe', password: 'WrongPassword999!' });
  record('Auth', 'Login: Incorrect password', 401, loginWrong.status, loginWrong.status === 401, loginWrong.data?.message);

  // 1.6 Login non-existent username
  const loginNotExist = await request('POST', '/api/auth/login', { username: 'ghost_user_999', password: 'Password123!' });
  record('Auth', 'Login: Non-existent username', 401, loginNotExist.status, loginNotExist.status === 401, loginNotExist.data?.message);

  // 2. SPACES MODULE INPUT VALIDATION
  console.log('\n--- 2. SPACES INPUT VALIDATIONS ---');
  // 2.1 Check availability missing params
  const availBad = await request('GET', '/api/spaces/availability');
  record('Spaces', 'Availability: Missing all query params', 400, availBad.status, availBad.status === 400, availBad.data?.message);

  // 2.2 Check availability for non-existent space ID
  const availNotExist = await request('GET', '/api/spaces/availability?id_space=999999&tanggal=2027-01-01&jam_mulai=10:00&durasi_jam=2');
  record('Spaces', 'Availability: Non-existent space ID', 404, availNotExist.status, availNotExist.status === 404, availNotExist.data?.message);

  // 2.3 Get space with invalid ID format (string instead of int)
  const spInvalidId = await request('GET', '/api/spaces/abc-not-number');
  record('Spaces', 'Detail Space: Invalid ID format string', 400, spInvalidId.status, spInvalidId.status === 400, spInvalidId.data?.message);

  // 2.4 Get non-existent space ID
  const spNotFound = await request('GET', '/api/spaces/999999');
  record('Spaces', 'Detail Space: ID not found', 404, spNotFound.status, spNotFound.status === 404, spNotFound.data?.message);

  // 2.5 Catalog search query returning empty list
  const spSearchEmpty = await request('GET', '/api/spaces?search=super_unlikely_space_query_xyz');
  record('Spaces', 'Catalog: Search no matches', 200, spSearchEmpty.status, spSearchEmpty.status === 200 && spSearchEmpty.data?.data?.length === 0, 'Found ' + spSearchEmpty.data?.data?.length);

  // 3. DISKON MODULE INPUT VALIDATION
  console.log('\n--- 3. DISKON INPUT VALIDATIONS ---');
  // 3.1 Check promo empty body
  const checkEmpty = await request('POST', '/api/diskon/check', {});
  record('Diskon', 'Check Promo: Empty body', 400, checkEmpty.status, checkEmpty.status === 400, checkEmpty.data?.message);

  // 3.2 Detail promo non-existent ID
  const diskonNotFound = await request('GET', '/api/diskon/999999');
  record('Diskon', 'Detail Diskon: Non-existent ID', 404, diskonNotFound.status, diskonNotFound.status === 404, diskonNotFound.data?.message);

  // 4. RESERVASI MODULE BUSINESS & INPUT VALIDATION
  console.log('\n--- 4. RESERVASI VALIDATIONS & BUSINESS RULES ---');
  // 4.1 Create reservation missing space ID & fields
  const resBad1 = await request('POST', '/api/reservasi', {}, memberToken);
  record('Reservasi', 'Create: Missing required body', 400, resBad1.status, resBad1.status === 400, resBad1.data?.message);

  // 4.2 Create reservation durasi_jam < 1
  const resBadDurasi = await request('POST', '/api/reservasi', {
    id_space: 1,
    tanggal_reservasi: '2027-10-10',
    jam_mulai: '09:00',
    durasi_jam: 0,
  }, memberToken);
  record('Reservasi', 'Create: durasi_jam < 1', 400, resBadDurasi.status, resBadDurasi.status === 400, resBadDurasi.data?.message);

  // 4.3 Create reservation non-existent space ID
  const resNotExistSpace = await request('POST', '/api/reservasi', {
    id_space: 999999,
    tanggal_reservasi: '2027-10-10',
    jam_mulai: '09:00',
    durasi_jam: 2,
  }, memberToken);
  record('Reservasi', 'Create: Non-existent space ID', 404, resNotExistSpace.status, resNotExistSpace.status === 404, resNotExistSpace.data?.message);

  // 4.4 Create reservation with invalid promo code
  const resBadPromo = await request('POST', '/api/reservasi', {
    id_space: 1,
    tanggal_reservasi: '2027-10-10',
    jam_mulai: '09:00',
    durasi_jam: 2,
    kode_promo: 'FAKE_PROMO_CODE',
  }, memberToken);
  record('Reservasi', 'Create: Invalid promo code', 404, resBadPromo.status, resBadPromo.status === 404, resBadPromo.data?.message);

  // 4.5 Overlap Detection Test
  const uniqueDate = `2027-11-${String(Math.floor(Math.random() * 25) + 1).padStart(2, '0')}`;
  // First booking: 10:00 - 13:00 (3 jam)
  const bookFirst = await request('POST', '/api/reservasi', {
    id_space: 1,
    tanggal_reservasi: uniqueDate,
    jam_mulai: '10:00',
    durasi_jam: 3,
  }, memberToken);
  record('Reservasi', 'Create First: 10:00 - 13:00', 201, bookFirst.status, bookFirst.status === 201);
  const firstBookingId = bookFirst.data?.data?.id;

  // Second booking overlapping: 11:00 - 12:00 (inside first booking) -> MUST BE 409 CONFLICT!
  const bookOverlap = await request('POST', '/api/reservasi', {
    id_space: 1,
    tanggal_reservasi: uniqueDate,
    jam_mulai: '11:00',
    durasi_jam: 1,
  }, memberToken);
  record('Reservasi', 'Create Overlap (11:00-12:00 -> 409 Conflict)', 409, bookOverlap.status, bookOverlap.status === 409, bookOverlap.data?.message);

  // Non-overlapping booking on same date: 14:00 - 16:00 -> MUST BE 201 CREATED!
  const bookValidSameDay = await request('POST', '/api/reservasi', {
    id_space: 1,
    tanggal_reservasi: uniqueDate,
    jam_mulai: '14:00',
    durasi_jam: 2,
  }, memberToken);
  record('Reservasi', 'Create Non-Overlap Same Day (14:00-16:00)', 201, bookValidSameDay.status, bookValidSameDay.status === 201);

  // 4.6 Cancel State Machine Transitions
  // Attempt illegal cancellation on a non-existent ID
  const cancel404 = await request('PATCH', '/api/reservasi/999999/cancel', null, memberToken);
  record('Reservasi', 'Cancel: Non-existent ID', 404, cancel404.status, cancel404.status === 404);

  // 5. ADMIN RESERVASI & STATE MACHINE INTEGRITY
  console.log('\n--- 5. STATE MACHINE TRANSITIONS (ADMIN) ---');
  if (firstBookingId) {
    // 5.1 Illegal: Check-in directly from 'belum_dikonfirm' (Must be approved first)
    const badCheckIn = await request('POST', `/api/admin/reservasi/${firstBookingId}/check-in`, null, adminToken);
    record('Admin Reservasi', 'Check-in from belum_dikonfirm (Illegal -> 400)', 400, badCheckIn.status, badCheckIn.status === 400, badCheckIn.data?.message);

    // 5.2 Illegal: Check-out directly from 'belum_dikonfirm'
    const badCheckOut = await request('POST', `/api/admin/reservasi/${firstBookingId}/check-out`, null, adminToken);
    record('Admin Reservasi', 'Check-out from belum_dikonfirm (Illegal -> 400)', 400, badCheckOut.status, badCheckOut.status === 400, badCheckOut.data?.message);

    // 5.3 Approve: belum_dikonfirm -> disetujui (Valid)
    const approveValid = await request('PATCH', `/api/admin/reservasi/${firstBookingId}/status`, { status: 'disetujui' }, adminToken);
    record('Admin Reservasi', 'Approve: belum_dikonfirm -> disetujui', 200, approveValid.status, approveValid.status === 200 && approveValid.data?.data?.status === 'disetujui');

    // 5.4 Check-in: disetujui -> aktif (Valid)
    const checkInValid = await request('POST', `/api/admin/reservasi/${firstBookingId}/check-in`, null, adminToken);
    record('Admin Reservasi', 'Check-in: disetujui -> aktif', 200, checkInValid.status, checkInValid.status === 200 && checkInValid.data?.data?.status === 'aktif');

    // 5.5 Illegal: Member tries to cancel after reservation is already 'aktif'
    const cancelActive = await request('PATCH', `/api/reservasi/${firstBookingId}/cancel`, null, memberToken);
    record('Reservasi', 'Cancel while aktif (Illegal -> 400)', 400, cancelActive.status, cancelActive.status === 400, cancelActive.data?.message);

    // 5.6 Check-out: aktif -> selesai (Valid)
    const checkOutValid = await request('POST', `/api/admin/reservasi/${firstBookingId}/check-out`, null, adminToken);
    record('Admin Reservasi', 'Check-out: aktif -> selesai', 200, checkOutValid.status, checkOutValid.status === 200 && checkOutValid.data?.data?.status === 'selesai');

    // 5.7 Illegal: Transition from terminal status 'selesai' -> 'disetujui'
    const reApprove = await request('PATCH', `/api/admin/reservasi/${firstBookingId}/status`, { status: 'disetujui' }, adminToken);
    record('Admin Reservasi', 'Status update from selesai (Terminal -> 400)', 400, reApprove.status, reApprove.status === 400, reApprove.data?.message);
  }

  // 6. ADMIN MASTER DATA CRUD VALIDATIONS
  console.log('\n--- 6. ADMIN MASTER DATA VALIDATIONS ---');
  // 6.1 Create Space with invalid tipe
  const badSpaceTipe = await request('POST', '/api/admin/spaces', {
    nama_space: 'Invalid Tipe Space',
    harga_per_jam: 50000,
    tipe: 'invalid_tipe_xyz',
    kapasitas: 4,
    deskripsi: 'Test',
  }, adminToken);
  record('Admin Spaces', 'Create Space: Invalid enum tipe', 400, badSpaceTipe.status, badSpaceTipe.status === 400, badSpaceTipe.data?.message);

  // 6.2 Create Promo with invalid percentage (> 100)
  const badPromoPerc = await request('POST', '/api/admin/diskon', {
    nama_diskon: 'SUPERDISCOUNT' + Date.now(),
    persentase_diskon: 150,
    tanggal_awal: '2026-01-01T00:00:00Z',
    tanggal_akhir: '2027-12-31T23:59:59Z',
  }, adminToken);
  record('Admin Diskon', 'Create Diskon: persentase > 100', 400, badPromoPerc.status, badPromoPerc.status === 400, badPromoPerc.data?.message);

  // 6.3 Create Promo duplicate name
  const dupPromo = await request('POST', '/api/admin/diskon', {
    nama_diskon: 'DISKONHEMAT20',
    persentase_diskon: 20,
    tanggal_awal: '2026-01-01T00:00:00Z',
    tanggal_akhir: '2027-12-31T23:59:59Z',
  }, adminToken);
  record('Admin Diskon', 'Create Diskon: Duplicate nama_diskon (409)', 409, dupPromo.status, dupPromo.status === 409, dupPromo.data?.message);

  // 7. UPLOAD FILE VALIDATIONS
  console.log('\n--- 7. UPLOAD MEDIA VALIDATIONS ---');
  // 7.1 Upload invalid MIME type (.txt instead of image)
  const badFileBuffer = Buffer.from('This is a plain text file, not an image.');
  const uploadBadMime = await uploadFile('/api/upload/image', 'test.txt', 'text/plain', badFileBuffer, memberToken);
  record('Upload', 'Upload invalid MIME text/plain (-> 400)', 400, uploadBadMime.status, uploadBadMime.status === 400, uploadBadMime.data?.message);

  // 7.2 Upload spaces by member (RBAC check -> 403)
  const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const uploadSpaceMember = await uploadFile('/api/upload/spaces', 'space.png', 'image/png', samplePng, memberToken);
  record('Upload', 'Upload space as Member (-> 403 Forbidden)', 403, uploadSpaceMember.status, uploadSpaceMember.status === 403, uploadSpaceMember.data?.message);

  // 7.3 Upload spaces by Admin (Valid -> 201)
  const uploadSpaceAdmin = await uploadFile('/api/upload/spaces', 'space.png', 'image/png', samplePng, adminToken);
  record('Upload', 'Upload space as Admin (-> 201 Created)', 201, uploadSpaceAdmin.status, uploadSpaceAdmin.status === 201, uploadSpaceAdmin.data?.data?.url);

  console.log('\n════════════════════════════════════════════════════════════════════════════');
  const passCount = results.filter(r => r.passed).length;
  console.log(`DETAILED VALIDATION TOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
  console.log('════════════════════════════════════════════════════════════════════════════');
}

runDetailedValidationTest().catch(console.error);
