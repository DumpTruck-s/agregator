import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { sendVerificationEmail } from '../../shared/mailer';
import type { RegisterDto, LoginDto } from '@delivery/shared';

// ─── Helpers ────────────────────────────────────────────────────────────────

function signToken(user: { id: string; email: string; name?: string; role: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name ?? '', role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );
}

async function generateCode(userId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const exp  = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await prisma.user.update({
    where: { id: userId },
    data: { verifyCode: code, verifyCodeExp: exp },
  });
  return code;
}

// ─── Endpoints ──────────────────────────────────────────────────────────────

export async function register(dto: RegisterDto) {
  const exists = await prisma.user.findUnique({ where: { email: dto.email } });

  if (exists) {
    // Unverified account — resend code
    if (!exists.emailVerified) {
      const code = await generateCode(exists.id);
      const sent = await sendVerificationEmail(exists.email, exists.name, code);
      return { needsVerification: true, email: exists.email, ...(sent ? {} : { fallbackCode: code }) };
    }
    throw new AppError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);
  const user = await prisma.user.create({
    data: {
      email: dto.email, passwordHash,
      name: dto.name, phone: dto.phone,
      role: dto.role,
      emailVerified: false,
    },
  });

  const code = await generateCode(user.id);
  const sent = await sendVerificationEmail(user.email, user.name, code);
  return { needsVerification: true, email: user.email, ...(sent ? {} : { fallbackCode: code }) };
}

export async function verifyEmail(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Пользователь не найден', 404);
  if (user.emailVerified) throw new AppError('Email уже подтверждён', 400);
  if (!user.verifyCode || user.verifyCode !== code) throw new AppError('Неверный код', 400);
  if (!user.verifyCodeExp || user.verifyCodeExp < new Date()) throw new AppError('Код истёк — запросите новый', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyCode: null, verifyCodeExp: null },
  });

  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  return { user: payload, token: signToken(payload) };
}

export async function resendCode(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Пользователь не найден', 404);
  if (user.emailVerified) throw new AppError('Email уже подтверждён', 400);

  // Rate-limit: don't resend if last code was sent < 60s ago
  if (user.verifyCodeExp) {
    const sentAt = new Date(user.verifyCodeExp.getTime() - 15 * 60 * 1000);
    if (Date.now() - sentAt.getTime() < 60_000) {
      throw new AppError('Подождите минуту перед повторной отправкой', 429);
    }
  }

  const code = await generateCode(user.id);
  const sent = await sendVerificationEmail(user.email, user.name, code);
  return { ok: true, ...(sent ? {} : { fallbackCode: code }) };
}

export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  if (user.isBlocked) throw new AppError('Аккаунт заблокирован', 403);

  if (!user.emailVerified) {
    const code = await generateCode(user.id);
    const sent = await sendVerificationEmail(user.email, user.name, code);
    throw new AppError(`EMAIL_NOT_VERIFIED${sent ? '' : `:${code}`}`, 403);
  }

  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  return { user: payload, token: signToken(payload) };
}
