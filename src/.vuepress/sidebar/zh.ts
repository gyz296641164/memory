import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/zh/": [
    "",
    {
      text: "如何使用",
      icon: "creative",
      prefix: "demo/",
      link: "demo/",
      collapsible: true, //侧边栏折叠 
      children: "structure",
    },
    {
      text: "文章",
      icon: "note",
      prefix: "posts/",
      collapsible: true, //侧边栏折叠
      children: "structure",
    },
    "intro",
    "slides",
    {
      text: "Spring源码",
      icon: "note",
      prefix: "notes/手把手Spring源码/",
      collapsible: true, //侧边栏折叠 
      children: "structure",
    },
  ],
});
