import {
  Controller
} from '@nestjs/common';

import { CredentialsService } from './services/credentials.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentialsService: CredentialsService,
  ) {}
}
