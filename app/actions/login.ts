'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Server action to handle user login
 * @param formData - The form data containing username and password
 * @returns An object with success status and message or user data
 */
export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, message: 'Username and password are required' };
  }

  try {
    const user = await prisma.loginInfo.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return { success: false, message: 'Invalid username or password' };
    }

    // In a real app, you would set a session cookie here
    return { success: true, message: 'Login successful', user: { id: user.id, username: user.username } };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
}
