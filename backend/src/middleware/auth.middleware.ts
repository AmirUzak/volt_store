import { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE_NAME, verifyToken } from "../utils/jwt";

const getCookieToken = (cookieHeader?: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.trim().split("=");
    if (rawKey === ACCESS_COOKIE_NAME) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const cookieToken = getCookieToken(req.headers.cookie);
    const token = bearerToken || cookieToken;

    if (!token) {
      res.status(401).json({ message: "Unauthorized: missing or invalid token" });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: token is invalid or expired" });
  }
};
