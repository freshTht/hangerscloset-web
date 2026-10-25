export interface IAccessControlService {
  checkIsAuthorized(email: string | null): Promise<boolean>;
}
