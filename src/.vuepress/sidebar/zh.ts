import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/zh/": [
    "",
    "intro",
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
          icon: "star",
          link: "01-JVM-devlopment/README.md",
        },
        {
          text: "2_内存结构",
          icon: "star",
          link: "02-JVM-memory/README.md",
        },
        {
          text: "3_垃圾回收",
          icon: "star",
          link: "03-JVM-garbage-collection/README.md",
        },
        {
          text: "4_类加载与字节码技术",
          icon: "star",
          link: "04-ClassLoader-ByteCode/README.md",
        },
        {
          text: "5_细节补充",
          icon: "star",
          link: "05-JVM-detail-analyse/README.md",
        },
      ],
    },
    {
      text: "Linux常用命令",
      icon: "note",
      link: "notes/Linux.md",
    },
    {
      text: "MySQL",
      icon: "note",
      prefix: "notes/MySQL/",
      collapsible: true,
      children: [
        {
          text: "散记MySQL",
          prefix: "01-random-mysql-notes/",
          collapsible: true,
          children: [
            "01-mysql-framework",
            "02-mysql-lock",
            "03-mysql-index",
            "04-sharding-jdbc",
            "05-mysql-procedure",
            "06-mysql-skill",
          ],
        },
        {
          text: "深入理解Mysql",
          prefix: "02-deep-understand-mysql/",
          collapsible: true,
          children: [
            {
              text: "01-33",
              prefix: "01-33/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "34-63",
              prefix: "34-63/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "64-108",
              prefix: "64-108/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "109-132",
              prefix: "109-132/",
              collapsible: true,
              children: "structure",
            },
          ],
        },
      ],
    },
  ]
});
