import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";

const SALT_ROUNDS = 10;

export class AuthService {
  static async register(email: string, username: string, password: string) {
    if (!email || !username || !password) {
      throw new HttpError(400, "email, username and password are required");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new HttpError(400, "User with this email or username already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
      select: { id: true, email: true, username: true, role: true, createdAt: true }
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return { user, token };
  }

  static async login(email: string, password: string) {
    if (!email || !password) {
      throw new HttpError(400, "email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }
}
