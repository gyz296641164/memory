---
title: ✅P136_商城业务-首页-整合thymeleaf渲染首页
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 引入thymeleaf依赖

`cfmall-product`服务中导入thymeleaf依赖

`cfmall-product/pom.xml`

```xml
<dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

---

## application.yml

关闭页面缓存，以便在生产环境下可以实时看到数据变化

`cfmall-product/src/main/resources/application.yml`

```java
spring:
  //省略......
  thymeleaf:
    cache: false  #关闭页面缓存
```

---

## 导入index静态资源

将首页资源中的index文件夹复制到static文件夹下，将index.html复制到templates文件夹下

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311301114016.png#id=JcbN0&originHeight=123&originWidth=632&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311301115983.png#id=EeQuz&originHeight=390&originWidth=379&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 访问静态资源

**url：**[http://localhost:8200/index/css/GL.css](http://localhost:8081/index/css/GL.css)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301117686.png#id=ObJWc&originHeight=443&originWidth=460&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 访问首页

**url：**[http://localhost:8081/](http://localhost:8081/)

SpringBoot自动配置，将默认访问`index.html`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301118410.png#id=KtFON&originHeight=919&originWidth=1394&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 自动加载资源原理

> org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration


`org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration.EnableWebMvcConfiguration#welcomePageHandlerMapping`

```java
        @Bean
        public WelcomePageHandlerMapping welcomePageHandlerMapping(ApplicationContext applicationContext) {
            WelcomePageHandlerMapping welcomePageHandlerMapping = new WelcomePageHandlerMapping(new 				     TemplateAvailabilityProviders(applicationContext), 
            	applicationContext, 
            	this.getWelcomePage(), //2
            	this.mvcProperties.getStaticPathPattern());  //1
            	welcomePageHandlerMapping.setInterceptors(this.getInterceptors());
            	return welcomePageHandlerMapping;
        }
```

1、`org.springframework.boot.autoconfigure.web.servlet.WebMvcProperties#getStaticPathPattern`

```java
    public String getStaticPathPattern() {
        return this.staticPathPattern;
    }
```

`org.springframework.boot.autoconfigure.web.servlet.WebMvcProperties`

```java
private String staticPathPattern;

    public WebMvcProperties() {
        this.staticPathPattern = "/**";
        //省略其它代码
    }
```

2、`org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration.EnableWebMvcConfiguration#getWelcomePage`

```java
        private Optional<Resource> getWelcomePage() {
            String[] locations = WebMvcAutoConfiguration.getResourceLocations(this.resourceProperties.getStaticLocations());
            return Arrays.stream(locations).map(this::getIndexHtml).filter(this::isReadable).findFirst();
        }
```

`org.springframework.boot.autoconfigure.web.ResourceProperties#getStaticLocations`

```java
    public String[] getStaticLocations() {
        return this.staticLocations;
    }
```

`org.springframework.boot.autoconfigure.web.ResourceProperties`

```java
private String[] staticLocations;

public ResourceProperties() {
   this.staticLocations = CLASSPATH_RESOURCE_LOCATIONS;
   //省略其它代码
}

private static final String[] CLASSPATH_RESOURCE_LOCATIONS = new String[]{"classpath:/META-INF/resources/", "classpath:/resources/", "classpath:/static/", "classpath:/public/"};
```

所有访问`/**`的路径都会去类路径下的 `/META-INF/resources/` 、`/resources/` 、`/static/` 、`/public/` 下查找资源
