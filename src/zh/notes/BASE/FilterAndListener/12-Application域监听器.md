---
title: 12-Application域监听器
category:
  - Listener
order: 12
date: 2024-02-11
---

<!-- more -->

# 认识Application域监听器

Application域共有两个监听器接口，分别是：

- ServletContextListener
- ServletContextAttributeListener

接下来我们就认识一些每个接口和接口中每个方法的用处。

---

# 监听器代码

```java
package com.gyz.application;

import javax.servlet.ServletContextAttributeEvent;
import javax.servlet.ServletContextAttributeListener;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-11 13:08
 * @description:
 */
@WebListener
public class MyApplicationListener implements ServletContextListener, ServletContextAttributeListener {
    @Override
    public void attributeAdded(ServletContextAttributeEvent event) {
        System.out.println("ServletContext增加了数据");
    }

    @Override
    public void attributeRemoved(ServletContextAttributeEvent event) {
        System.out.println("ServletContext删除了数据");
    }

    @Override
    public void attributeReplaced(ServletContextAttributeEvent event) {
        System.out.println("ServletContext修改了数据");
    }

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        System.out.println("ServletContext创建并初始化了");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        System.out.println("ServletContext销毁了");
    }
}
```