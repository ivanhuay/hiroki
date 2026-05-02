import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Hiroki',
  description: 'CRUD engine with pluggable adapters — expose any model as a REST API in seconds.',
  base: '/hiroki/',
  outDir: '../docs',
  cleanUrls: true,
  srcExclude: ['docs/**', 'v0.2.9/**'],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/hiroki' },
      { text: 'Adapters', link: '/adapters/overview' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Why Hiroki', link: '/guide/why-hiroki' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Hooks & Middleware', link: '/guide/hooks-middleware' },
          { text: 'Security', link: '/guide/security' },
          { text: 'Logger Integrations', link: '/guide/loggers' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'hiroki instance', link: '/api/hiroki' },
          { text: 'ControllerConfig', link: '/api/controller-config' },
          { text: 'Query params', link: '/api/query-params' },
          { text: 'Errors', link: '/api/errors' },
        ],
      },
      {
        text: 'Adapters',
        items: [
          { text: 'Overview', link: '/adapters/overview' },
          { text: 'MongooseAdapter', link: '/adapters/mongoose' },
          { text: 'MemoryAdapter', link: '/adapters/memory' },
          { text: 'DrizzleAdapter', link: '/adapters/drizzle' },
          { text: 'SequelizeAdapter', link: '/adapters/sequelize' },
          { text: 'Custom Adapter', link: '/adapters/custom' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ivanhuay/hiroki' },
    ],
    footer: {
      message: 'Released under the MIT License.',
    },
  },
});
