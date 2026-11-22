export type AuthMode = 'guest' | 'authenticated';
export type PortfolioDataSource = 'cloud' | 'local';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'user' | 'owner';
  canViewCloudPortfolio: boolean;
}

export interface ConnectedIdentity {
  identityId: string;
  provider: string;
  email: string | null;
  createdAt: string | null;
}

export interface AuthMeResponse {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  role: string;
  providers: string[];
  canViewCloudPortfolio: boolean;
  portfolioSource: 'google_sheets' | 'local' | string;
}

export interface AuthActionResult {
  ok: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
  linkedGoogle?: boolean;
}
