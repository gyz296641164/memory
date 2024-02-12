---
title: ✅P20-27_SpringCloudAlibaba
category:
  - 谷粒商城
order: 4
date: 2024-02-12
---

<!-- more -->

## 微服务-注册中心、配置中心、网关

> 组件基本介绍：[https://www.yznotes.cn/zh/notes/SpringCloud/03-SpringCloudAlibaba.html](https://www.yznotes.cn/zh/notes/SpringCloud/03-SpringCloudAlibaba.html)


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241806385.png#id=I3rP6&originHeight=451&originWidth=909&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 组件选择

注册中心：SpringCloud Alibaba Nacos

配置中心：SpringCloud Alibaba Nacos

负载均衡：SpringCloud Ribbon

声明式HTTP客户端：SpringCloud Feign ——调用远程服务

负载均衡：SpringCloud Ribbon —— feign中已经整合，无需显示引用

服务容错：SpringCloud Alibaba Sentinel ——限流、降级、熔断

API网关：SpringCloud Gateway ——webflux 编程模式

调用链路监控：SpringCloud Sleuth

分布式事务：SpringCloud Alibaba Seata ——原Fescar

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241806893.png#id=WbmwA&originHeight=439&originWidth=749&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 版本选择

> 参考：[官方](https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E)


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241806669.png#id=Qzza3&originHeight=841&originWidth=1363&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 引入Nacos作为注册中心

商品、订单等模块配置Nacos类似，**以商品模块为例：**

### 1. common模块引入nacos-discovery依赖

```xml
<dependency>
  <groupId>com.alibaba.cloud</groupId>
  <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

### 2. yaml文件增加配置

```yaml
spring:
  application:
    name: cfmall-product
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
```

### 3. 主启动类增加注解

```java
@SpringBootApplication
@MapperScan("com.gyz.cfmall.product.dao")
@EnableDiscoveryClient
public class CfmallProductApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallProductApplication.class, args);
    }

}
```

此时，启动Nacos，运行主启动类启动服务后，在浏览器打开配置文件中的地址：127.0.0.1:8848/nacos (账号密码：nacos/nacos)中就可以看到当前服务已经注册到 Nacos 服务列表中。

**其他服务以同样方式配置即可**

---

## 引入Feign远程服务调用

### 1. common引入Feign依赖

```xml
 <dependency>
   <groupId>org.springframework.cloud</groupId>
   <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

### 2. 主启动类开启远程调用功能

```java
@MapperScan("com.gyz.cfmall.member.dao")
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class CfmallMemberApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallMemberApplication.class, args);
    }

}
```

### 3. 远程调用过程测试

**以优惠券模块coupon为例：当前测试member模块远程调用coupon模块**

#### 3.1 coupon模块接口定义

```java
@RestController
@RequestMapping("coupon/coupon")
public class CouponController {
    @RequestMapping("/member/list")
    public R membercoupons() {
        CouponEntity couponEntity = new CouponEntity();
        couponEntity.setCouponName("满100减10");
        return R.ok().put("coupons", Arrays.asList(couponEntity));
    }
}
```

#### 3.2 member定义远程调用接口

1. 首先在接口上加上@FeignClient注解声明要调用哪个服务
2. 定义接口方法，并声明要调用服务接口的地址 `@RequestMapping("/coupon/coupon/member/list")`

当前接口方法的的含义：当前服务调用该方法，会到服务注册中心找到 `cfmall-coupon` 服务，去调用该服务的`/coupon/coupon/member/list` 请求对应的方法。

```java
@FeignClient("mall-coupon")
public interface CouponFeignService {
    @RequestMapping("/coupon/coupon/member/list")
    R memberCoupons();
}
```

#### 3.3 member 定义请求调用第2步的接口方法

```java
@RestController
@RequestMapping("member/member")
public class MemberController {
    @Autowired
    CouponFeignService couponFeignService;
    
	@RequestMapping("/coupons")
    public R test() {
        MemberEntity memberEntity = new MemberEntity();
        memberEntity.setNickname("张三");

        R membercoupons = couponFeignService.memberCoupons();
        return R.ok().put("member", memberEntity).put("coupons", membercoupons.get("coupons"));
    }
}
```

#### 3.4 启动member和coupon服务完成调用

解析：

1. 当前请求member服务的 `/member/member/coupons` 请求；
2. 会调用`couponFeignService.memberCoupons()`；
3. 此时会到服务注册中心找到 `cfmall-coupon` 服务；
4. 调用该服务的`/coupon/coupon/member/list` 请求对应的方法。

---

## 引入Nacos作为配置中心

> 参考：[官方介绍](https://github.com/alibaba/spring-cloud-alibaba/blob/master/spring-cloud-alibaba-examples/nacos-example/nacos-config-example/readme-zh.md)


### 1. common模块引入nacos-config依赖

```xml
<dependency>
     <groupId>com.alibaba.cloud</groupId>
     <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
 </dependency>
```

### 2. 在服务模块新建bootstrap.yaml配置 Nacos Config 元数据

此处以coupon服务为例：

```yaml
spring:
  application:
    name: cfmall-coupon
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        namespace: 34db3601-4688-472e-8cb6-f5cfa80b480c
        file-extension: yaml
```

### 3. 测试读取配置中心配置

配置中心新增一个配置

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241806103.png#id=gEZM9&originHeight=463&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241806891.png#id=u1mOp&originHeight=701&originWidth=1702&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

#### 3.1 新建接口读取配置

`CouponController.java`

`@RefreseScope`：动态刷新，修改配置中心配置不需要重新启动项目

```java
@RefreshScope
@RestController
@RequestMapping("coupon/coupon")
public class CouponController {
    @Autowired
    private CouponService couponService;

    @Value("${coupon.user.name}")
    private String name;
    @Value("${coupon.user.age}")
    private Integer age;

    @RequestMapping("/test")
    public R test() {
        return R.ok().put("name", name).put("age", age);
    }
}
```

请求 `/coupon/coupon/test` 可以看到配置中心的数据，修改配置中心的配置，刷新可自动更新

### 4. Nacos 命名空间

为了对不同服务之间进行配置隔离，这里为每个微服务创建自己的命名空间。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241806343.png#id=xWgLy&originHeight=550&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

后端代码中在`bootstrap.yaml` 配置属于自己服务的命名空间

```yaml
spring:
  application:
    name: cfmall-product
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        namespace: 9d1e14b7-d077-4234-b42e-ecd1fa8e97a7
```

---

## 引入Gateway作为API网关

> 参考：[官网](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/)


### 创建网关子模块cfmall-gateway

**pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.8.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
        <groupId>com.gyz.cfmall</groupId>
        <artifactId>cfmall-gateway</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <name>cfmall-gateway</name>
        <description>API网关</description>

    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR3</spring-cloud.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        <dependency>
            <groupId>com.gyz.cfmall</groupId>
            <artifactId>cfmall-common</artifactId>
            <version>0.0.1-SNAPSHOT</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

**主启动类**

```java
@EnableDiscoveryClient
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class}) //排除数据源的依赖

public class CfmallGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallGatewayApplication.class, args);
    }

}
```

**配置文件**

`application.yaml`

```yaml
spring:
  application:
    name: cfmall-gateway
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
server:
  port: 88
```

`bootstrap.yaml`

```yaml
spring:
  application:
    name: cfmall-gateway
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        namespace: b36320a2-5a75-40aa-8eb8-36fd3ee2bd04  # Nacos命名空间ID
```

### 测试

配置gateway路由规则，`application.yaml`

```yaml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
    gateway:
      routes:
        - id: baidu_route
          uri: https://www.baidu.com
          predicates:
            - Query=url,baidu
        - id: qq_route
          uri: https://www.qq.com
          predicates:
            - Query=url,qq
  application:
    name: gulimall-gateway
server:
  port: 88
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241807813.png#id=HTxrH&originHeight=525&originWidth=1910&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241807315.png#id=W9p4g&originHeight=867&originWidth=1894&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
