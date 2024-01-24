---
title: 搭建Vuepress博客
category:
  - 博客
order: 1
date: 2023-11-29
---

<!-- more -->

## 部署

博客部署参考：[Vuepress博客搭建+GithubPages+Vercel部署](#https://www.yuque.com/lasted_memory/ra3gmg/cgng5m1sgmluyg2e)

## 侧边栏

侧边栏的配置在 `src\.vuepress\sidebar\zh.ts`文件中，如果文件夹下直接是md文件，不包含文件夹，那么可以直接按照如下简便写法，

```
    {
      text: "Maven基础",
      icon: "note",
      prefix: "notes/Maven/",
      collapsible: true,
      children: "structure",
    },
```

**至于目录名称如何显示呢？**

通过md文件开头配置的title控制，像其它的如category，date会显示在文章页眉处，其它参数定义参照官方文档使用即可！

```
---
title: Maven基础
category:
  - Maven
order: 1
date: 2023-11-29
---
```

**侧边栏目录显示问题**

如果左侧边栏的目录名称将路径都显示出来了，如“/zh/notes/Maven/2---Maven的下载_目录结构_IDEA整合Maven”，而不是配置的纯汉字标题，那么可能你的文件名有特殊符号导致的，例如下划线“_”等等。将文件名改为不带有特殊符号即可！


## 标题

点击进入阅读文章后，文章的标题显示会在页面右侧，注意文章中不要定义**一级标题**，否则页面显示不出来，二级标题以下可以正常显示！

