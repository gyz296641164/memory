import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/zh/": [
    // "", //侧边栏“首页”
    "intro",
    {
      text: "如何使用",
      icon: "/icon/use.svg",
      prefix: "demo/",
      link: "demo/",
      collapsible: true, //侧边栏折叠 
      children: "structure",
    },
    // {
    //   text: "文章",
    //   icon: "note",
    //   prefix: "posts/",
    //   collapsible: true, //侧边栏折叠
    //   children: "structure",
    // },
    // "slides", //幻灯片页
    {
      text: "JAVA",
      icon: "/icon/java.svg",
      prefix: "notes/JAVA/",
      collapsible: true,
      children: [
        {
          text: "JAVASE",
          prefix: "JAVASE/",
          collapsible: true,
          children: "structure",
        },
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
              icon: "star",
              link: "总结/README.md" 

            },
          ],
        },
        {
          text: "JAVA集合",
          icon: "star",
          prefix: "JAVA_Collection/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "JAVA基础面试题",
          icon: "star",
          prefix: "Interview/",
          collapsible: true,
          children: "structure",
        },
      ],
    },

    {
      text: "基础",
      icon: "/icon/base.svg",
      prefix: "notes/BASE/",
      collapsible: true,
      children: [
        {
          text: "Servlet",
          prefix: "Servlet/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "过滤器与监听器",
          prefix: "FilterAndListener/",
          collapsible: true,
          children: "structure",
        },
      ]
    },

    {
      text: "JVM",
      icon: "/icon/jvm.svg",
      prefix: "notes/JVM/",
      collapsible: true,
      children: [
        {
          text: "1_JVM发展史和Java体系结构",
          icon: "star",
          link: "01-JVM-devlopment/README.md", //后缀.md不写也可，默认识别
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
        {
          text: "JVM面试题",
          icon: "star",
          prefix: "06_JVM面试题/",
          collapsible: true,
          children: "structure",
        },
      ],
    },
    {
      text: "Docker",
      icon: "/icon/docker.svg",
      prefix: "notes/Docker/",
      collapsible: true,
      children: [
        {
          text: "1_Docker简介 & 安装 & 常用命令",
          icon: "star",
          link: "01-docker-base1",
        },
        {
          text: "2_Docker镜像",
          icon: "star",
          link: "02-docker-base2",
        },
        {
          text: "3_本地镜像发布&容器数据卷",
          icon: "star",
          link: "03-docker-base3",
        },
        {
          text: "4_Docker复杂安装详说",
          icon: "star",
          link: "04-docker-high1",
        },
        {
          text: "5_DockerFile & 网络",
          icon: "star",
          link: "05-docker-high2",
        },
        {
          text: "6_Docker-compose & 可视化工具",
          icon: "star",
          link: "06-docker-high3",
        },
      ],
    },
    {
      text: "Linux常用命令",
      icon: "/icon/linux.svg",
      link: "notes/Linux.md",
    },
    {
      text: "MySQL",
      icon: "/icon/mysql.svg",
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
              text: "第一部分01-33",
              prefix: "01-33/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "第二部分34-63",
              prefix: "34-63/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "第三部分64-108",
              prefix: "64-108/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "第四部分109-132",
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
      icon: "/icon/redis.svg",
      prefix: "notes/Redis/",
      collapsible: true,
      children: "structure"
    },
    {
      text: "并发编程",
      icon: "/icon/lock.svg",
      prefix: "notes/Concurrent_Programming/",
      collapsible: true,
      children: [
        {
          text: "一、并发编程基础",
          prefix: "一、并发编程基础/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "二、共享模型之管程",
          prefix: "二、共享模型之管程/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "三、共享模型之内存",
          prefix: "三、共享模型之内存/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "四、共享模型之无锁",
          prefix: "四、共享模型之无锁/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "五、共享模型之不可变",
          prefix: "五、共享模型之不可变/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "六、共享模型之工具",
          prefix: "六、共享模型之工具/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "七、并发编程面试题",
          prefix: "七、并发编程面试题/",
          collapsible: true,
          children: "structure",
        },
      ],
    },
    {
      text: "Maven基础",
      icon: "/icon/maven.svg",
      prefix: "notes/Maven/",
      collapsible: true,
      children: "structure",
    },
    {
      text: "Nginx",
      icon: "/icon/nginx.svg",
      prefix: "notes/Nginx/",
      collapsible: true,
      children: "structure",
    },
    {
      text: "Mybatis",
      icon: "/icon/Mybatis.svg",
      prefix: "notes/Mybatis/SourceCode/",
      collapsible: true,
      children: "structure",
    },
  ],
  
  "/zh/notes/SpringCloud/": [
    {
      text: "Spring Cloud && Spring Cloud Alibaba ",
      icon: "/icon/springcloud.svg",
      collapsible: true,
      children: "structure",
    }
  ],

  "/zh/notes/Spring/": [
    {
      text: "Spring源码",
      icon: "/icon/spring.svg",
      prefix: "01-spring-source-code-deeply/",
      collapsible: true,
      children: "structure",
    }
  ],

  "/zh/notes/cfmall-notes/": [
    {
      text: "谷粒商城",
      icon: "/icon/springcloud.svg",
      collapsible: true,
      children: [
        {
          text: "一、课程资料",
          prefix: "一-课程资料/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "二、配置信息",
          prefix: "二-配置信息/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "三、踩坑集锦",
          prefix: "三-踩坑集锦/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "四、分布式基础篇",
          prefix: "四-分布式基础篇/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "五、分布式高级篇",
          prefix: "五-分布式高级篇/",
          collapsible: true,
          children: "structure",
        },
      ],
    }
  ],
});
