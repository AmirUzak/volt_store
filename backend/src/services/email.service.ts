import { Resend } from "resend";

type WelcomeEmailInput = {
  to: string;
  username: string;
};

type ProfileUpdatedEmailInput = {
  to: string;
  username: string;
  changedFields: string[];
};

type OrderItemInput = {
  name: string;
  quantity: number;
  priceAtOrder: number;
};

type OrderCreatedEmailInput = {
  to: string;
  username: string;
  orderId: string;
  totalAmount: number;
  items: OrderItemInput[];
};

type OrderStatusUpdatedEmailInput = {
  to: string;
  username: string;
  orderId: string;
  status: string;
};

type PasswordResetEmailInput = {
  to: string;
  username: string;
  token: string;
};

const APP_URL = process.env.APP_URL || "https://voltstore.app";
const EMAIL_FROM = process.env.RESEND_FROM || "VOLT Store <noreply@voltstore.app>";
const EMAIL_REPLY_TO = process.env.RESEND_REPLY_TO || "support@voltstore.app";

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const formatChangedFields = (fields: string[]) => {
  const labels: Record<string, string> = {
    phone: "Phone",
    addressLine1: "Address line 1",
    addressLine2: "Address line 2",
    city: "City",
    postalCode: "Postal code",
    country: "Country",
    preferredPaymentMethod: "Preferred payment method"
  };

  if (!fields.length) {
    return "Profile details";
  }

  return fields.map((field) => labels[field] || field).join(", ");
};

const buildHeaders = (
  messageType:
    | "welcome"
    | "profile-updated"
    | "order-created"
    | "order-status-updated"
    | "password-reset"
) => ({
  "X-Auto-Response-Suppress": "OOF, AutoReply",
  "X-VOLT-Email-Type": messageType
});

const formatMoney = (value: number) => `${value.toFixed(2)} KZT`;

const buildOrderItemsText = (items: OrderItemInput[]) =>
  items
    .map((item) => `- ${item.name} x${item.quantity} (${formatMoney(item.priceAtOrder)})`)
    .join("\n");

const buildOrderItemsHtml = (items: OrderItemInput[]) =>
  items
    .map(
      (item) =>
        `<li style="margin-bottom: 6px;">${item.name} x${item.quantity} (${formatMoney(item.priceAtOrder)})</li>`
    )
    .join("");

const ORDER_STATUS_LABELS: Record<
  string,
  { en: string; ru: string; kz: string }
> = {
  PENDING: { en: "Pending", ru: "V obrabotke", kz: "Kutilude" },
  PAID: { en: "Paid", ru: "Oplachen", kz: "Tolem aldy" },
  SHIPPED: { en: "Shipped", ru: "Otpravlen", kz: "Zhiberildi" },
  DELIVERED: { en: "Delivered", ru: "Dostavlen", kz: "Zhetkizildi" },
  CANCELLED: { en: "Cancelled", ru: "Otmenen", kz: "Kushin zhoiyldy" }
};

const getOrderStatusLabel = (status: string) => {
  const normalized = status.toUpperCase();
  return (
    ORDER_STATUS_LABELS[normalized] || {
      en: status,
      ru: status,
      kz: status
    }
  );
};

const sendEmail = async (params: {
  client: Resend;
  to: string;
  subject: string;
  text: string;
  html: string;
  messageType:
    | "welcome"
    | "profile-updated"
    | "order-created"
    | "order-status-updated"
    | "password-reset";
}) => {
  const result = await params.client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    replyTo: EMAIL_REPLY_TO,
    subject: params.subject,
    text: params.text,
    html: params.html,
    headers: buildHeaders(params.messageType),
    tags: [
      { name: "app", value: "voltstore" },
      { name: "type", value: params.messageType }
    ]
  });

  console.info(
    JSON.stringify({
      event: "email_sent",
      type: params.messageType,
      to: params.to,
      provider: "resend",
      id: result.data?.id || null
    })
  );
};

const logEmailFailure = (messageType: string, to: string, error: unknown) => {
  console.error(
    JSON.stringify({
      event: "email_failed",
      type: messageType,
      to,
      provider: "resend",
      error: error instanceof Error ? error.message : "unknown"
    })
  );
};

export class EmailService {
  static async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    const client = getResendClient();
    if (!client) {
      return;
    }

    const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(input.token)}`;

    try {
      await sendEmail({
        client,
        to: input.to,
        subject: "Password reset / Sbros parolya / Qupty sozdi qalpyna keltiru",
        text: `EN\nHi, ${input.username}\nUse this link to reset your password: ${resetUrl}\nThis link will expire in 1 hour.\n\nRU\nPrivet, ${input.username}\nIspolzuyte etu ssylku, chtoby sbrosit parol: ${resetUrl}\nSsylka deystvuet 1 chas.\n\nKZ\nSalem, ${input.username}\nQupty sozdı qalpyna keltiru ushin silteme: ${resetUrl}\nSilteme 1 sagat is-teydi.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <h2 style="margin-bottom: 12px;">Reset your password</h2>
          <p style="line-height: 1.6;">Hi, ${input.username}. Use the button below to reset your password.</p>
          <a href="${resetUrl}" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Reset password</a>
          <p style="line-height: 1.6; margin-top: 12px;">This link expires in 1 hour.</p>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Sbros parolya</h3>
          <p style="line-height: 1.6;">Privet, ${input.username}. Ispolzuyte knopku nizhe, chtoby sbrosit parol.</p>
          <a href="${resetUrl}" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Sbrosit parol</a>
          <p style="line-height: 1.6; margin-top: 12px;">Ssylka deystvuet 1 chas.</p>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Qupty sozdi qalpyna keltiru</h3>
          <p style="line-height: 1.6;">Salem, ${input.username}. Tomendegi batyrmany basyp qupty sozdi zhangartynyz.</p>
          <a href="${resetUrl}" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Qupty sozdi zhangartu</a>
          <p style="line-height: 1.6; margin-top: 12px;">Silteme 1 sagat is-teydi.</p>
        </div>
        `,
        messageType: "password-reset"
      });
    } catch (error) {
      logEmailFailure("password-reset", input.to, error);
      throw error;
    }
  }

  static async sendWelcomeEmail(input: WelcomeEmailInput) {
    const client = getResendClient();
    if (!client) {
      return;
    }

    try {
      await sendEmail({
        client,
        to: input.to,
        subject: "Welcome to VOLT Store / Dobro pozhalovat v VOLT Store / VOLT Store-ge khosh keldiniz",
        text: `EN\nWelcome, ${input.username}!\nThanks for registering at VOLT Store. Your account is ready.\nOpen your profile: ${APP_URL}/profile\n\nRU\nPrivet, ${input.username}!\nSpasibo za registratsiyu v VOLT Store. Vash akkaunt gotov.\nOtkryt profil: ${APP_URL}/profile\n\nKZ\nSalem, ${input.username}!\nVOLT Store-de tirkelgeniniz ushin rahmet. Akkountynyz daiyr.\nProfilge otu: ${APP_URL}/profile`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <h2 style="margin-bottom: 12px;">Welcome, ${input.username}!</h2>
          <p style="line-height: 1.6;">Thanks for registering at VOLT Store. Your account is ready.</p>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Open profile</a>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Privet, ${input.username}!</h3>
          <p style="line-height: 1.6;">Spasibo za registratsiyu v VOLT Store. Vash akkaunt gotov.</p>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Otkryt profil</a>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Salem, ${input.username}!</h3>
          <p style="line-height: 1.6;">VOLT Store-de tirkelgeniniz ushin rahmet. Akkountynyz daiyr.</p>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Profilge otu</a>
        </div>
      `,
        messageType: "welcome"
      });
    } catch (error) {
      logEmailFailure("welcome", input.to, error);
      throw error;
    }
  }

  static async sendProfileUpdatedEmail(input: ProfileUpdatedEmailInput) {
    const client = getResendClient();
    if (!client) {
      return;
    }

    const changed = formatChangedFields(input.changedFields);

    try {
      await sendEmail({
        client,
        to: input.to,
        subject: "Your VOLT profile was updated / Profil VOLT obnovlen / VOLT profiliniz zhanartyldy",
        text: `EN\nHi, ${input.username}\nWe detected changes to your profile: ${changed}.\nReview profile: ${APP_URL}/profile\n\nRU\nPrivet, ${input.username}\nMy zafiksirovali izmeneniya v profile: ${changed}.\nProverit profil: ${APP_URL}/profile\n\nKZ\nSalem, ${input.username}\nProfilinizde ozgerister anyktaldy: ${changed}.\nProfil tekseru: ${APP_URL}/profile`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <h2 style="margin-bottom: 12px;">Hi, ${input.username}</h2>
          <p style="line-height: 1.6;">We detected changes to your profile:</p>
          <p style="line-height: 1.6;"><strong>${changed}</strong></p>
          <p style="line-height: 1.6;">If you made this change, no action is needed.</p>
          <p style="line-height: 1.6;">If this was not you, please secure your account immediately.</p>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Review profile</a>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Privet, ${input.username}</h3>
          <p style="line-height: 1.6;">My zafiksirovali izmeneniya v profile: <strong>${changed}</strong>.</p>
          <p style="line-height: 1.6;">Esli eto ne vy, srochno zashchitite akkaunt.</p>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Proverit profil</a>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Salem, ${input.username}</h3>
          <p style="line-height: 1.6;">Profilinizde ozgerister anyktaldy: <strong>${changed}</strong>.</p>
          <p style="line-height: 1.6;">Eger bul siz emes bolsanyz, akkauntty korghanyz.</p>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Profil tekseru</a>
        </div>
      `,
        messageType: "profile-updated"
      });
    } catch (error) {
      logEmailFailure("profile-updated", input.to, error);
      throw error;
    }
  }

  static async sendOrderCreatedEmail(input: OrderCreatedEmailInput) {
    const client = getResendClient();
    if (!client) {
      return;
    }

    const itemsText = buildOrderItemsText(input.items);
    const itemsHtml = buildOrderItemsHtml(input.items);

    try {
      await sendEmail({
        client,
        to: input.to,
        subject: "Order confirmed / Zakaz podtverzhden / Taprys rastaldy",
        text: `EN\nHi, ${input.username}\nYour order ${input.orderId} is confirmed.\nTotal: ${formatMoney(input.totalAmount)}\nItems:\n${itemsText}\n\nRU\nPrivet, ${input.username}\nVash zakaz ${input.orderId} podtverzhden.\nSumma: ${formatMoney(input.totalAmount)}\nTovary:\n${itemsText}\n\nKZ\nSalem, ${input.username}\n${input.orderId} taprysy rastaldy.\nSomasy: ${formatMoney(input.totalAmount)}\nTauarlar:\n${itemsText}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <h2 style="margin-bottom: 12px;">Order confirmed</h2>
          <p style="line-height: 1.6;">Hi, ${input.username}. Your order <strong>${input.orderId}</strong> is confirmed.</p>
          <p style="line-height: 1.6;">Total: <strong>${formatMoney(input.totalAmount)}</strong></p>
          <ul style="padding-left: 18px; line-height: 1.6;">${itemsHtml}</ul>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Zakaz podtverzhden</h3>
          <p style="line-height: 1.6;">Privet, ${input.username}. Vash zakaz <strong>${input.orderId}</strong> podtverzhden.</p>
          <p style="line-height: 1.6;">Summa: <strong>${formatMoney(input.totalAmount)}</strong></p>
          <ul style="padding-left: 18px; line-height: 1.6;">${itemsHtml}</ul>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Taprys rastaldy</h3>
          <p style="line-height: 1.6;">Salem, ${input.username}. <strong>${input.orderId}</strong> taprysy rastaldy.</p>
          <p style="line-height: 1.6;">Somasy: <strong>${formatMoney(input.totalAmount)}</strong></p>
          <ul style="padding-left: 18px; line-height: 1.6;">${itemsHtml}</ul>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">View orders</a>
        </div>
        `,
        messageType: "order-created"
      });
    } catch (error) {
      logEmailFailure("order-created", input.to, error);
      throw error;
    }
  }

  static async sendOrderStatusUpdatedEmail(input: OrderStatusUpdatedEmailInput) {
    const client = getResendClient();
    if (!client) {
      return;
    }

    const statusLabel = getOrderStatusLabel(input.status);

    try {
      await sendEmail({
        client,
        to: input.to,
        subject: "Order status updated / Status zakaza obnovlen / Taprys statusy zhanartyldy",
        text: `EN\nHi, ${input.username}\nYour order ${input.orderId} status is now ${statusLabel.en}.\n\nRU\nPrivet, ${input.username}\nStatus vashego zakaza ${input.orderId} teper: ${statusLabel.ru}.\n\nKZ\nSalem, ${input.username}\n${input.orderId} taprysynyn statusy: ${statusLabel.kz}.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <h2 style="margin-bottom: 12px;">Order status updated</h2>
          <p style="line-height: 1.6;">Hi, ${input.username}. Your order <strong>${input.orderId}</strong> status is now <strong>${statusLabel.en}</strong>.</p>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Status zakaza obnovlen</h3>
          <p style="line-height: 1.6;">Privet, ${input.username}. Status vashego zakaza <strong>${input.orderId}</strong> teper: <strong>${statusLabel.ru}</strong>.</p>
          <hr style="margin: 18px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <h3 style="margin-bottom: 8px;">Taprys statusy zhanartyldy</h3>
          <p style="line-height: 1.6;">Salem, ${input.username}. <strong>${input.orderId}</strong> taprysynyn statusy: <strong>${statusLabel.kz}</strong>.</p>
          <a href="${APP_URL}/profile" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">Track order</a>
        </div>
        `,
        messageType: "order-status-updated"
      });
    } catch (error) {
      logEmailFailure("order-status-updated", input.to, error);
      throw error;
    }
  }
}
