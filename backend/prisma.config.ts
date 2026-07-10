import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  seed: {
    execute: 'tsx prisma/seed.ts',
  },
});
