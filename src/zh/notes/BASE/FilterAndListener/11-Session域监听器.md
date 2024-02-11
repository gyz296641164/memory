---
title: 11-Session域监听器
category:
  - Listener
order: 11
date: 2024-02-11
---

<!-- more -->

# Session域监听器

Session域共有四个监听器接口，分别是：

- HttpSessionListener
- HttpSessionAttributeListener
- HttpSessionBindingListener
- HttpSessionActivationListener

接下来我们就认识一些每个接口和接口中每个方法的用处。

---

# 监听器代码

## HttpSessionListener、HttpSessionAttributeListener

```java
package com.gyz.sessionlistener.listener;

import javax.servlet.annotation.WebListener;
import javax.servlet.http.HttpSessionAttributeListener;
import javax.servlet.http.HttpSessionBindingEvent;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-11 12:15
 * @description:
 */
@WebListener
public class MySessionListener implements HttpSessionListener, HttpSessionAttributeListener {
    @Override
    public void attributeAdded(HttpSessionBindingEvent event) {
        System.out.println("任何一个session对象中添加了数据");
    }

    @Override
    public void attributeRemoved(HttpSessionBindingEvent event) {
        System.out.println("任何一个session对象中删除了数据");
    }

    @Override
    public void sessionCreated(HttpSessionEvent se) {
        System.out.println("任何一个session对象创建");
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        System.out.println("任何一个session对象销毁");
    }
}
```

## HttpSessionBindingListener

```java
package com.gyz.sessionlistener.listener;

import javax.lang.model.element.VariableElement;
import javax.servlet.annotation.WebListener;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionBindingEvent;
import javax.servlet.http.HttpSessionBindingListener;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-11 12:18
 * @description: 可以监听具体的某个session对象的事件的。
 *               HttpSessionListener 只要在web.xml中配置或者通过@WebListener注解就可以注册监听所有的Session对象
 *               HttpSessionBindingListener 必须要通过setAttribute方法和某个session对象绑定之后,监听单独的某个Session对象
 */
@WebListener
public class MySessionBindingListener implements HttpSessionBindingListener {

    //    session.setAttribute("mySessionBindingListener",new MySessionBindingListener())

    /**
     * 绑定方法
     * @param event
     */
    @Override
    public void valueBound(HttpSessionBindingEvent event) {
        System.out.println("监听器和某个session对象绑定了");
    }

    /**
     * 解除绑定方法。当发生如下方法，会触发该方法的运行：
     *      1、session.invalidate();让session不可用
     *      2、session到达最大不活动时间，session对象回收
     *      3、session.removeAttribute("mySessionBindingListener");手动解除绑定
     * @param event
     */
    @Override
    public void valueUnbound(HttpSessionBindingEvent event) {

    }
}
```

## HttpSessionActivationListener

```java
package com.gyz.sessionlistener.listener;

import javax.servlet.http.HttpSessionActivationListener;
import javax.servlet.http.HttpSessionEvent;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-11 12:31
 * @description:
 */
public class MySessionActivationListener implements HttpSessionActivationListener {
    @Override
    public void sessionWillPassivate(HttpSessionEvent se) {
        System.out.println("session即将钝化");
    }

    @Override
    public void sessionDidActivate(HttpSessionEvent se) {
        System.out.println("session活化完毕");
    }
}
```

**钝化与活化**

参考下图说明：

![image-20240211130244524](https://studyimages.oss-cn-beijing.aliyuncs.com/img/FilterAndListener/202402/da761931c7d5281d.png)

用户登录APP，实现七天免登录，需要APP服务给用户一个持久化cookie。如果APP服务重启后，还能实现免登录，那么就需要APP中的session数据序列化成文件，存储到磁盘上，这个过程叫**“钝化”**。当服务重启成功后，将磁盘上存储的session数据恢复，这个过程叫**“活化”**。