import { hopeTheme } from "vuepress-theme-hope";
import { enNavbar, zhNavbar } from "./navbar/index.js";
import { enSidebar, zhSidebar } from "./sidebar/index.js";



export default hopeTheme({
  hostname: "https://www.yznotes.cn/",

  author: {
    name: "gong_yz",
    url: "https://www.yznotes.cn/",
  },

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

    docsearch:({
      appId: "4NV8BYBQU3",
      apiKey: "98b3b31573a7ebde53a068a8b0e0ce1a",
      indexName: "yzcn",
  
      locales: {
        "/": {
          placeholder: "搜索文档",
          translations: {
            button: {
              buttonText: "搜索文档",
              buttonAriaLabel: "搜索文档",
            },
            modal: {
              searchBox: {
                resetButtonTitle: "清除查询条件",
                resetButtonAriaLabel: "清除查询条件",
                cancelButtonText: "取消",
                cancelButtonAriaLabel: "取消",
              },
              startScreen: {
                recentSearchesTitle: "搜索历史",
                noRecentSearchesText: "没有搜索历史",
                saveRecentSearchButtonTitle: "保存至搜索历史",
                removeRecentSearchButtonTitle: "从搜索历史中移除",
                favoriteSearchesTitle: "收藏",
                removeFavoriteSearchButtonTitle: "从收藏中移除",
              },
              errorScreen: {
                titleText: "无法获取结果",
                helpText: "你可能需要检查你的网络连接",
              },
              footer: {
                selectText: "选择",
                navigateText: "切换",
                closeText: "关闭",
                searchByText: "搜索提供者",
              },
              noResultsScreen: {
                noResultsText: "无法找到相关结果",
                suggestedQueryText: "你可以尝试查询",
                reportMissingResultsText: "你认为该查询应该有结果？",
                reportMissingResultsLinkText: "点击反馈",
              },
            },
          },
        },
      },
    }),


    //版权信息
    copyright: {
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



    // pwa: {
    //   favicon: "/favicon2.ico",
    //   cachePic: true,
    //   cacheHTML: true,
    //   manifest: {
    //     icons: [
    //       {
    //         src: "/assets/icon/chrome-mask-512.png",
    //         sizes: "512x512",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-mask-192.png",
    //         sizes: "192x192",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //     ],
    //   }
    // }
  },
});
