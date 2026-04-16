import prisma from '../utils/prisma.js';
import * as bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';

export class AuthService {
  async register(email: string, username: string, password: string) {
    // Проверка существования
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) throw new Error('Email or username already exists');

    // Хеш пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    // Создание пустой корзины
    await prisma.cart.create({
      data: { userId: user.id },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async getUser(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });
  }
}