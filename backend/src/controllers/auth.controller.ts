import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { HttpError } from "../utils/httpError";
import { ACCESS_COOKIE_NAME } from "../utils/jwt";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: COOKIE_MAX_AGE_MS,
  path: "/"
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, username, password } = req.body;
      const result = await AuthService.register(email, username, password);
      res.cookie(ACCESS_COOKIE_NAME, result.token, getCookieOptions());
      res.status(201).json({ user: result.user });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.cookie(ACCESS_COOKIE_NAME, result.token, getCookieOptions());
      res.status(200).json({ user: result.user });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user = await AuthService.getMe(req.user.userId);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async updateMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await AuthService.updateMe(req.user.userId, req.body);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie(ACCESS_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    res.status(200).json({ message: "Logged out" });
  }
}
