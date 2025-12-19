import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters';
import { ConfigService } from '@nestjs/config';
import * as fs from "fs";
import { join } from "path";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
    }),
  );

  app.setGlobalPrefix("api");
  app.enableCors();
  createSwagger(app);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap().catch((error: never) => {
  console.error("Startup error:", error);
});



const createSwagger = (app: INestApplication) => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Ecommerce-Platform Backend API")
    .setVersion("1.0.5")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  fs.writeFileSync(
    join(__dirname, "../swagger.json"),
    JSON.stringify(document, null, 2),
  );

  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};