import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    app.use(helmet());
    app.enableCors({
        origin: config.get('CORS_ORIGIN', { infer: true }).split(','),
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableShutdownHooks();
    if (config.get('NODE_ENV', { infer: true }) !== 'production') {
        const document = SwaggerModule.createDocument(app, new DocumentBuilder()
            .setTitle('Certification Tracker API')
            .setVersion('0.1')
            .addBearerAuth()
            .build());
        SwaggerModule.setup('docs', app, document);
    }
    await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
//# sourceMappingURL=main.js.map