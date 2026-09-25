import { Inject, Injectable } from '@nestjs/common';
import {
    SESSION_REPOSITORY,
    type SessionRepository,
} from '../ports/private/session.repository.js';

@Injectable()
export class LogoutHandler {
    constructor(
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: SessionRepository,
    ) {}

    async execute(sessionId: string): Promise<void> {
        await this.sessionRepository.deleteById(sessionId);
    }
}
