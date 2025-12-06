import { pipe } from 'fp-ts/function';
import { chainFirst, map, tryCatch } from 'fp-ts/TaskEither';
import { z } from 'zod';

import { getCurrentUserUseCase, loginUseCase, logoutUseCase, registerUseCase } from '~/application/use-cases';
import { dbError, EmailSchema, LanguageSchema, NameSchema, PasswordSchema } from '~/domain/types';
import { clearAuthCookies, setAuthCookies } from '~/infrastructure/auth';
import { safeHandler } from '~/presentation/trpc/errors';
import { protectedProcedure, publicProcedure, router } from '~/presentation/trpc/trpc';

const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
  nativeLanguage: LanguageSchema,
});

const LoginInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const authRouter = router({
  register: publicProcedure.input(RegisterInputSchema).mutation(
    safeHandler(({ ctx, input }) =>
      pipe(
        registerUseCase(input)(ctx.env),
        chainFirst((tokens) => tryCatch(() => setAuthCookies(tokens.accessToken, tokens.refreshToken), dbError)),
        map(() => ({ success: true }))
      )
    )
  ),

  login: publicProcedure.input(LoginInputSchema).mutation(
    safeHandler(({ ctx, input }) =>
      pipe(
        loginUseCase(input)(ctx.env),
        chainFirst((tokens) => tryCatch(() => setAuthCookies(tokens.accessToken, tokens.refreshToken), dbError)),
        map(() => ({ success: true }))
      )
    )
  ),

  logout: protectedProcedure.mutation(
    safeHandler(({ ctx }) =>
      pipe(
        logoutUseCase(ctx.refreshToken!)(ctx.env),
        chainFirst(() => tryCatch(() => clearAuthCookies(), dbError)),
        map(() => ({ success: true }))
      )
    )
  ),

  me: protectedProcedure.query(safeHandler(({ ctx }) => getCurrentUserUseCase(ctx.userId)(ctx.env))),
});
