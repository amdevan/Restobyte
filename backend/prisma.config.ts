import type { Config } from '@prisma/config';

const config: Config = {
  schema: './prisma/schema.prisma',
  seed: {
    execute: 'tsx prisma/seed.ts',
  },
};

export default config;
