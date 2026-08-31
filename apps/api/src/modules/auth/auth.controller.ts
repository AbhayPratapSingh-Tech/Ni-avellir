import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.register(request.body);
    response.status(201).json({ data: result });
  };

  checkRegistration = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.checkRegistration(request.body);
    response.json({ data: result });
  };

  login = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.login(request.body);
    response.json({ data: result });
  };

  sendOtp = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.sendOtp(request.body);
    response.json({ data: result });
  };

  verifyOtp = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.verifyOtp(request.body);
    response.json({ data: result });
  };

  refresh = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.refresh(request.body.refreshToken);
    response.json({ data: result });
  };

  logout = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.logout(request.body.refreshToken);
    response.json({ data: result });
  };

  me = async (request: AuthenticatedRequest, response: Response) => {
    const user = await this.service.me(request.userId!);
    response.json({ data: { user } });
  };

  updateProfile = async (request: AuthenticatedRequest, response: Response) => {
    const user = await this.service.updateProfile(request.userId!, request.body);
    response.json({ data: { user } });
  };

  forgotPassword = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.forgotPassword(request.body.email);
    response.json({ data: result });
  };

  resetPassword = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.resetPassword(request.body);
    response.json({ data: result });
  };

  changePassword = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.changePassword(
      request.userId!,
      request.body.currentPassword,
      request.body.newPassword,
    );
    response.json({ data: result });
  };

  listSessions = async (request: AuthenticatedRequest, response: Response) => {
    const sessions = await this.service.listSessions(request.userId!);
    response.json({ data: { sessions } });
  };

  revokeSession = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.revokeSession(
      request.userId!,
      request.params.sessionId as string,
    );
    response.json({ data: result });
  };

  sendVerifyEmail = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.sendEmailVerification(request.userId!);
    response.json({ data: result });
  };

  resendVerifyEmail = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.sendEmailVerificationByEmail(request.body.email);
    response.json({ data: result });
  };

  verifyEmail = async (request: AuthenticatedRequest, response: Response) => {
    const email = (request.body?.email ?? request.query.email) as string;
    const code = (request.body?.code ?? request.query.code) as string | undefined;
    const token = (request.body?.token ?? request.query.token) as string | undefined;
    const result = await this.service.verifyEmail({ email, code, token });
    if (request.method === 'GET') {
      response
        .type('html')
        .send(
          `<html><body style="font-family:sans-serif;padding:2rem"><h1>Email verified</h1><p>You can return to the Niðavellir app.</p></body></html>`,
        );
      return;
    }
    response.json({ data: result });
  };
}
