import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './shared/logger/logger.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const loggerService = app.get(LoggerService);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useLogger(loggerService);

  const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'JWT_SECRET',
  ];
  for (const envVar of requiredEnvVars) {
    if (!configService.get(envVar)) {
      logger.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Produtor Rural API')
    .setDescription('API para gestão de produtores rurais e fazendas')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Swagger UI available at: ${await app.getUrl()}/api`);
}

bootstrap().catch(err => {
  console.error('Application bootstrap failed:', err);
  process.exit(1);
});
