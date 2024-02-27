import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { searchProPlugin } from "vuepress-plugin-search-pro";


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

  //标题层级
  extendsMarkdownOptions: (markdownOptions, app) => {
    if (markdownOptions.headers === false) return
    markdownOptions.headers ??= {}
    if (markdownOptions.headers.level) return
    markdownOptions.headers.level = [1, 2, 3, 4]
  },

  plugins: [

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
      indexOptions: {
        tokenize: (text, fieldName) =>
          fieldName === "id" ? [text] : cut(text, true),
      },
    }),
  ],
  shouldPrefetch: false,
});




