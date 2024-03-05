import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { searchProPlugin } from "vuepress-plugin-search-pro";
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
  ],

  plugins: [
    //解决打包问题
    commonjs() as any, // 要放在第一行，否则不生效

    //搜索插件
    searchProPlugin({
      // 索引全部内容
      indexContent: true,
      hotReload: true,
      // 为分类和标签添加索引
      customFields: [
        {
          getter: ({ frontmatter }): string[] => <string[]>frontmatter["tag"],
          formatter: `Tag: $content`,
        },
        {
          getter: ({ frontmatter }): string[] => <string[]>frontmatter["category"],
          formatter: `Category: $content`,
        },
      ],
    }),
  ],
  shouldPrefetch: false,
});




