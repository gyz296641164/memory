import { hopeTheme } from "vuepress-theme-hope";
import { enNavbar, zhNavbar } from "./navbar/index.js";
import { enSidebar, zhSidebar } from "./sidebar/index.js";


export default hopeTheme({
  hostname: "https://www.yznotes.cn/",

  author: {
    name: "gong_yz",
    url: "https://www.yznotes.cn/",
  },

  iconAssets: "iconfont",

  logo: "/logo2.svg",

  repo: "https://github.com/gyz296641164/memory",

  docsDir: "docs",

  blog: {
    medias: {
      GitHub: "https://github.com/gyz296641164/memory",
    },
  },

  locales: {
    /**
      * Chinese locale config
      */
    "/": {
      // navbar
      navbar: zhNavbar,

      // sidebar
      sidebar: zhSidebar,

      footer: "默认页脚",

      displayFooter: true,

      blog: {
        description: "一个后端开发者",
        intro: "/zh/intro.html",
      },

      // page meta
      // metaLocales: {
      //   editLink: "在 GitHub 上编辑此页",
      // },
    },

    "/en/": {
      // navbar
      navbar: enNavbar,

      // sidebar
      sidebar: enSidebar,

      footer: "Default footer",

      displayFooter: true,

      blog: {
        description: "A FrontEnd programmer",
        intro: "/intro.html",
      },

      metaLocales: {
        editLink: "Edit this page on GitHub",
      },
    },

  },

  fullscreen: true, //全屏按钮

  //文章加密
  encrypt: {
    config: {
      "/demo/encrypt.html": ["1234"],
      "/zh/demo/encrypt.html": ["1234"],
      "/zh/notes/MySQL/02-deep-understand-mysql/": ["Gyz111111@"],
      "/zh/notes/Spring/01-spring-source-code-deeply/": ["Gyz111111@"],
    },
  },

  plugins: {
    blog: true,

    //版权信息
    copyright:{
      author: "gong_yz",
      license: "MIT",
      global: true,
    },

    //评论插件
    comment: {
      provider: "Giscus", //评论插件
      repo: "gyz296641164/NotesGiscus", //远程仓库
      repoId: "R_kgDOLY-oVA", //对应自己的仓库Id
      category: "Announcements",
      categoryId: "DIC_kwDOLY-oVM4Cdk7T" //对应自己的分类Id
    },
    
    photoSwipe: true,

    // all features are enabled for demo, only preserve features you need here
    mdEnhance: {
      align: true,
      attrs: true,
      chart: true,
      codetabs: true,
      container: true,
      demo: true,
      echarts: true,
      figure: true,
      flowchart: true,
      gfm: true,
      imgLazyload: true,
      imgSize: true,
      include: true,
      katex: true,
      mark: true,
      mermaid: true,
      playground: {
        presets: ["ts", "vue"],
      },
      presentation: {
        plugins: ["highlight", "math", "search", "notes", "zoom"],
      },
      stylize: [
        {
          matcher: "Recommended",
          replacer: ({ tag }) => {
            if (tag === "em")
              return {
                tag: "Badge",
                attrs: { type: "tip" },
                content: "Recommended",
              };
          },
        },
      ],
      sub: true,
      sup: true,
      tabs: true,
      vPre: true,
      vuePlayground: true,
    },
    pwa: {
      favicon: "/favicon2.ico",
      cachePic: true,
      cacheHTML: true,
      manifest: {
        icons: [
          {
            src: "/assets/icon/chrome-mask-512.png",
            sizes: "512x512",
            purpose: "maskable",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-mask-192.png",
            sizes: "192x192",
            purpose: "maskable",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      }
    }
  },
});
