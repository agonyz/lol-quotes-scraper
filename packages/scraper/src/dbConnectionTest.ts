import { pool } from './db';

const testDbConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT 1');
    if (result && result.rowCount && result.rowCount > 0) {
      console.log('Database connection successful!');
    } else {
      console.log('Database connection failed!');
    }
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    client.release();
  }
};

const runTest = async () => {
  try {
    await testDbConnection();
    console.log('Test completed!');
  } catch (error) {
    console.error('Test failed!', error);
  }
};

runTest();
