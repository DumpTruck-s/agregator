import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import type { RegisterDto, LoginDto } from '@delivery/shared';

export async function register(dto: RegisterDto) {
  const exists = await prisma.user.findUnique({ where: { email: dto.email } });
  if (exists) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(dto.password, 10);
  const user = await prisma.user.create({
    data: { email: dto.email, passwordHash, name: dto.name, phone: dto.phone, role: dto.role },
    select: { id: true, email: true, name: true, role: true },
  });

  return { user, token: signToken(user) };
}

export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  return { user: payload, token: signToken(payload) };
}

function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );
}
