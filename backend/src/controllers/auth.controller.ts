import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { EmailService } from "../services/email.service";
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
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const resetData = await AuthService.requestPasswordReset(email);

      if (resetData) {
        void EmailService.sendPasswordResetEmail({
          to: resetData.email,
          username: resetData.username,
          token: resetData.token
        }).catch((error) => {
          console.error("[email] password_reset_send_failed", {
            email: resetData.email,
            error: error instanceof Error ? error.message : "unknown"
          });
        });
      }

      res.status(200).json({
        message: "If an account with this email exists, a reset link has been sent"
      });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { email, username, password } = req.body;
      const result = await AuthService.register(email, username, password);

      // Email delivery must not break auth flow.
      void EmailService.sendWelcomeEmail({
        to: result.user.email,
        username: result.user.username
      }).catch((error) => {
        console.error("[email] welcome_send_failed", {
          email: result.user.email,
          error: error instanceof Error ? error.message : "unknown"
        });
      });

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

      // Notify user about profile changes for security awareness.
      void EmailService.sendProfileUpdatedEmail({
        to: user.email,
        username: user.username,
        changedFields: Object.keys(req.body ?? {}).filter((key) =>
          [
            "phone",
            "addressLine1",
            "addressLine2",
            "city",
            "postalCode",
            "country",
            "preferredPaymentMethod"
          ].includes(key)
        )
      }).catch((error) => {
        console.error("[email] profile_update_send_failed", {
          email: user.email,
          error: error instanceof Error ? error.message : "unknown"
        });
      });

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
