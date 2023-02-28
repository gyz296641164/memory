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
      text: "JAVA",
      icon: "note",
      prefix: "notes/JAVA/",
      collapsible: true,
      children: [
        {
          text: "JAVA8",
          prefix: "JAVA8/",
          collapsible: true,
          children: [
            {
              text: "第一部分-基础知识",
              prefix: "第一部分-基础知识/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "第二部分-函数式数据处理",
              prefix: "第二部分-函数式数据处理/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "第三部分-高效Java8编程",
              prefix: "第三部分-高效Java8编程/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "总结",
              prefix: "总结/",
              collapsible: true,
              children: "structure",
            },
          ],
        },
      ],
    },
    {
      text: "Spring源码",
      icon: "note",
      prefix: "notes/手把手Spring源码/",
      collapsible: true, //侧边栏折叠 
      children: "structure",
    },
    {
      text: "Spring Cloud",
      icon: "note",
      prefix: "notes/Spring Cloud/",
      collapsible: true,
      children: [
        {
          text: "Spring Cloud - Hoxton.SR1(上)",
          icon: "star",
          link: "01-Spring Cloud - Hoxton.SR1.md",
        },
        {
          text: "Spring Cloud - Hoxton.SR1(下)",
          icon: "star",
          link: "02-Spring Cloud - Hoxton.SR1.md",
        },
        {
          text: "Spring Cloud Alibaba",
          icon: "star",
          link: "03-Spring Cloud Alibaba.md",
        },
      ],
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
      text: "Docker",
      icon: "note",
      prefix: "notes/Docker/",
      collapsible: true,
      children: [
        {
          text: "Docker简介 & 安装 & 常用命令",
          icon: "star",
          link: "01-docker-base1",
        },
        {
          text: "Docker镜像",
          icon: "star",
          link: "02-docker-base2",
        },
        {
          text: "本地镜像发布&容器数据卷",
          icon: "star",
          link: "03-docker-base3",
        },
        {
          text: "Docker复杂安装详说",
          icon: "star",
          link: "04-docker-high1",
        },
        {
          text: "DockerFile & 网络",
          icon: "star",
          link: "05-docker-high2",
        },
        {
          text: "Docker-compose & 可视化工具",
          icon: "star",
          link: "06-docker-high3",
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
    {
      text: "Redis",
      icon: "note",
      prefix: "notes/Redis/",
      collapsible: true,
      children: [
        {
          text: "初识Redis",
          icon: "star",
          link: "01-redis-start",
        },
        {
          text: "Redis持久化",
          icon: "star",
          link: "02-redis-persistence",
        },
        {
          text: "Redis事务",
          icon: "star",
          link: "03-redis-transaction",
        },
        {
          text: "复制",
          icon: "star",
          link: "04-redis-copy",
        },
        {
          text: "哨兵",
          icon: "star",
          link: "05-redis-sentinel",
        },
        {
          text: "缓存设计",
          icon: "star",
          link: "06-redis-cache-design",
        },
        {
          text: "Redis分布式锁",
          icon: "star",
          link: "07-redis-distributed-lock",
        },
        {
          text: "JAVA操作Redis",
          icon: "star",
          link: "08-redis-operate-byjava",
        },
        {
          text: "Redis常见面试题",
          icon: "star",
          link: "09-redis-interview",
        },
      ],
    },
  ]
});
