const request = require('supertest');
const app = require('../index'); 
const { sequelize } = require('../models');

const TEST_SUBJECT_NAME = `Test_Subject_${Date.now()}`;
let subjectId;
let authToken; // 👈 Store the token here

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Aiven DB');

    // 1. Create a Unique Test User
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const authRes = await request(app)
        .post('/api/auth/register')
        .send({
            username: 'Test User',
            email: uniqueEmail,
            password: 'password123'
        });
    
    // 2. Save the Token for future requests
    authToken = authRes.body.token;

    if (!authToken) {
        // Fallback: If register doesn't return token automatically, try login
        const loginRes = await request(app).post('/api/auth/login').send({
            email: uniqueEmail,
            password: 'password123'
        });
        authToken = loginRes.body.token;
    }

    console.log('🔑 Got Auth Token for Testing');

  } catch (error) {
    console.error('❌ Setup Failed:', error);
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe('Subjects API Integration Test', () => {

  // TEST 1: CREATE (With Auth Header)
  it('should create a new subject', async () => {
    const res = await request(app)
      .post('/api/content/subjects')
      .set('Authorization', `Bearer ${authToken}`) // 👈 Add Token
      .send({ title: TEST_SUBJECT_NAME });

    // Debugging: If it fails, print why
    if (res.statusCode !== 200) console.log('Create Error:', res.body);

    expect(res.statusCode).toEqual(200);
    expect(res.body.title).toBe(TEST_SUBJECT_NAME);
    subjectId = res.body.id;
  });

  // TEST 2: PREVENT DUPLICATES
  it('should not allow duplicate subject titles', async () => {
    const res = await request(app)
      .post('/api/content/subjects')
      .set('Authorization', `Bearer ${authToken}`) // 👈 Add Token
      .send({ title: TEST_SUBJECT_NAME });

    if (res.statusCode === 200) {
        expect(res.body.created).toBe(false);
    } else {
        expect(res.statusCode).toBe(400);
    }
  });

  // TEST 3: READ
  it('should list all subjects including the new one', async () => {
    const res = await request(app)
      .get('/api/content/subjects')
      .set('Authorization', `Bearer ${authToken}`); // 👈 Add Token
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    const found = res.body.find(s => s.id === subjectId);
    expect(found).toBeTruthy();
  });

  // TEST 4: DELETE
  it('should delete the test subject', async () => {
    const res = await request(app)
      .delete(`/api/content/subjects/${subjectId}`)
      .set('Authorization', `Bearer ${authToken}`); // 👈 Add Token
      
    expect(res.statusCode).toEqual(200);
    
    // Double check
    const check = await request(app)
        .get('/api/content/subjects')
        .set('Authorization', `Bearer ${authToken}`);
        
    const found = check.body.find(s => s.id === subjectId);
    expect(found).toBeUndefined();
  });

});