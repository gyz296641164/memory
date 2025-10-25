import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/zh/": [
    // "", //侧边栏“首页”

    // {
    //   text: "首页",
    //   icon: "home",
    //   link: "/home",
    // },

    // {
    //   text: "介绍",
    //   icon: "info",
    //   link: "/intro",
    // },

    {
      text: "杂文",
      icon: "/icon/use.svg",
      prefix: "posts/",
      collapsible: true, //侧边栏折叠
      children: "structure",
    },

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
          text: "JAVA集合",
          prefix: "JAVA_Collection/",
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

      ],
    },

    {
      text: "基础",
      icon: "/icon/base.svg",
      prefix: "notes/BASE/",
      collapsible: true,
      children: [
        {
          text: "计算机网络",
          prefix: "NetWork/",
          collapsible: true,
          children: "structure",
        },
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
        {
          text: "Nginx",
          icon: "/icon/nginx.svg",
          prefix: "Nginx/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "Maven基础",
          icon: "/icon/maven.svg",
          prefix: "Maven/",
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
      ],
    },

    {
      text: "数据库",
      icon: "/icon/数据库.svg",
      prefix: "notes/Database/",
      collapsible: true,
      children: [
        {
          text: "MySQL",
          icon: "/icon/mysql.svg",
          prefix: "MySQL/",
          collapsible: true,
          children: [
            {
              text: "散记MySQL",
              prefix: "01-random-mysql-notes/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "深入理解Mysql",
              prefix: "02-deep-understand-mysql/",
              collapsible: true,
              children: "structure",
            },
          ],
        },
        {
          text: "Redis",
          icon: "/icon/redis.svg",
          prefix: "Redis/",
          collapsible: true,
          children: "structure"
        },
      ]
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
      ],
    },
    {
      text: "分布式",
      icon: "/icon/分布式.svg",
      prefix: "notes/distributed_system/",
      collapsible: true,
      children: [
        {
          text: "分布式基础概念",
          prefix: "distributed-base/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "分布式事务",
          prefix: "distributed-transaction/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "Elasticsearch入门",
          prefix: "Elasticsearch-Base/",
          collapsible: true,
          children: "structure",
        },
      ],
    },
    {
      text: "高可用",
      icon: "/icon/高可用.svg",
      prefix: "notes/high_concurrency/",
      collapsible: true,
      children: "structure",
    },


    {
      text: "基础框架",
      icon: "/icon/基础框架.svg",
      prefix: "notes/JAVAEE/",
      collapsible: true,
      children: [
        {
          text: "Spring源码",
          icon: "/icon/spring.svg",
          prefix: "Spring/01-spring-source-code-deeply/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "SpringMVC",
          icon: "/icon/SpringMVC.svg",
          prefix: "SpringMVC/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "Mybatis",
          icon: "/icon/Mybatis.svg",
          prefix: "Mybatis/SourceCode/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "SpringBoot",
          icon: "/icon/SPRINGBOOT.svg",
          prefix: "SpringBoot/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "Spring Cloud",
          icon: "/icon/springcloud.svg",
          prefix: "SpringCloud/",
          collapsible: true,
          children: "structure",
        },
      ]
    },

    {
      text: "DDD",
      icon: "/icon/ddd.svg",
      prefix: "notes/DDD/DDD领域驱动模型设计/",
      collapsible: true,
      children: "structure",
    },
    {
      text: "中间件",
      icon: "/icon/中间件.svg",
      prefix: "notes/Middle_Ware/",
      collapsible: true,
      children: [
        {
          text: "RocketMQ",
          prefix: "RocketMQ/",
          collapsible: true,
          children: [
            {
              text: "RocketMQ概念篇",
              prefix: "RocketMQ概念篇/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "RocketMQ实战与源码",
              prefix: "RocketMQ实战与源码/",
              collapsible: true,
              children: "structure",
            },
          ]
        },
      ]
    },

    {
      text: "运维部署",
      icon: "/icon/deployment.svg",
      prefix: "notes/OperationsAndDeployment/",
      collapsible: true,
      children: [
        {
          text: "Docker",
          icon: "/icon/docker.svg",
          prefix: "Docker/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "Linux命令",
          icon: "/icon/linux.svg",
          link: "Linux.md",
        },
      ]
    },

    {
      text: "面试专区",
      icon: "/icon/interview.svg",
      prefix: "notes/Interview/",
      collapsible: true,
      children: [
        {
          text: "Java基础",
          prefix: "JavaSE/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
        {
          text: "JVM",
          prefix: "JVM/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
        {
          text: "并发编程",
          prefix: "Concurrent_Programming/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
        {
          text: "MySQL",
          prefix: "MySQL/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
        {
          text: "Redis",
          prefix: "Redis/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
        {
          text: "MQ",
          prefix: "MQ/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
        {
          text: "框架",
          prefix: "JavaEE/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
        {
          text: "系统设计",
          prefix: "Architecture/",
          icon: "note",
          collapsible: true,
          children: "structure"
        },
      ]
    },
  ],

  "/zh/notes/JAVAEE/SpringCloud/": [
    {
      text: "Spring Cloud && Spring Cloud Alibaba ",
      icon: "/icon/springcloud.svg",
      collapsible: true,
      children: "structure",
    }
  ],

  "/zh/notes/JAVAEE/Spring/": [
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
        {
          text: "六、运维篇",
          prefix: "六-运维篇/",
          collapsible: true,
          children: "structure",
        },
      ],
    }
  ],
});
