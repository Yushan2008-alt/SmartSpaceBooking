const BASE_URL = process.env.TEST_BASE_URL || 'https://smart-space-booking-eta.vercel.app';
const isHttps = BASE_URL.startsWith('https:');
const transport = isHttps ? require('https') : require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = transport.request(url, { method, headers }, (res) => {
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

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = transport.request(url, { method: 'POST', headers }, (res) => {
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

async function runLiveTest() {
  console.log('================================================================');
  console.log('   TEST LIVE SWAGGER & ROLE ACCESS (VERCEL: ' + BASE_URL + ')');
  console.log('================================================================\n');

  const results = [];
  function record(section, name, expected, actual, passed, detail = '') {
    results.push({ section, name, expected, actual, passed, detail });
    const mark = passed ? '✓ [PASS]' : '✗ [FAIL / BUG]';
    console.log(`${mark} ${section} - ${name} | Exp: ${expected}, Act: ${actual} ${detail ? '(' + detail + ')' : ''}`);
  }

  // --- 1. ROOT & HEALTH ---
  const r1 = await request('GET', '/');
  record('1. Root & Health', 'GET /', 200, r1.status, r1.status === 200);

  const r2 = await request('GET', '/health');
  record('1. Root & Health', 'GET /health', 200, r2.status, r2.status === 200);

  const rDb = await request('GET', '/test-db');
  record('1. Root & Health', 'GET /test-db', 200, rDb.status, rDb.status === 200);

  const rCloud = await request('GET', '/test-cloudinary');
  record('1. Root & Health', 'GET /test-cloudinary', 200, rCloud.status, rCloud.status === 200);

  // --- 2. AUTH REGISTRATION & LOGIN ---
  const rand = Math.floor(Math.random() * 900000) + 100000;
  const newMemberUsername = `member_${rand}`;
  const newAdminUsername = `admin_${rand}`;
  const newMember2Username = `member2_${rand}`;

  // Register Member 1
  const regM1 = await request('POST', '/api/auth/register/member', {
    username: newMemberUsername,
    password: 'Password123!',
    nama_member: 'Testing Member 1',
    instansi: 'SMK Telkom Malang',
    alamat: 'Jl. Danau Ranau No. 1',
    telp: '081234567890',
  });
  record('2. Auth', 'POST /api/auth/register/member', 201, regM1.status, regM1.status === 201);

  // Register Member 2 (to test cross-member access)
  const regM2 = await request('POST', '/api/auth/register/member', {
    username: newMember2Username,
    password: 'Password123!',
    nama_member: 'Testing Member 2',
    instansi: 'SMK Telkom Malang',
    alamat: 'Jl. Danau Ranau No. 2',
    telp: '081234567891',
  });
  record('2. Auth', 'POST /api/auth/register/member (Member 2)', 201, regM2.status, regM2.status === 201);

  // Register Admin Space
  const regAdmin = await request('POST', '/api/auth/register/admin-space', {
    username: newAdminUsername,
    password: 'Password123!',
    nama_coworking: `Coworking Space ${rand}`,
    nama_pemilik: 'Admin Testing',
    telp: '081298765432',
  });
  record('2. Auth', 'POST /api/auth/register/admin-space', 201, regAdmin.status, regAdmin.status === 201);

  // Login Member 1
  const loginM1 = await request('POST', '/api/auth/login', {
    username: newMemberUsername,
    password: 'Password123!',
  });
  const member1Token = loginM1.data?.data?.access_token;
  record('2. Auth', 'POST /api/auth/login (Member 1)', 200, loginM1.status, loginM1.status === 200 && !!member1Token);

  // Login Member 2
  const loginM2 = await request('POST', '/api/auth/login', {
    username: newMember2Username,
    password: 'Password123!',
  });
  const member2Token = loginM2.data?.data?.access_token;
  record('2. Auth', 'POST /api/auth/login (Member 2)', 200, loginM2.status, loginM2.status === 200 && !!member2Token);

  // Login Admin
  const loginAdmin = await request('POST', '/api/auth/login', {
    username: newAdminUsername,
    password: 'Password123!',
  });
  const adminToken = loginAdmin.data?.data?.access_token;
  record('2. Auth', 'POST /api/auth/login (Admin)', 200, loginAdmin.status, loginAdmin.status === 200 && !!adminToken);

  // GET /api/auth/profile
  const profM1 = await request('GET', '/api/auth/profile', null, member1Token);
  record('2. Auth', 'GET /api/auth/profile (Member 1)', 200, profM1.status, profM1.status === 200 && profM1.data?.data?.role === 'member');

  const profAdmin = await request('GET', '/api/auth/profile', null, adminToken);
  record('2. Auth', 'GET /api/auth/profile (Admin)', 200, profAdmin.status, profAdmin.status === 200 && profAdmin.data?.data?.role === 'admin_space');

  const profAnon = await request('GET', '/api/auth/profile');
  record('2. Auth', 'GET /api/auth/profile (Anonymous -> 401)', 401, profAnon.status, profAnon.status === 401);

  // --- 3. SPACES MODULE ---
  const spTypes = await request('GET', '/api/spaces/types');
  record('3. Spaces', 'GET /api/spaces/types', 200, spTypes.status, spTypes.status === 200);

  const spList = await request('GET', '/api/spaces');
  record('3. Spaces', 'GET /api/spaces', 200, spList.status, spList.status === 200 && spList.data?.data?.length > 0);
  const testSpace = spList.data?.data?.[0];
  const testSpaceId = testSpace ? testSpace.id : 1;

  const spDetail = await request('GET', `/api/spaces/${testSpaceId}`);
  record('3. Spaces', 'GET /api/spaces/:id', 200, spDetail.status, spDetail.status === 200);

  const spAvail = await request('GET', `/api/spaces/availability?id_space=${testSpaceId}&tanggal=2027-05-10&jam_mulai=09:00&durasi_jam=3`);
  record('3. Spaces', 'GET /api/spaces/availability', 200, spAvail.status, spAvail.status === 200);

  // --- 4. DISKON MODULE ---
  const dActive = await request('GET', '/api/diskon/active');
  record('4. Diskon', 'GET /api/diskon/active', 200, dActive.status, dActive.status === 200);

  const dCheck = await request('POST', '/api/diskon/check', {
    nama_diskon: 'DISKONHEMAT20',
    total_harga: 100000,
  });
  record('4. Diskon', 'POST /api/diskon/check (valid)', 200, dCheck.status, dCheck.status === 200);

  const dCheckBad = await request('POST', '/api/diskon/check', {
    nama_diskon: 'INVALID_PROMO_CODE_XYZ',
    total_harga: 100000,
  });
  record('4. Diskon', 'POST /api/diskon/check (invalid -> 404)', 404, dCheckBad.status, dCheckBad.status === 404);

  let diskonId = dCheck.data?.data?.diskon?.id;
  if (!diskonId && dActive.data?.data?.length > 0) diskonId = dActive.data.data[0].id;
  if (diskonId) {
    const dDetail = await request('GET', `/api/diskon/${diskonId}`);
    record('4. Diskon', 'GET /api/diskon/:id', 200, dDetail.status, dDetail.status === 200);
  }

  // --- 5. RESERVASI MODULE (MEMBER) & ROLE SECURITY ---
  // Create reservation as Member 1
  const randDay = String(Math.floor(Math.random() * 25) + 1).padStart(2, '0');
  const resCreateM1 = await request('POST', '/api/reservasi', {
    id_space: testSpaceId,
    tanggal_reservasi: `2027-06-${randDay}`,
    jam_mulai: '13:00',
    durasi_jam: 2,
    kode_promo: 'DISKONHEMAT20',
  }, member1Token);
  record('5. Reservasi', 'POST /api/reservasi (as Member 1)', 201, resCreateM1.status, resCreateM1.status === 201);
  const bookingId1 = resCreateM1.data?.data?.id;

  // Role check: Create reservation as Admin -> MUST BE 403 Forbidden!
  const resCreateAdmin = await request('POST', '/api/reservasi', {
    id_space: testSpaceId,
    tanggal_reservasi: `2027-06-${randDay}`,
    jam_mulai: '16:00',
    durasi_jam: 2,
  }, adminToken);
  record('5. Reservasi', 'POST /api/reservasi (as Admin -> 403 Forbidden)', 403, resCreateAdmin.status, resCreateAdmin.status === 403, resCreateAdmin.data?.message);

  // Role check: Create reservation as Anon -> 401
  const resCreateAnon = await request('POST', '/api/reservasi', {
    id_space: testSpaceId,
    tanggal_reservasi: `2027-06-${randDay}`,
    jam_mulai: '18:00',
    durasi_jam: 1,
  });
  record('5. Reservasi', 'POST /api/reservasi (as Anon -> 401)', 401, resCreateAnon.status, resCreateAnon.status === 401);

  // GET /api/reservasi/my as Member 1
  const resMyM1 = await request('GET', '/api/reservasi/my', null, member1Token);
  record('5. Reservasi', 'GET /api/reservasi/my (as Member 1)', 200, resMyM1.status, resMyM1.status === 200 && resMyM1.data?.data?.length > 0);

  // Role check: GET /api/reservasi/my as Admin -> MUST BE 403 Forbidden!
  const resMyAdmin = await request('GET', '/api/reservasi/my', null, adminToken);
  record('5. Reservasi', 'GET /api/reservasi/my (as Admin -> 403 Forbidden)', 403, resMyAdmin.status, resMyAdmin.status === 403, resMyAdmin.data?.message);

  // GET /api/reservasi/my/history as Member 1
  const resHistM1 = await request('GET', '/api/reservasi/my/history?month=6&year=2027', null, member1Token);
  record('5. Reservasi', 'GET /api/reservasi/my/history (as Member 1)', 200, resHistM1.status, resHistM1.status === 200);

  // Role check: GET /api/reservasi/my/history as Admin -> MUST BE 403 Forbidden!
  const resHistAdmin = await request('GET', '/api/reservasi/my/history?month=6&year=2027', null, adminToken);
  record('5. Reservasi', 'GET /api/reservasi/my/history (as Admin -> 403 Forbidden)', 403, resHistAdmin.status, resHistAdmin.status === 403, resHistAdmin.data?.message);

  // Detail & E-Ticket access by owner vs other member vs admin
  if (bookingId1) {
    // E-Ticket as Member 1 (Owner) -> 200
    const etickM1 = await request('GET', `/api/reservasi/${bookingId1}/e-ticket`, null, member1Token);
    record('5. Reservasi', 'GET /api/reservasi/:id/e-ticket (as Owner Member)', 200, etickM1.status, etickM1.status === 200);

    // E-Ticket as Member 2 (Different Member) -> MUST BE 403 Forbidden!
    const etickM2 = await request('GET', `/api/reservasi/${bookingId1}/e-ticket`, null, member2Token);
    record('5. Reservasi', 'GET /api/reservasi/:id/e-ticket (as Other Member -> 403)', 403, etickM2.status, etickM2.status === 403, etickM2.data?.message);

    // E-Ticket as Admin -> 200 (Admin is allowed to view e-tickets for verification)
    const etickAdmin = await request('GET', `/api/reservasi/${bookingId1}/e-ticket`, null, adminToken);
    record('5. Reservasi', 'GET /api/reservasi/:id/e-ticket (as Admin)', 200, etickAdmin.status, etickAdmin.status === 200);

    // Detail as Member 1 (Owner) -> 200
    const detM1 = await request('GET', `/api/reservasi/${bookingId1}`, null, member1Token);
    record('5. Reservasi', 'GET /api/reservasi/:id (as Owner Member)', 200, detM1.status, detM1.status === 200);

    // Detail as Member 2 (Different Member) -> MUST BE 403 Forbidden!
    const detM2 = await request('GET', `/api/reservasi/${bookingId1}`, null, member2Token);
    record('5. Reservasi', 'GET /api/reservasi/:id (as Other Member -> 403)', 403, detM2.status, detM2.status === 403, detM2.data?.message);

    // Detail as Admin -> 200
    const detAdmin = await request('GET', `/api/reservasi/${bookingId1}`, null, adminToken);
    record('5. Reservasi', 'GET /api/reservasi/:id (as Admin)', 200, detAdmin.status, detAdmin.status === 200);

    // Cancel as Member 2 (Different Member) -> MUST BE 403 Forbidden!
    const cancelM2 = await request('PATCH', `/api/reservasi/${bookingId1}/cancel`, null, member2Token);
    record('5. Reservasi', 'PATCH /api/reservasi/:id/cancel (as Other Member -> 403)', 403, cancelM2.status, cancelM2.status === 403, cancelM2.data?.message);

    // Cancel as Admin -> MUST BE 403 Forbidden! (Admin must use admin status route)
    const cancelAdmin = await request('PATCH', `/api/reservasi/${bookingId1}/cancel`, null, adminToken);
    record('5. Reservasi', 'PATCH /api/reservasi/:id/cancel (as Admin -> 403)', 403, cancelAdmin.status, cancelAdmin.status === 403, cancelAdmin.data?.message);

    // Create a 2nd reservation for Member 1 to test normal cancellation
    const resCreateM1_b = await request('POST', '/api/reservasi', {
      id_space: testSpaceId,
      tanggal_reservasi: `2027-07-${randDay}`,
      jam_mulai: '08:00',
      durasi_jam: 1,
    }, member1Token);
    if (resCreateM1_b.data?.data?.id) {
      const cancelM1 = await request('PATCH', `/api/reservasi/${resCreateM1_b.data.data.id}/cancel`, null, member1Token);
      record('5. Reservasi', 'PATCH /api/reservasi/:id/cancel (as Owner Member -> 200)', 200, cancelM1.status, cancelM1.status === 200 && cancelM1.data?.data?.status === 'dibatalkan');
    }
  }

  // --- 6. ADMIN PROFILE ---
  // GET /api/admin/profile as Admin -> 200
  const admProf = await request('GET', '/api/admin/profile', null, adminToken);
  record('6. Admin Profile', 'GET /api/admin/profile (as Admin)', 200, admProf.status, admProf.status === 200);

  // Role check: GET /api/admin/profile as Member -> MUST BE 403 Forbidden!
  const admProfMember = await request('GET', '/api/admin/profile', null, member1Token);
  record('6. Admin Profile', 'GET /api/admin/profile (as Member -> 403 Forbidden)', 403, admProfMember.status, admProfMember.status === 403, admProfMember.data?.message);

  // PUT /api/admin/profile as Admin -> 200
  const admProfPut = await request('PUT', '/api/admin/profile', {
    nama_coworking: `Updated Coworking ${rand}`,
    nama_pemilik: 'Owner Updated',
    telp: '081299998888',
  }, adminToken);
  record('6. Admin Profile', 'PUT /api/admin/profile (as Admin)', 200, admProfPut.status, admProfPut.status === 200);

  // Role check: PUT /api/admin/profile as Member -> MUST BE 403 Forbidden!
  const admProfPutMember = await request('PUT', '/api/admin/profile', {
    nama_coworking: 'Hacked Coworking',
    nama_pemilik: 'Hacker',
    telp: '081200000000',
  }, member1Token);
  record('6. Admin Profile', 'PUT /api/admin/profile (as Member -> 403 Forbidden)', 403, admProfPutMember.status, admProfPutMember.status === 403, admProfPutMember.data?.message);

  // --- 7. ADMIN MEMBERS CRUD & ROLE SECURITY ---
  // GET /api/admin/members as Admin -> 200
  const admMemList = await request('GET', '/api/admin/members', null, adminToken);
  record('7. Admin Members', 'GET /api/admin/members (as Admin)', 200, admMemList.status, admMemList.status === 200);

  // Role check: GET /api/admin/members as Member -> MUST BE 403 Forbidden!
  const admMemListMember = await request('GET', '/api/admin/members', null, member1Token);
  record('7. Admin Members', 'GET /api/admin/members (as Member -> 403 Forbidden)', 403, admMemListMember.status, admMemListMember.status === 403, admMemListMember.data?.message);

  // POST /api/admin/members as Admin -> 201
  const admMemCreate = await request('POST', '/api/admin/members', {
    username: `adm_created_${rand}`,
    password: 'Password123!',
    nama_member: 'Member Created by Admin',
    instansi: 'SMK Telkom',
    alamat: 'Malang',
    telp: '081122334455',
  }, adminToken);
  record('7. Admin Members', 'POST /api/admin/members (as Admin)', 201, admMemCreate.status, admMemCreate.status === 201);
  const createdMemberId = admMemCreate.data?.data?.id;

  // Role check: POST /api/admin/members as Member -> MUST BE 403 Forbidden!
  const admMemCreateMember = await request('POST', '/api/admin/members', {
    username: `hacker_member_${rand}`,
    password: 'Password123!',
    nama_member: 'Hacker Member',
    instansi: 'Hacker Inc',
    alamat: 'Unknown',
    telp: '081100000000',
  }, member1Token);
  record('7. Admin Members', 'POST /api/admin/members (as Member -> 403 Forbidden)', 403, admMemCreateMember.status, admMemCreateMember.status === 403, admMemCreateMember.data?.message);

  if (createdMemberId) {
    // GET /api/admin/members/:id as Admin -> 200
    const admMemGet = await request('GET', `/api/admin/members/${createdMemberId}`, null, adminToken);
    record('7. Admin Members', 'GET /api/admin/members/:id (as Admin)', 200, admMemGet.status, admMemGet.status === 200);

    // Role check: GET /api/admin/members/:id as Member -> 403
    const admMemGetM = await request('GET', `/api/admin/members/${createdMemberId}`, null, member1Token);
    record('7. Admin Members', 'GET /api/admin/members/:id (as Member -> 403)', 403, admMemGetM.status, admMemGetM.status === 403);

    // PUT /api/admin/members/:id as Admin -> 200
    const admMemPut = await request('PUT', `/api/admin/members/${createdMemberId}`, {
      nama_member: 'Updated Member Name',
    }, adminToken);
    record('7. Admin Members', 'PUT /api/admin/members/:id (as Admin)', 200, admMemPut.status, admMemPut.status === 200);

    // DELETE /api/admin/members/:id as Admin -> 200
    const admMemDel = await request('DELETE', `/api/admin/members/${createdMemberId}`, null, adminToken);
    record('7. Admin Members', 'DELETE /api/admin/members/:id (as Admin)', 200, admMemDel.status, admMemDel.status === 200);
  }

  // --- 8. ADMIN SPACES CRUD & ROLE SECURITY ---
  // GET /api/admin/spaces as Admin -> 200
  const admSpList = await request('GET', '/api/admin/spaces', null, adminToken);
  record('8. Admin Spaces', 'GET /api/admin/spaces (as Admin)', 200, admSpList.status, admSpList.status === 200);

  // Role check: GET /api/admin/spaces as Member -> MUST BE 403 Forbidden!
  const admSpListM = await request('GET', '/api/admin/spaces', null, member1Token);
  record('8. Admin Spaces', 'GET /api/admin/spaces (as Member -> 403 Forbidden)', 403, admSpListM.status, admSpListM.status === 403, admSpListM.data?.message);

  // POST /api/admin/spaces as Admin -> 201
  const admSpCreate = await request('POST', '/api/admin/spaces', {
    nama_space: `Space Created ${rand}`,
    harga_per_jam: 35000,
    tipe: 'desk',
    kapasitas: 1,
    deskripsi: 'Deskripsi space testing',
  }, adminToken);
  record('8. Admin Spaces', 'POST /api/admin/spaces (as Admin)', 201, admSpCreate.status, admSpCreate.status === 201);
  const createdSpaceId = admSpCreate.data?.data?.id;

  // Role check: POST /api/admin/spaces as Member -> MUST BE 403 Forbidden!
  const admSpCreateM = await request('POST', '/api/admin/spaces', {
    nama_space: 'Hacked Space',
    harga_per_jam: 1000,
    tipe: 'desk',
    kapasitas: 1,
    deskripsi: 'Fake',
  }, member1Token);
  record('8. Admin Spaces', 'POST /api/admin/spaces (as Member -> 403 Forbidden)', 403, admSpCreateM.status, admSpCreateM.status === 403, admSpCreateM.data?.message);

  if (createdSpaceId) {
    // GET /api/admin/spaces/:id as Admin -> 200
    const admSpGet = await request('GET', `/api/admin/spaces/${createdSpaceId}`, null, adminToken);
    record('8. Admin Spaces', 'GET /api/admin/spaces/:id (as Admin)', 200, admSpGet.status, admSpGet.status === 200);

    // PUT /api/admin/spaces/:id as Admin -> 200
    const admSpPut = await request('PUT', `/api/admin/spaces/${createdSpaceId}`, {
      harga_per_jam: 40000,
    }, adminToken);
    record('8. Admin Spaces', 'PUT /api/admin/spaces/:id (as Admin)', 200, admSpPut.status, admSpPut.status === 200);

    // DELETE /api/admin/spaces/:id as Admin -> 200
    const admSpDel = await request('DELETE', `/api/admin/spaces/${createdSpaceId}`, null, adminToken);
    record('8. Admin Spaces', 'DELETE /api/admin/spaces/:id (as Admin)', 200, admSpDel.status, admSpDel.status === 200);
  }

  // --- 9. ADMIN DISKON CRUD & ROLE SECURITY ---
  // GET /api/admin/diskon as Admin -> 200
  const admDiskList = await request('GET', '/api/admin/diskon', null, adminToken);
  record('9. Admin Diskon', 'GET /api/admin/diskon (as Admin)', 200, admDiskList.status, admDiskList.status === 200);

  // Role check: GET /api/admin/diskon as Member -> MUST BE 403 Forbidden!
  const admDiskListM = await request('GET', '/api/admin/diskon', null, member1Token);
  record('9. Admin Diskon', 'GET /api/admin/diskon (as Member -> 403 Forbidden)', 403, admDiskListM.status, admDiskListM.status === 403, admDiskListM.data?.message);

  // POST /api/admin/diskon as Admin -> 201
  const promoCode = `PROMO${rand}`;
  const admDiskCreate = await request('POST', '/api/admin/diskon', {
    nama_diskon: promoCode,
    persentase_diskon: 25,
    tanggal_awal: '2026-01-01T00:00:00Z',
    tanggal_akhir: '2027-12-31T23:59:59Z',
  }, adminToken);
  record('9. Admin Diskon', 'POST /api/admin/diskon (as Admin)', 201, admDiskCreate.status, admDiskCreate.status === 201);
  const createdDiskonId = admDiskCreate.data?.data?.id;

  // Role check: POST /api/admin/diskon as Member -> MUST BE 403 Forbidden!
  const admDiskCreateM = await request('POST', '/api/admin/diskon', {
    nama_diskon: `HACK${rand}`,
    persentase_diskon: 90,
    tanggal_awal: '2026-01-01T00:00:00Z',
    tanggal_akhir: '2027-12-31T23:59:59Z',
  }, member1Token);
  record('9. Admin Diskon', 'POST /api/admin/diskon (as Member -> 403 Forbidden)', 403, admDiskCreateM.status, admDiskCreateM.status === 403, admDiskCreateM.data?.message);

  if (createdDiskonId) {
    // GET /api/admin/diskon/:id as Admin -> 200
    const admDiskGet = await request('GET', `/api/admin/diskon/${createdDiskonId}`, null, adminToken);
    record('9. Admin Diskon', 'GET /api/admin/diskon/:id (as Admin)', 200, admDiskGet.status, admDiskGet.status === 200);

    // PUT /api/admin/diskon/:id as Admin -> 200
    const admDiskPut = await request('PUT', `/api/admin/diskon/${createdDiskonId}`, {
      persentase_diskon: 30,
    }, adminToken);
    record('9. Admin Diskon', 'PUT /api/admin/diskon/:id (as Admin)', 200, admDiskPut.status, admDiskPut.status === 200);

    // DELETE /api/admin/diskon/:id as Admin -> 200
    const admDiskDel = await request('DELETE', `/api/admin/diskon/${createdDiskonId}`, null, adminToken);
    record('9. Admin Diskon', 'DELETE /api/admin/diskon/:id (as Admin)', 200, admDiskDel.status, admDiskDel.status === 200);
  }

  // --- 10. ADMIN RESERVASI (CONFIRMATION, CHECK-IN, CHECK-OUT) ---
  // GET /api/admin/reservasi as Admin -> 200
  const admResList = await request('GET', '/api/admin/reservasi', null, adminToken);
  record('10. Admin Reservasi', 'GET /api/admin/reservasi (as Admin)', 200, admResList.status, admResList.status === 200);

  // Role check: GET /api/admin/reservasi as Member -> MUST BE 403 Forbidden!
  const admResListM = await request('GET', '/api/admin/reservasi', null, member1Token);
  record('10. Admin Reservasi', 'GET /api/admin/reservasi (as Member -> 403 Forbidden)', 403, admResListM.status, admResListM.status === 403, admResListM.data?.message);

  if (bookingId1) {
    // Role check: PATCH /api/admin/reservasi/:id/status as Member -> MUST BE 403 Forbidden!
    const admStatusM = await request('PATCH', `/api/admin/reservasi/${bookingId1}/status`, { status: 'disetujui' }, member1Token);
    record('10. Admin Reservasi', 'PATCH /api/admin/reservasi/:id/status (as Member -> 403)', 403, admStatusM.status, admStatusM.status === 403, admStatusM.data?.message);

    // Approve booking as Admin: status -> 'disetujui'
    const admApprove = await request('PATCH', `/api/admin/reservasi/${bookingId1}/status`, { status: 'disetujui' }, adminToken);
    record('10. Admin Reservasi', 'PATCH /api/admin/reservasi/:id/status (as Admin -> disetujui)', 200, admApprove.status, admApprove.status === 200 && admApprove.data?.data?.status === 'disetujui');

    // Role check: POST /api/admin/reservasi/:id/check-in as Member -> MUST BE 403 Forbidden!
    const admCheckInM = await request('POST', `/api/admin/reservasi/${bookingId1}/check-in`, null, member1Token);
    record('10. Admin Reservasi', 'POST /api/admin/reservasi/:id/check-in (as Member -> 403)', 403, admCheckInM.status, admCheckInM.status === 403, admCheckInM.data?.message);

    // Check-in as Admin -> 200 (status -> 'aktif')
    const admCheckIn = await request('POST', `/api/admin/reservasi/${bookingId1}/check-in`, null, adminToken);
    record('10. Admin Reservasi', 'POST /api/admin/reservasi/:id/check-in (as Admin -> aktif)', 200, admCheckIn.status, admCheckIn.status === 200 && admCheckIn.data?.data?.status === 'aktif');

    // Role check: POST /api/admin/reservasi/:id/check-out as Member -> MUST BE 403 Forbidden!
    const admCheckOutM = await request('POST', `/api/admin/reservasi/${bookingId1}/check-out`, null, member1Token);
    record('10. Admin Reservasi', 'POST /api/admin/reservasi/:id/check-out (as Member -> 403)', 403, admCheckOutM.status, admCheckOutM.status === 403, admCheckOutM.data?.message);

    // Check-out as Admin -> 200 (status -> 'selesai')
    const admCheckOut = await request('POST', `/api/admin/reservasi/${bookingId1}/check-out`, null, adminToken);
    record('10. Admin Reservasi', 'POST /api/admin/reservasi/:id/check-out (as Admin -> selesai)', 200, admCheckOut.status, admCheckOut.status === 200 && admCheckOut.data?.data?.status === 'selesai');
  }

  // --- 11. ADMIN REPORTS & ROLE SECURITY ---
  // GET /api/admin/reports/monthly as Admin -> 200
  const repMonthly = await request('GET', '/api/admin/reports/monthly?month=6&year=2027', null, adminToken);
  record('11. Admin Reports', 'GET /api/admin/reports/monthly (as Admin)', 200, repMonthly.status, repMonthly.status === 200);

  // Role check: GET /api/admin/reports/monthly as Member -> MUST BE 403 Forbidden!
  const repMonthlyM = await request('GET', '/api/admin/reports/monthly?month=6&year=2027', null, member1Token);
  record('11. Admin Reports', 'GET /api/admin/reports/monthly (as Member -> 403 Forbidden)', 403, repMonthlyM.status, repMonthlyM.status === 403, repMonthlyM.data?.message);

  // GET /api/admin/reports/income as Admin -> 200
  const repIncome = await request('GET', '/api/admin/reports/income?month=6&year=2027', null, adminToken);
  record('11. Admin Reports', 'GET /api/admin/reports/income (as Admin)', 200, repIncome.status, repIncome.status === 200);

  // Role check: GET /api/admin/reports/income as Member -> MUST BE 403 Forbidden!
  const repIncomeM = await request('GET', '/api/admin/reports/income?month=6&year=2027', null, member1Token);
  record('11. Admin Reports', 'GET /api/admin/reports/income (as Member -> 403 Forbidden)', 403, repIncomeM.status, repIncomeM.status === 403, repIncomeM.data?.message);

  // --- 12. UPLOAD MEDIA & ROLE SECURITY ---
  // POST /api/upload/image as Member -> 201
  const upImageM = await uploadDummy('/api/upload/image', member1Token);
  record('12. Upload Media', 'POST /api/upload/image (as Member)', 201, upImageM.status, upImageM.status === 201);

  // POST /api/upload/image as Admin -> 201
  const upImageAdm = await uploadDummy('/api/upload/image', adminToken);
  record('12. Upload Media', 'POST /api/upload/image (as Admin)', 201, upImageAdm.status, upImageAdm.status === 201);

  // POST /api/upload/image as Anon -> 401
  const upImageAnon = await uploadDummy('/api/upload/image', null);
  record('12. Upload Media', 'POST /api/upload/image (as Anon -> 401)', 401, upImageAnon.status, upImageAnon.status === 401);

  // POST /api/upload/members as Member -> 201
  const upMemM = await uploadDummy('/api/upload/members', member1Token);
  record('12. Upload Media', 'POST /api/upload/members (as Member)', 201, upMemM.status, upMemM.status === 201);

  // POST /api/upload/spaces as Admin -> 201
  const upSpAdm = await uploadDummy('/api/upload/spaces', adminToken);
  record('12. Upload Media', 'POST /api/upload/spaces (as Admin)', 201, upSpAdm.status, upSpAdm.status === 201);

  // Role check: POST /api/upload/spaces as Member -> SHOULD BE 403 Forbidden according to brief!
  const upSpMember = await uploadDummy('/api/upload/spaces', member1Token);
  record('12. Upload Media', 'POST /api/upload/spaces (as Member -> 403 Forbidden)', 403, upSpMember.status, upSpMember.status === 403, upSpMember.data?.message || JSON.stringify(upSpMember.data));

  console.log('\n================================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  console.log('================================================================');
}

runLiveTest().catch(console.error);
