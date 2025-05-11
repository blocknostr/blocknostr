
import { nostrService as originalNostrService } from '../service';

/**
 * Authentication-related adapter methods
 */
export class AuthAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  get publicKey() {
    return this.service.publicKey;
  }
  
  get following() {
    return this.service.following;
  }
  
  async login() {
    return this.service.login();
  }
  
  signOut() {
    return this.service.signOut();
  }
}
