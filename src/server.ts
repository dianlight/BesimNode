import { app_bootstrap }  from './app.js';

try {
  const { url } = await app_bootstrap();
  console.log(`server started at ${url}`);
} catch (e) {
  console.error(e);
}
