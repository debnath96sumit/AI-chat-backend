import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [configService.getOrThrow<string>("FRONTEND_URL")], // allowed origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // allow cookies or Authorization headers
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.setGlobalPrefix('/api');
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({
    type: VersioningType.URI,
  });
  if (configService.getOrThrow('NODE_ENV') === 'development') {
    const createConfig = (title: string, description: string) => {
      return new DocumentBuilder()
        .setOpenAPIVersion('3.1.0')
        .addBearerAuth()
        .setTitle(title)
        .setDescription(description)
        .setVersion('1.0')
        .addTag('Auth')
        .build();
    };

    const configAdmin = createConfig(
      'Admin Panel API',
      `<div>API endpoints for <b>Admin Panel</b> API. </div>  <hr/>
            <a href="/apidoc/v1/user"> <b>User Panel </b> </a> `,
    );
    const configApi = createConfig(
      'User Panel API',
      `<div>API endpoints for <b>User Panel</b> API. </div>  <hr/>
            <a href="/apidoc/v1/admin"> <b>Admin Panel </b> </a> `,
    );

    const documentAdmin = SwaggerModule.createDocument(app, configAdmin);
    const documentApi = SwaggerModule.createDocument(app, configApi);

    // Admin APIDoc URL
    SwaggerModule.setup(
      'apidoc/v1/admin',
      app,
      {
        ...documentAdmin,
        paths: Object.fromEntries(
          Object.entries(documentAdmin.paths).filter(([key]) => key.includes('admin')),
        ),
      },
      {
        swaggerOptions: {
          defaultModelsExpandDepth: -1, // Hides the Schemas section
        },
      },
    );
    // User APIDoc URL
    SwaggerModule.setup(
      'apidoc/v1/user',
      app,
      {
        ...documentApi,
        paths: Object.fromEntries(
          Object.entries(documentAdmin.paths).filter(([key]) => !key.includes('admin')),
        ),
      },
      {
        swaggerOptions: {
          defaultModelsExpandDepth: -1, // Hides the Schemas section
        },
      },
    );
  }
  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Application is running on port http://localhost:${process.env.PORT ?? 3000}`);
    console.log(`Admin Panel API: http://localhost:${process.env.PORT ?? 3000}/apidoc/v1/admin`);
    console.log(`User Panel API: http://localhost:${process.env.PORT ?? 3000}/apidoc/v1/user`);
  });
}
bootstrap().catch((err) => {
  console.error('Failed to start the application:', err);
});
