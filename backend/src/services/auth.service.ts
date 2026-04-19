import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const ALLOWED_PAYMENT_METHODS = ["card", "cash", "sbp", "paypal"] as const;

type ProfileUpdateInput = {
  phone?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  postalCode?: unknown;
  country?: unknown;
  preferredPaymentMethod?: unknown;
};

const normalizeOptionalString = (value: unknown, fieldName: string, maxLength: number): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string`);
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new HttpError(400, `${fieldName} is too long`);
  }

  return normalized;
};

const validatePaymentMethod = (value: unknown): string | null | undefined => {
  const normalized = normalizeOptionalString(value, "preferredPaymentMethod", 32);
  if (normalized === undefined || normalized === null) {
    return normalized;
  }

  const lowered = normalized.toLowerCase();
  if (!ALLOWED_PAYMENT_METHODS.includes(lowered as (typeof ALLOWED_PAYMENT_METHODS)[number])) {
    throw new HttpError(400, "preferredPaymentMethod is not supported");
  }

  return lowered;
};

const userPublicSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  phone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  postalCode: true,
  country: true,
  preferredPaymentMethod: true,
  createdAt: true
} as const;

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
      select: userPublicSelect
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
        role: user.role,
        phone: user.phone,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        postalCode: user.postalCode,
        country: user.country,
        preferredPaymentMethod: user.preferredPaymentMethod
      }
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userPublicSelect
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  static async updateMe(userId: string, input: ProfileUpdateInput) {
    const data = {
      phone: normalizeOptionalString(input.phone, "phone", 32),
      addressLine1: normalizeOptionalString(input.addressLine1, "addressLine1", 128),
      addressLine2: normalizeOptionalString(input.addressLine2, "addressLine2", 128),
      city: normalizeOptionalString(input.city, "city", 64),
      postalCode: normalizeOptionalString(input.postalCode, "postalCode", 24),
      country: normalizeOptionalString(input.country, "country", 64),
      preferredPaymentMethod: validatePaymentMethod(input.preferredPaymentMethod)
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: userPublicSelect
    });

    return user;
  }

  static async requestPasswordReset(email: string) {
    if (!email || typeof email !== "string") {
      throw new HttpError(400, "email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true
      }
    });

    if (!user) {
      return null;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: expiresAt
      }
    });

    return {
      email: user.email,
      username: user.username,
      token
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    if (!token || typeof token !== "string") {
      throw new HttpError(400, "token is required");
    }

    if (!newPassword || typeof newPassword !== "string") {
      throw new HttpError(400, "newPassword is required");
    }

    const normalizedPassword = newPassword.trim();
    if (normalizedPassword.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters long");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true
      }
    });

    if (!user) {
      throw new HttpError(400, "Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null
      }
    });
  }
}
