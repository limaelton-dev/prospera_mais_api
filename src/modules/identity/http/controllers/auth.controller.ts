import { Controller, Get, Header, Req, Res } from "@nestjs/common";
import type { Request, Response } from 'express';
import { CsrfService } from "../services/csrf.service.js";
import { Public } from "../decorators/public.decorator.js";

@Controller('auth')
export class AuthController {
    constructor(private readonly csrfService: CsrfService) {}

    @Public()
    @Get('csrf')
    @Header('Cache-Control', 'no-store')
    getCsrfToken(
        @Req() request: Request,
        @Res({  passthrough: true }) response: Response
    ): { csrfToken: string } {
        return {
            csrfToken: this.csrfService.generateToken(request, response)
        }
    }
}