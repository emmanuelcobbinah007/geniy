require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
if (process.env.DATABASE_URL) {
    console.log('Length:', process.env.DATABASE_URL.length);
    console.log('Starts with:', process.env.DATABASE_URL.substring(0, 10));
}
