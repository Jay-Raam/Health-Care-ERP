import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { UserModel } from './modules/auth/schema.js';

async function test() {
  await connectDatabase();
  try {
    const user = await UserModel.findOne({ email: 'jayasriraam27@gmail.com' });
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:');
    console.log('ID:', user._id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('isVerified:', user.isVerified);
    console.log('passwordHash in DB:', user.passwordHash);

    const testPassword = 'Password123!';
    const isMatch = bcrypt.compareSync(testPassword, user.passwordHash);
    console.log('Comparison with "Password123!":', isMatch);

    // Let's generate a fresh hash and update the DB to make absolutely sure
    const newHash = bcrypt.hashSync(testPassword, 10);
    user.passwordHash = newHash;
    user.isVerified = true;
    await user.save();
    console.log('Updated user password hash successfully.');

    const isMatchPost = bcrypt.compareSync(testPassword, user.passwordHash);
    console.log('Comparison post-update:', isMatchPost);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
}

test();
