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
    {
      text: "JVM",
      icon: "note",
      prefix: "notes/JVM/",
      collapsible: true,
      children: [
        {
          text: "1_JVM发展史和Java体系结构",
          prefix: "01-JVM-devlopment/",
          icon: "star",
          collapsible: true,
          children: "structure",
        },
        {
          text: "2_内存结构",
          prefix: "02-JVM-memory/",
          icon: "star",
          collapsible: true,
          children: "structure",
        },
        {
          text: "3_垃圾回收",
          prefix: "03-JVM-garbage-collection/",
          icon: "star",
          collapsible: true,
          children: "structure",
        },
        {
          text: "4_类加载与字节码技术",
          prefix: "04-ClassLoader-ByteCode/",
          icon: "star",
          collapsible: true,
          children: "structure",
        },
        {
          text: "5_细节补充",
          prefix: "05-JVM-detail-analyse/",
          icon: "star",
          collapsible: true,
          children: "structure",
        },
      ],
    },
  ]
});
