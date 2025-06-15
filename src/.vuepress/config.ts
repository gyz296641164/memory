import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { docsearchPlugin } from '@vuepress/plugin-docsearch'
import { photoSwipePlugin } from '@vuepress/plugin-photo-swipe'
import { viteBundler } from '@vuepress/bundler-vite'
import commonjs from '@rollup/plugin-commonjs';


export default defineUserConfig({

  base: '/',

  locales: {
    "/": {
      lang: "zh-CN",
      title: "Memory",
      description: "vuepress-theme-hope 的博客演示",
    },
  },

  bundler: viteBundler({
    viteOptions: {},
    vuePluginOptions: {},
  }),

  // 主题
  theme,

  port: 8099, //自定义项目启动端口号  

  head: [
    // 添加百度统计
    [
      'script', {}, `
        var _hmt = _hmt || [];
        (function() {
          var hm = document.createElement("script");
          hm.src = "https://hm.baidu.com/hm.js?6cb4b3bacbe228f6c0c1476ee3382b64";
          var s = document.getElementsByTagName("script")[0]; 
          s.parentNode.insertBefore(hm, s);
        })();
        `
    ],

    //SEO优化：供百度等收录
    ["meta", { name: "robots", content: "all" }],
    ["meta", { name: "author", content: "gong_yz" }],

    //禁用浏览器缓存
    [
      "meta",
      {
        "http-equiv": "Cache-Control",
        content: "no-cache, no-store, must-revalidate",
      },
    ],
    ["meta", { "http-equiv": "Pragma", content: "no-cache" }],
    ["meta", { "http-equiv": "Expires", content: "0" }],

    //关键词被搜索
    [
      "meta",
      {
        name: "keywords",
        content:
          "JavaSE, 并发编程, JVM, MySQL, Spring源码, Redis, MyBatis, 谷粒商城",
      },
    ],
    [
      "meta",
      {
        name: "description",
        content:
          "Memory's Notes：不积跬步，无以至千里；不积小流，无以成江海。",
      },
    ],
  ],

  plugins: [
    //解决打包问题
    commonjs() as any, // 要放在第一行，否则不生效

    //搜索插件
    // docsearchPlugin({
    //   appId: '4NV8BYBQU3',
    //   apiKey: '98b3b31573a7ebde53a068a8b0e0ce1a',
    //   indexName: 'yzcn',
    //   locales: {
    //     '/': {
    //       placeholder: '搜索文档',
    //       translations: {
    //         button: {
    //           buttonText: '搜索文档',
    //         },
    //       },
    //     },
    //     '/zh/': {
    //       placeholder: '搜索文档',
    //       translations: {
    //         button: {
    //           buttonText: '搜索文档',
    //         },
    //       },
    //     },
    //   },
    // }),

  ],
  shouldPrefetch: false,
});




