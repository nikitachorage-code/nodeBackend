import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    configureApp(app, { swagger: true });
    await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
//# sourceMappingURL=main.js.map