import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import { CsrfService } from './modules/identity/http/services/csrf.service.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const csrfService = app.get(CsrfService);

    app.setGlobalPrefix('v2');

    if (configService.get<string>('NODE_ENV') === 'production') {
        const express = app.getHttpAdapter().getInstance();
        express.set('trust proxy', 1);
    }

    app.use(helmet());
    app.use(cookieParser());

    app.enableCors({
        origin: configService.getOrThrow<string>('WEB_ORIGIN'),
        credentials: true,
    });

    app.use(csrfService.protection);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const port = configService.get<number>('PORT') ?? 3001;

    await app.listen(port);
}

await bootstrap();