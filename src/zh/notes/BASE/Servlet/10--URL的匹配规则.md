---
title: 10_URL的匹配规则
category:
  - Servlet
order: 10
date: 2024-02-11
---

<!-- more -->

## 精确匹配

精确匹配是指`<url-pattern>`中配置的值必须与url完全精确匹配。

```xml
<servlet-mapping>
    <servlet-name>demoServlet</servlet-name>
    <url-pattern>/demo.do</url-pattern>
</servlet-mapping>
```

http://localhost:8888/demo/demo.do 匹配

http://localhost:8888/demo/suibian/demo.do 不匹配

---

## 扩展名匹配

在`<url-pattern>`允许使用统配符`*`作为匹配规则，`*`表示匹配任意字符。在扩展名匹配中只要扩展名相同都会被匹配和路径无关。注意，在使用扩展名匹配时在`<url-pattern>`中不能使用`/`，否则容器启动就会抛出异常。

```xml
<servlet-mapping>
      <servlet-name>demoServlet</servlet-name>
      <url-pattern>*.do</url-pattern>
</servlet-mapping>
```

http://localhost:8888/demo/abc.do 匹配

http://localhost:8888/demo/suibian/haha.do 匹配

http://localhost:8888/demo/abc 不匹配

---

## 路径匹配

根据请求路径进行匹配，在请求中只要包含该路径都匹配。`*`表示任意路径以及子路径。

```xml
<servlet-mapping>
      <servlet-name>demoServlet</servlet-name>
      <url-pattern>/suibian/*</url-pattern>
</servlet-mapping>
```

http://localhost:8888/demo/suibian/haha.do 匹配

http://localhost:8888/demo/suibian/hehe/haha.do 匹配

http://localhost:8888/demo/hehe/heihei.do 不匹配

---

## 任意匹配

匹配“/”。匹配所有但不包含JSP页面

```
<url-pattern>/</url-pattern>
```

http://localhost:8888/demo/suibian.do匹配

http://localhost:8888/demo/addUser.html匹配

http://localhost:8888/demo/css/view.css匹配

http://localhost:8888/demo/addUser.jsp不匹配

http://localhost:8888/demo/user/addUser.jsp不匹配

---

## 匹配所有

```
<url-pattern>/*</url-pattern>
```

http://localhost:8888/demo/suibian.do匹配

http://localhost:8888/demo/addUser.html匹配

http://localhost:8888/demo/suibian/suibian.do匹配

---

## 优先顺序

当一个url与多个Servlet的匹配规则可以匹配时，则按照 **“ 精确路径 > 最长路径 >扩展名”**这样的优先级匹配到对应的Servlet。

> **案例分析**

- Servlet1映射到 /abc/
- *Servlet2映射到 /*
- Servlet3映射到 /abc
- Servlet4映射到 *.do

当请求URL为“/abc/a.html”，“/abc/*”和“/*”都匹配，Servlet引擎将调用Servlet1。

当请求URL为“/abc”时，“/abc/*”和“/abc”都匹配，Servlet引擎将调用Servlet3。

当请求URL为“/abc/a.do”时，“/abc/*”和“*.do”都匹配，Servlet引擎将调用Servlet1。

当请求URL为“/a.do”时，“/*”和“*.do”都匹配，Servlet引擎将调用Servlet2。

当请求URL为“/xxx/yyy/a.do”时，“/*”和“*.do”都匹配，Servlet引擎将调用Servlet2。

---

## URL映射方式

在web.xml文件中支持将多个URL映射到一个Servlet中，但是相同的URL不能同时映射到两个Servlet中。

> **方式一**

```xml
<servlet-mapping>
    <servlet-name>demoServlet</servlet-name>
    <url-pattern>/suibian/*</url-pattern>
    <url-pattern>*.do</url-pattern>
</servlet-mapping>
```

> **方式二**

```xml
<servlet-mapping>
    <servlet-name>demoServlet</servlet-name>
    <url-pattern>/suibian/*</url-pattern>
</servlet-mapping>

<servlet-mapping>
    <servlet-name>demoServlet</servlet-name>
    <url-pattern>*.do</url-pattern>
</servlet-mapping>
```

