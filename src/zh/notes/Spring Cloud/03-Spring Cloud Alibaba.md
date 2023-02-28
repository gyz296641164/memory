---
title: Spring Cloud Alibaba
category:
  - Spring Cloud
date: 2023-02-27
---

<!-- import -->

## 18、Spring Cloud Alibaba入门简介

### 18.1 为什么会出现Spring Cloud Alibaba？

**Spring Cloud Netflix项目进入维护模式**：

https://spring.io/blog/2018/12/12/spring-cloud-greenwich-rc1-available-now

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251024.png" alt="image-20210727094129608" />

**什么是维护模式**

- 将模块置于维护模式，意味着Spring Cloud团队将不会再向模块添加新功能；

- 他们将修复block级别的 bug 以及安全问题，他们也会考虑并审查社区的小型pull request。

**进入维护模式意味着什么呢**

Spring Cloud Netflix 将不再开发新的组件。

我们都知道Spring Cloud版本迭代算是比较快的，因而出现了很多重大ISSUE都来不及Fix就又推另一个Release了。进入维护模式意思就是目前一直到以后一段时间Spring Cloud Netflix 提供的服务和功能就这么多了，再不开发新的组件和功能了，以后将以维护Merge分支和Full Request为主。

***

### 18.2 Spring Cloud Alibaba带来什么？

#### 18.2.1 是什么

- 官网：https://github.com/alibaba/spring-cloud-alibaba/blob/master/README-zh.md

- Spring Cloud Alibaba 致力于提供微服务开发的一站式解决方案。此项目包含开发分布式应用微服务的必需组件，方便开发者通过 Spring Cloud 编程模型轻松使用这些组件来开发分布式应用服务；

- 依托 Spring Cloud Alibaba，您只需要添加一些注解和少量配置，就可以将 Spring Cloud 应用接入阿里微服务解决方案，通过阿里中间件来迅速搭建分布式应用系统。



#### 18.2.2 主要功能

- **服务限流降级**：默认支持 WebServlet、WebFlux, OpenFeign、RestTemplate、Spring Cloud Gateway, Zuul, Dubbo 和 RocketMQ 限流降级功能的接入，可以在运行时通过控制台实时修改限流降级规则，还支持查看限流降级 Metrics 监控。
- **服务注册与发现**：适配 Spring Cloud 服务注册与发现标准，默认集成了 Ribbon 的支持。
- **分布式配置管理**：支持分布式系统中的外部化配置，配置更改时自动刷新。
- **消息驱动能力**：基于 Spring Cloud Stream 为微服务应用构建消息驱动能力。
- **分布式事务**：使用 @GlobalTransactional 注解， 高效并且对业务零侵入地解决分布式事务问题。
- **阿里云对象存储**：阿里云提供的海量、安全、低成本、高可靠的云存储服务。支持在任何应用、任何时间、任何地点存储和访问任意类型的数据。
- **分布式任务调度**：提供秒级、精准、高可靠、高可用的定时（基于 Cron 表达式）任务调度服务。同时提供分布式的任务执行模型，如网格任务。网格任务支持海量子任务均匀分配到所有 Worker（schedulerx-client）上执行。
- **阿里云短信服务**：覆盖全球的短信服务，友好、高效、智能的互联化通讯能力，帮助企业迅速搭建客户触达通道。
- 更多功能请参考 [Roadmap](https://github.com/alibaba/spring-cloud-alibaba/blob/master/Roadmap-zh.md)。



#### 18.2.3 组件

- **[Sentinel](https://github.com/alibaba/Sentinel)**：把流量作为切入点，从流量控制、熔断降级、系统负载保护等多个维度保护服务的稳定性。
- **[Nacos](https://github.com/alibaba/Nacos)**：一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。
- **[RocketMQ](https://rocketmq.apache.org/)**：一款开源的分布式消息系统，基于高可用分布式集群技术，提供低延时的、高可靠的消息发布与订阅服务。
- **[Dubbo](https://github.com/apache/dubbo)**：Apache Dubbo™ 是一款高性能 Java RPC 框架。
- **[Seata](https://github.com/seata/seata)**：阿里巴巴开源产品，一个易于使用的高性能微服务分布式事务解决方案。
- **[Alibaba Cloud OSS](https://www.aliyun.com/product/oss)**: 阿里云对象存储服务（Object Storage Service，简称 OSS），是阿里云提供的海量、安全、低成本、高可靠的云存储服务。您可以在任何应用、任何时间、任何地点存储和访问任意类型的数据。
- **[Alibaba Cloud SchedulerX](https://help.aliyun.com/document_detail/43136.html)**: 阿里中间件团队开发的一款分布式任务调度产品，提供秒级、精准、高可靠、高可用的定时（基于 Cron 表达式）任务调度服务。
- **[Alibaba Cloud SMS](https://www.aliyun.com/product/sms)**: 覆盖全球的短信服务，友好、高效、智能的互联化通讯能力，帮助企业迅速搭建客户触达通道。
- 更多组件请参考 [Roadmap](https://github.com/alibaba/spring-cloud-alibaba/blob/master/Roadmap-zh.md)。



***

### 18.3 Spring Cloud Alibaba学习资料获取

**官网**

- https://spring.io/projects/spring-cloud-alibaba#overview

**英文**

- https://github.com/alibaba/spring-cloud-alibaba
- https://spring-cloud-alibaba-group.github.io/github-pages/greenwich/spring-cloud-alibaba.html

**中文**

- https://github.com/alibaba/spring-cloud-alibaba/blob/master/README-zh.md



***

## 19、Spring Cloud Alibaba Nacos服务注册和配置中心

### 19.1 Nacos简介

> **为什么叫Nacos**

前四个字母分别为naming和Configuration的前两个字母，最后的s为service。

> **是什么**

- 一个更易于构建云原生应用的动态服务发现，配置管理和服务管理平台。
- Nacos：Dynamic Naming and Configuration Service
- Nacos就是`注册中心 + 配置中心`的组合等价于`Eureka + Config + Bus`

> **能干嘛**

- 替代eureka做服务注册中心
- 替代Config做服务配置中心

> **去哪下**

- https://github.com/alibaba/nacos

- [官网文档](https://spring-cloud-alibaba-group.github.io/github-pages/greenwich/spring-cloud-alibaba.html#_spring%20cloud%20alibaba%20nacos_discovery)

> **各种注册中心比较**

| 服务注册与发现框架 | CAP模型 | 控制台管理 | 社区活跃度      |
| ------------------ | ------- | ---------- | --------------- |
| Eureka             | AP      | 支持       | 低(2.x版本闭源) |
| Zookeeper          | CP      | 不支持     | 中              |
| consul             | CP      | 支持       | 高              |
| Nacos              | AP      | 支持       | 高              |



***

### 19.2 安装并运行Nacos

- 本地java8+maven环境已经ok

- [先从官网下载Nacos](https://github.com/alibaba/nacos/releases)

- 解压安装包，直接运行bin目录下的startup.cmd

- 命令运行成功后直接访问：http://localhost:8848/nacos

- 默认账号密码都是nacos，结果页面

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251025.png" alt="image-20210727213448499" />

***

### 19.3 Nacos作为服务注册中心演示

[官方文档](https://spring-cloud-alibaba-group.github.io/github-pages/greenwich/spring-cloud-alibaba.html#_spring_cloud_alibaba_nacos_discovery)

#### 19.3.1 基于Nacos的服务提供者

**新建module：`cloudalibaba-provicer-payment9001`**

**父POM**

```xml
<dependencyManagement>
    <dependencies>
        <!--spring cloud alibaba 2.1.0.RELEASE-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2.1.0.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**本模块POM**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>springcloud2020</artifactId>
        <groupId>com.gyz.clouddemo</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>cloudalibaba-provicer-payment9001</artifactId>

    <dependencies>
        <!--SpringCloud ailibaba nacos -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <!-- SpringBoot整合Web组件 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--日常通用jar包配置-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

**YML**

```java
server:
  port: 9001

spring:
  application:
    name: nacos-payment-provider
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848 #配置Nacos地址

management:  ##监控功能
  endpoints:
    web:
      exposure:
        #暴漏所有端点。例如：http://127.0.0.1:8080/actuator/health，health为端点，默认支持只支持端点 /health、/info
        include: '*'  
```

**主启动类**

```java
@SpringBootApplication
@EnableDiscoveryClient
public class PaymentMain9001 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentMain9001.class, args);
    }
}
```

**业务类**

```java
@RestController
@RefreshScope
public class ConfigClientController {

    @Value("server.port")
    private String serverPort;

    @GetMapping(value = "/payment/nacos/{id}")
    public String getPayment(@PathVariable("id") Integer id) {
        return "nacos registry, serverPort: " + serverPort + "\t id" + id;
    }
}
```

**测试**

- http://localhost:9001/payment/nacos/1

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251026.png" alt="image-20210727214315477" />

- nacos控制台

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251027.png" alt="image-20210727214328968" />

- nacos服务注册中心+服务提供者9001都OK了

**为了下一章节演示nacos的负载均衡，参照9001新建9002**。



#### 19.3.2 基于Nacos的服务消费者

**新建module：`cloudalibaba-consumer-nacos-order83`**

**POM**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>springcloud2020</artifactId>
        <groupId>com.gyz.clouddemo</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>cloudalibaba-consumer-nacos-order83</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
        <dependency>
            <groupId>com.gyz.clouddemo</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <!-- SpringBoot整合Web组件 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--日常通用jar包配置-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
</project>
```

自带负载均衡：spring-cloud-starter-alibaba-nacos-discovery内含netflix-ribbon包。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251028.png" alt="image-20210727215313230" />	

**YML**

```yaml
server:
  port: 83

spring:
  application:
    name: nacos-order-consumer

  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848

#消费者将要去访问的微服务名称(注册成功进nacos的微服务提供者)
service-url:
  nacos-user-service: http://nacos-payment-provider
```

**主启动**

```java
@SpringBootApplication
@EnableDiscoveryClient
public class OrderNacosMain83 {
    public static void main(String[] args) {
        SpringApplication.run(OrderNacosMain83.class, args);
    }
}
```

**配置类**

```java
@Configuration //能让RestTemplate在请求时拥有客户端负载均衡的能力；
public class ApplicationContextConfig {

    @Bean
    @LoadBalanced
    public RestTemplate getTemplate() {
        return new RestTemplate();
    }
}
```

**业务类**

```java
@RestController
@Slf4j
public class OrderNacosController {

    @Resource
    private RestTemplate restTemplate;

    @Value("${service-url.nacos-user-service}")
    private String serverURL;

    @GetMapping(value = "/consumer/payment/nacos/{id}")
    public String paymentInfo(@PathVariable("id") Long id) {
        return restTemplate.getForObject(serverURL + "/payment/nacos/" + id, String.class);
    }

}
```

**测试**

- 启动nacos控制台

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251029.png" alt="image-20210727221839894" />

- http://localhost:83/consumer/payment/nacos/1

- 83访问9001/9002，轮询负载OK

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251030.png" alt="image-20210727223227082" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251031.png" alt="image-20210727223236927" />



#### 19.3.3 Nacos服务注册中心对比提升

**Nacos全景图所示**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251032.png" alt="image-20210727223412893" />

**Nacos和CAP**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251033.png" alt="image-20210727223532429" />

**Nacos服务发现实例模型**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251034.png" alt="image-20210727223510288" />

**Nacos支持AP和CP模式的切换**

*C是所有节点在同一时间看到的数据是一致的;而A的定义是所有的请求都会收到响应*。

*何时选择使用何种模式*?

- —般来说，如果不需要存储服务级别的信息且服务实例是通过nacos-client注册，并能够保持心跳上报，那么就可以选择AP模式。当前主流的服务如Spring cloud和Dubbo服务，都适用于AP模式，AP模式为了服务的可能性而减弱了一致性，因此AP模式下只支持注册临时实例。

- 如果需要在服务级别编辑或者存储配置信息，那么CP是必须，K8S服务和DNS服务则适用于CP模式。CP模式下则支持注册持久化实例，此时则是以Raft协议为集群运行模式，该模式下注册实例之前必须先注册服务，如果服务不存在，则会返回错误。

*切换命令：*

```
curl -X PUT '$NACOS_SERVER:8848/nacos/v1/ns/operator/switches?entry=serverMode&value=CP
```

***

### 19.4 Nacos作为服务配置中心演示

#### 19.4.1 Nacos作为配置中心--基础配置

**新建 `cloudalibaba-config-nacos-client3377`**

**POM**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>springcloud2020</artifactId>
        <groupId>com.gyz.clouddemo</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>cloudalibaba-config-nacos-client3377</artifactId>

    <dependencies>
        <!--nacos-config-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <!--nacos-discovery-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <!--web + actuator-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--一般基础配置-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

</project>
```

**YML**

为啥要配置两个:

- Nacos同springcloud-config一样，在项目初始化时，要保证先从配置中心进行配置拉取，拉取配置之后，才能保证项目的正常启动。

- springboot中配置文件的加载是存在优先级顺序的，bootstrap优先级高于application

- bootstrap.yml

  ```yaml
  server:
    port: 3377
  
  spring:
    application:
      name: nacos-config-client
    cloud:
      nacos:
        discovery:
          server-addr: localhost:8848 #Nacos服务注册中心地址
        config:
          server-addr: localhost:8848 #Nacos作为配置中心地址
          file-extension: yaml #指定yaml格式的配置
          #group: DEV_GROUO
          #namespace: 7d8f0f5a-6a53-4785-9686-dd460158e5d4
          
  # ${spring.application.name}-${spring.profile.active}.${spring.cloud.nacos.config.file-extension}
  # nacos-config-client-dev.yaml
  
  # nacos-config-client-test.yaml   ----> config.info
  ```

- application.yml

  ```yaml
  spring:
    profiles:
      active: dev # 表示开发环境
      #active: test # 表示测试环境
      #active: info
  ```

**主启动**

```java
@SpringBootApplication
@EnableDiscoveryClient
public class NacosConfigClientMain3377 {
    public static void main(String[] args) {
        SpringApplication.run(NacosConfigClientMain3377.class, args);
    }
}
```

**业务类**

```java
@RestController
@Slf4j
public class ConfigClientController {

    @Value("${config.info}")
    private String configInfo;

    @GetMapping("/config/info")
    public String getConfigInfo() {
        return configInfo;
    }
}
```

**在nacos中添加配置信息：配置规则**

理论：

- 理论：Nacos中的dataid的组成格式及与SpringBoot配置文件中的配置规则。

- 官方文档：https://nacos.io/zh-cn/docs/what-is-nacos.html

- **说明**：之所以需要配置spring.application.name，是因为它是构成Nacos配置管理dataId 字段的一部分

- 在 Nacos Spring Cloud中，dataId的完整格式如下：

  ```
  ${prefix}-${spring-profile.active}.${file-extension}
  ```

  - prefix默认为`spring.application.name`的值，也可以通过配置项`spring.cloud.nacos.config.prefix`来配置；
  - `spring.profile.active`即为当前环境对应的 profile，详情可以参考 Spring Boot文档。注意：当spring.profile.active为空时，对应的连接符` -` 也将不存在，datald 的拼接格式变成`${prefix}.${file-extension}`；
  - `file-exetension`为配置内容的数据格式，可以通过配置项`spring .cloud.nacos.config.file-extension`来配置。目前只支持properties和yaml类型；
  - 通过Spring Cloud 原生注解@RefreshScope实现配置自动更新。

- 最后公式：

  ```
  ${spring.application.name)}-${spring.profiles.active}.${spring.cloud.nacos.config.file-extension}
  ```

实操：

- 配置新增

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251035.png" alt="image-20210728224133051" />

- 配置说明

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251036.png" alt="image-20210728224254023" />

**测试**

- 启动前需要在nacos客户端-配置管理-配置管理栏目下有对应的yaml配置文件
- 运行`cloud-config-nacos-client3377`的主启动类
- 调用接口查看配置信息 - http://localhost:3377/config/info

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251037.png" alt="image-20210728224527388" />

- 修改下Nacos中的yaml配置文件，再次调用查看配置的接口，就会发现配置已经刷新。(@RefreshScope：支持Nacos的动态刷新功能)



#### 19.4.2 Nacos作为配置中心--分类配置

> **问题：多环境多项目管理**

**问题1**

实际开发中，通常一个系统会准备

- dev开发环境
- test测试环境
- prod生产环境

如何保证指定环境启动时服务能正确读取到Nacos上相应环境的配置文件呢！

**问题2**

一个大型分布式微服务系统会有很多微服务子项目，每个微服务项目又都会有相应的开发环境、测试环境、预发环境、正式环境…那怎么对这些微服务配置进行管理呢！



> **Nacos的图形化管理界面**

**配置管理**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251038.png" alt="image-20210728225248079" />

**命名空间**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251039.png" alt="image-20210728225303001" />



> **Namespace+Group+Data ID三者的关系？为什么这么设计？**

**是什么**

类似Java里面的package名和类名最外层的**namespace是可以用于区分部署环境的**，**Group和DatalD逻辑上区分两个目标对象**。

**三者情况**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251040.png" alt="image-20210728225845028" />

1. 默认情况：`Namespace=public`，`Group=DEFAULT_GROUP`，默认`Cluster是DEFAULT`

2. Nacos默认的Namespace是public，Namespace主要用来实现隔离：

   比方说我们现在有三个环境：开发、测试、生产环境，我们就可以创建三个Namespace，不同的Namespace之间是隔离的。

3. Group默认是DEFAULT_GROUP，Group可以把不同的微服务划分到同一个分组里面去。

4. Service就是微服务:一个Service可以包含多个Cluster (集群)，Nacos默认Cluster是DEFAULT，Cluster是对指定微服务的一个虚拟划分。

   比方说为了容灾，将Service微服务分别部署在了杭州机房和广州机房，这时就可以给杭州机房的Service微服务起一个集群名称(HZ) ，给广州机房的Service微服务起一个集群名称(GZ)，还可以尽量让同一个机房的微服务互相调用，以提升性能。

5. 最后是Instance，就是微服务的实例。



#### 19.4.3 Case：三种方案配置（Data ID、Group、Namespace）

> **Data ID方案**

**指定`spring.profile.active`和配置文件的`Data ID`来使不同环境下读取不同的配置**。

**默认空间+默认分组+新建dev和test两个Data ID**

- 新建dev配置Data ID和test配置Data ID

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251041.png" alt="image-20210728231102465" />

**通过spring.profile.active属性就能进行多环境下的配置文件的读取**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251042.png" alt="image-20210728231309656" />

**测试**

- http://localhost:3377/config/info

- 配置是什么就加载什么： test/dev

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251043.png" alt="image-20210728231652079" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251044.png" alt="image-20210728231723321" />



> **Group方案**

**通过Group实现环境区分**。

**在nacos图形界面控制台上面新建配置文件DataID**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251045.png" alt="image-20210728232204733" />

**bootstrap和application**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251046.png" alt="image-20210728232513066" />



> **Namespace方案**

**新建dev/test的Namespace**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251047.png" alt="image-20210728232713080" />

**回到服务管理-服务列表查看**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251048.png" alt="image-20210728232810512" />

**按照域名配置填写**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251049.png" alt="image-20210728234615892" />

**YML**

![image-20210728234701100](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251050.png)

**测试**

http://localhost:3377/config/info

![image-20210728234725513](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251051.png)



***

### 19.5 **Nacos集群和持久化配置 

#### 19.5.1 官网说明

> **官网架构图**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251052.png" alt="image-20210728235111366" />

- 因此开源的时候推荐用户把所有服务列表放到一个vip下面，然后挂到一个域名下面

- http://ip1:port/openAPI直连ip模式，机器挂则需要修改ip才可以使用。

- http://VIP:port/openAPI挂载VIP模式，直连vip即可，下面挂server真实ip，可读性不好。

- http://nacos.com:port/openAPI域名＋VIP模式，可读性好，而且换ip方便，**推荐模式**
  



> **官网结构图翻译**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251053.png" alt="image-20210728235230558" />

**说明**：

- 默认Nacos使用嵌入式数据库实现数据的存储。所以，如果启动多个默认配置下的Nacos节点，数据存储是存在一致性问题的。为了解决这个问题，**Nacos采用了集中式存储的方式来支持集群化部署，目前只支持MySQL的存储**。

- **Nacos支持三种部署模式**

  - 单机模式-用于测试和单机试用。
  - 集群模式-用于生产环境，确保高可用。
  - 多集群模式-用于多数据中心场景。

- **Windows**

  `cmd startup.cmd`或者双击`startup.cmd`文件

- **单机模式支持mysql**

  在0.7版本之前，在单机模式时nacos使用嵌入式数据库实现数据的存储，不方便观察数据存储的基本情况。0.7版本增加了支持mysql数据源能力，具体的操作步骤：

  1. 安装数据库，版本要求:5.6.5+

  2. 初始化mysq数据库，数据库初始化文件: nacos-mysql.sql

  3. 修改conf/application.properties文件，增加支持mysql数据源配置（目前只支持mysql)，添加mysql数据源的url、用户名和密码。

     ```
     spring.datasource.platform=mysql
     
     db.num=1
     db.url.0=jdbc:mysql://11.162.196.16:3306/nacos_devtest?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
     db.user=nacos_devtest
     db.password=youdontknow
     ```

  4. 再以单机模式启动nacos，nacos所有写嵌入式数据库的数据都写到了mysql。



#### 19.5.3 Nacos持久化配置解释

> Nacos默认自带的是嵌入式数据库**derby**，nacos的pom.xml中可以看出。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251054.png" alt="image-20210729155052779" />

> **derby到mysql的切换配置步骤**

`nacos-server-1.1.4\nacos\conf`目录下找到sql脚本。执行脚本。

`nacos-server-1.1.4\nacos\conf`目录下找到`application.properties`。添加以下配置（按需配置）：

```
spring.datasource.platform=mysql

db.num=1
db.url.0=jdbc:mysql://localhost:3306/nacos_devtest?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
db.user=root       
db.password=1234  
```



> **启动nacos，可以看到一个全新的空记录界面，以前是记录近derby**



#### 19.5.4 Linux版nacos+mysql生产环境配置

> **预计需要，1个Nginx+3nacos注册中心+1个mysql**

预备环境准备：

1. 64 bit OS Linux/Unix/Mac，**推荐使用Linux系统**。
2. 64 bit JDK 1.8+；[下载](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html).[配置](https://docs.oracle.com/cd/E19182-01/820-7851/inst_cli_jdk_javahome_t/)。
3. Maven 3.2.x+；[下载](https://maven.apache.org/download.cgi).[配置](https://maven.apache.org/settings.html)。
4. **3个或3个以上Nacos节点才能构成集群**。

Nacos下载Linux版：

- Linux版：https://github.com/alibaba/nacos/releases/tag/1.1.4
- nacos-server-1.1.4.tar.gz
- 解压后安装



> **集群配置步骤（重点）**

**Linux服务器上mysql数据库配置**

- SQL脚本在哪里

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251055.png" alt="image-20210729160223272" />

- 自己Linux机器上的mysql数据库粘贴

**application.properties配置**

- 位置

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251056.png" alt="image-20210729160341672" />

- 添加以下内容，设置数据源

  ```
  spring.datasource.platform=mysql
  
  db.num=1
  db.url.0=jdbc:mysql://localhost:3306/nacos_devtest?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
  db.user=root
  db.password=1234
  ```

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251057.png" alt="image-20210729160404837" />

**Linux服务器上nacos的集群配置cluster.conf**

- 梳理出3台nacos集器的不同服务端口号，设置3个端口：
  - 3333
  - 4444
  - 5555

- 复制出cluster.conf

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251058.png" alt="image-20210729160634179" />

- 内容

  ```
  192.168.111.144:3333  #别忘了改成自己ip
  192.168.111.144:4444
  192.168.111.144:5555 
  ```

  这个IP不能写127.0.0.1，必须是Linux命令`hostname -i`能够识别的IP.

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251059.png" alt="image-20210729160813191" />

**编辑nacos的启动脚本startup.sh，使它能够接受不同的启动端口**

- /mynacos/nacos/bin目录下有startup.sh

- 思考？平时单机版的启动，都是`./startup.sh`即可。但是，集群启动，我们希望可以类似其它软件的shell命令，传递不同的端口号启动不同的nacos实例。命令:` ./startup.sh -p 3333`表示启动端口号为3333的nacos服务器实例，和上一步的cluster.conf配置的一致。

- **修改内容**

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251060.png" alt="image-20210729161835528" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251061.png" alt="image-20210729161843617" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251062.png" alt="image-20210729161853675" />

- 执行方式

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251063.png" alt="image-20210729161911857" />

**Nginx的配置，由它作为负载均衡器**

- 修改Nginx的配置文件

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251064.png" alt="image-20210729161947833" />

- 修改内容

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251065.png" alt="image-20210729162033467" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251066.png" alt="image-20210729162048565" />

- 按照指定启动

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251067.png" alt="image-20210729162102148" />

**截止到此处，1个Nginx+3个nacos注册中心+1个mysql**

- 启动3个nacos注册中心

  - `startup.sh - p 3333`
  - `startup.sh - p 4444`
  - `startup.sh - p 5555`
  - 查看nacos进程启动数`ps -ef | grep nacos | grep -v grep | wc -l`

- 启动nginx

  - `./nginx -c /usr/local/nginx/conf/nginx.conf`
  - 查看nginx进程`ps - ef| grep nginx`

- 测试通过nginx，访问nacos - http://192.168.111.144:1111/nacos/#/login

- 新建一个配置测试

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251068.png" alt="image-20210729162236852" />

- 新建后，可在linux服务器的mysql新插入一条记录

  ```
  select * from config;
  ```

> **测试**

- 微服务`cloudalibaba-provider-payment9002`启动注册进nacos集群.

- YML

  ```yaml
  server:
    port: 9002
  
  spring:
    application:
      name: nacos-payment-provider
    c1oud:
      nacos:
        discovery:
          #配置Nacos地址
          #server-addr: Localhost:8848
          #换成nginx的1111端口，做集群
          server-addr: 192.168.111.144:1111
  
  management:
    endpoints:
      web:
        exposure:
          inc1ude: '*'
  ```

- 启动微服务cloudalibaba-provider-payment9002；

- 访问nacos，查看注册结果。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251069.png" alt="image-20210729162526180" />



> **高可用小总结**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251070.png" alt="image-20210729162549332" />



***

## 20、Spring Cloud Alibaba Sentinel实现熔断与限流

### 20.1 Sentinel介绍

**官网Github**：https://github.com/alibaba/Sentinel

**官方文档**：https://sentinelguard.io/zh-cn/docs/introduction.html

**是什么？**

Sentinel 是面向分布式服务架构的流量控制组件，主要以流量为切入点，从流量控制、熔断降级、系统自适应保护等多个维度来帮助您保障微服务的稳定性。

**Sentinel 主要特性**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251071.png" alt="image-20210731123435061" />



**解决哪些问题**

- 服务血崩
- 服务降级
- 服务熔断
- 服务限流



***

### 20.2 安装Sentinel控制台

**sentinel组件有两部分构成**

- 核心库（Java 客户端）不依赖任何框架/库，能够运行于所有 Java 运行时环境，同时对 Dubbo / Spring Cloud 等框架也有较好的支持；
- 控制台（Dashboard）基于 Spring Boot 开发，打包后可以直接运行，不需要额外的 Tomcat 等应用容器。

**安装步骤**

- 下载
  - https://github.com/alibaba/Sentinel/releases
  - 下载到本地sentinel-dashboard-1.7.0.jar
- 运行命令
  - 前提：java8环境、8080端口没有被占用
  - 命令：java- jar  XXXXXXXXXXX.jar
- 访问Sentinel管理界面
  - localhost:8080
  - 登录账号密码均为sentinel



***

### 20.3 初始化演示工程

**启动Nacos8848成功**。

**新建Module`cloudalibaba-sentinel-service8401`**

**POM**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>springcloud2020</artifactId>
        <groupId>com.gyz.clouddemo</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.gyz.clouddemo</groupId>
    <artifactId>cloudalibaba-sentinel-service8401</artifactId>

    <dependencies>
        <dependency><!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
            <groupId>com.gyz.clouddemo</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <!--SpringCloud ailibaba nacos -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <!--SpringCloud ailibaba sentinel-datasource-nacos 后续做持久化用到-->
        <dependency>
            <groupId>com.alibaba.csp</groupId>
            <artifactId>sentinel-datasource-nacos</artifactId>
        </dependency>
        <!--SpringCloud ailibaba sentinel -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
        </dependency>
        <!--openfeign-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
        <!-- SpringBoot整合Web组件+actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--日常通用jar包配置-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>4.6.3</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

</project>
```

**YML**

```yaml
server:
  port: 8401

spring:
  application:
    name: cloud-sentinel-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848 #Nacos服务注册中心地址.t
    sentinel:
      transport:
        dashboard: localhost:8080 #配置Sentinel dashboard地址
        #默认8719端口，如果被占用会自动从8719开始依次+1扫描，直至找到未被占用的端口
        port: 8719
management:
  endpoints:
    web:
      exposure:
        include: '*'

feign:
  sentinel:
    enabled: true #激活Sentinel对Feign的支持
```

**主启动**

```java
@SpringBootApplication
@EnableDiscoveryClient
public class MainApp8401 {
    public static void main(String[] args) {
        SpringApplication.run(MainApp8401.class, args);
    }
}
```

**业务类FlowLimitController类**

```java
@RestController
@Slf4j
public class FlowLimitController {

    @GetMapping("/testA")
    public String testA() {
        return "------testA";
    }

    @GetMapping("/testB")
    public String testB() {
        log.info(Thread.currentThread().getName() + "\t" + "...testB");
        return "------testB";
    }

}
```

**启动Sentinel8080 : `java -jar sentinel-dashboard-1.7.0.jar`**

**启动微服务8401**

**启动8401微服务后查看sentinel控制台**

- 空空如也

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251072.png" alt="image-20210731181202368" />

- sentinel采用的是懒加载说明

  - 执行一次访问即可

    http://localhost:8401/testA

    http://localhost:8401/testB

  - 效果

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251073.png" alt="image-20210731181346832" />

- 结论：sentinel正在监控微服务8401



***

### 20.4 流控规则

#### 20.4.1 基本介绍

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251074.png" alt="image-20210731182313481" />

- 资源名：唯一名称，默认请求路径；
- 针对来源：Sentinel可以针对调用者进行限流，填写微服务名，默认default（不区分来源）；
- 阈值类型/单机阈值：
  - QPS(每秒钟的请求数量)︰当调用该API的QPS达到阈值的时候，进行限流；
  - 线程数：当调用该API的线程数达到阈值的时候，进行限流。
- 是否集群：不需要集群；
- 流控模式：
  - 直接：API达到限流条件时，直接限流；
  - 关联：当关联的资源达到阈值时，就限流自己；
  - 链路：只记录指定链路上的流量（指定资源从入口资源进来的流量，如果达到阈值，就进行限流)【API级别的针对来源】。
- 流控效果：
  - 快速失败：直接失败，抛异常；
  - Warm up：根据Code Factor（冷加载因子，默认3）的值，从阈值/codeFactor，经过预热时长，才达到设置的QPS阈值；
  - 排队等待：匀速排队，让请求以匀速的速度通过，阈值类型必须设置为QPS，否则无效。



#### 20.4.2 流控模式

> **默认直接：直接-->快速失败**

**配置说明**

- 表示1秒钟内查询1次就是OK，若超过次数1，就直接->快速失败，报默认错误
- <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251075.png" alt="image-20210731182826995" />

**测试**

- 快速多次点击访问：http://localhost:8401/testA

- 结果：` Blocked by Sentinel (flow limiting)`

  ![image-20210731183011478](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251076.png)

**思考**

直接调用默认报错信息，技术方面OK，但是，是否应该有我们自己的后续处理？类似有个`fallback`的兜底方法。

> **关联**

**是什么**？

- 当关联的资源达到阈值时，就限流自己
- 当与A关联的资源B达到阙值后，就限流A自己

**配置A**

当关联资源/testB的QPS阀值超过1时，就限流/testA的Rest访问地址，**当关联资源到阈值后限制配置好的资源名**。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251078.png" alt="image-20210731183936055" />

**postman模拟并发密集访问testB**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251079.png" alt="image-20210731190249285"/>

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251080.png" alt="image-20210731190345470"/>

- 访问testB成功

- postman里新建多线程集合组

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251081.png" alt="image-20210731190846980" />

- 访问地址添加进新线程组

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251082.png" alt="image-20210731191144948" />

- run

  大批量线程高并发访问B，导致A失效了。`注：以下请求前，先启动大批量请求。即先前设置的每隔0,3秒请求一次`

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251083.png" alt="image-20210731191449838" />



> **链路**

多个请求调用了同一个微服务！



#### 20.4.3 流控效果

> **Sentinel流控-预热**

直接->快速失败（默认的流控处理）：

- 说明公式：阈值除以coldFactor（默认值为3），经过预热时长后才会达到阈值

**Warm Up**

Warm Up（RuleConstant.CONTROL_BEHAVIOR_WARM_UP）方式，即`预热/冷启动`方式。当系统长期处于低水位的情况下，当流量突然增加时，直接把系统拉升到高水位可能瞬间把系统压垮。通过"冷启动"，让通过的流量缓慢增加，在一定时间内逐渐增加到阈值上限，给冷系统一个预热的时间，避免冷系统被压垮。详细文档可以参考 流量控制 - Warm Up 文档，具体的例子可以参`WarmUpFlowDemo`。

**通常冷启动的过程系统允许通过的 QPS 曲线如下图所示**：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251084.png" alt="image-20210731195016246" />

- 默认coldFactor为3，即请求QPS 从 threshold / 3开始，经预热时长逐渐升至设定的QPS阈值
- 限流冷启动
- [link](https://github.com/alibaba/Sentinel/wiki/%E6%B5%81%E9%87%8F%E6%8E%A7%E5%88%B6#warm-up)

**源码**

```
com.alibaba.csp.sentinel.slots.block.flow.controller.WarmUpController
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251085.png" alt="image-20210731195605977" />

**WarmUp配置**

- 案例，阀值为10+预热时长设置5秒。

- 系统初始化的阀值为10/ 3约等于3，即阀值刚开始为3；然后过了5秒后阀值才慢慢升高恢复到10
- <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251086.png" alt="image-20210731200410718" />

  

- **测试**

  多次快速点击  http://localhost:8401/testB - 刚开始不行，后续慢慢OK

- **应用场景**

  如：秒杀系统在开启的瞬间，会有很多流量上来，很有可能把系统打死，预热方式就是把为了保护系统，可慢慢的把流量放进来，慢慢的把阀值增长到设置的阀值。



> **Sentinel流控-排队等待**

匀速排队，让请求以均匀的速度通过，阀值类型必须设成QPS，否则无效。

设置：/testA每秒1次请求，超过的话就排队等待，等待的超时时间为20000毫秒。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251087.png" alt="image-20210731222701960" />

**匀速排队**

匀速排队（RuleConstant.CONTROL_BEHAVIOR_RATE_LIMITER）方式会严格控制请求通过的间隔时间，也即是让请求以均匀的速度通过，对应的是漏桶算法。详细文档可以参考 `流量控制 - 匀速器模式`，具体的例子可以参见 PaceFlowDemo。

该方式的作用如下图所示：
<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251088.png" alt="image-20210731222119072" />

这种方式主要用于处理间隔性突发的流量，例如消息队列。想象一下这样的场景，在某一秒有大量的请求到来，而接下来的几秒则处于空闲状态，我们希望系统能够在接下来的空闲期间逐渐处理这些请求，而不是在第一秒直接拒绝多余的请求。

`注意：匀速排队模式暂时不支持 QPS > 1000 的场景。`

**源码** 

```
com.alibaba.csp.sentinel.slots.block.flow.controller.RateLimiterController
```

**测试**

- FlowLimitController的testA方法添加日志记录

  ```
   log.info(Thread.currentThread().getName() + "\t" + "...testA");
  ```

- Postman模拟并发密集访问testA

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251089.png" alt="image-20210731224215083" />



***

### 20.5 Sentinel降级

[官方文档](https://github.com/alibaba/Sentinel/wiki/熔断降级)

#### 20.5.1 概述

**官方介绍**

- 除了流量控制以外，对调用链路中不稳定的资源进行熔断降级也是保障高可用的重要措施之一。一个服务常常会调用别的模块，可能是另外的一个远程服务、数据库，或者第三方 API 等。例如，支付的时候，可能需要远程调用银联提供的 API；查询某个商品的价格，可能需要进行数据库查询。然而，这个被依赖服务的稳定性是不能保证的。如果依赖的服务出现了不稳定的情况，请求的响应时间变长，那么调用服务的方法的响应时间也会变长，线程会产生堆积，最终可能耗尽业务自身的线程池，服务本身也变得不可用。
- 现代微服务架构都是分布式的，由非常多的服务组成。不同服务之间相互调用，组成复杂的调用链路。以上的问题在链路调用中会产生放大的效果。复杂链路上的某一环不稳定，就可能会层层级联，最终导致整个链路都不可用。因此我们需要对不稳定的**弱依赖服务调用**进行熔断降级，暂时切断不稳定调用，避免局部不稳定因素导致整体的雪崩。熔断降级作为保护自身的手段，**通常在客户端**（调用端）**进行配置**。

**基本介绍**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251090.png" alt="image-20210731224732811" />

- RT（平均响应时间，秒级）
  - 平均响应时间 超出阈值 且 在时间窗口内通过的请求>=5，两个条件同时满足后触发降级；
  - 窗口期过后关闭断路器；
  - RT最大4900（更大的需要通过-Dcsp.sentinel.statistic.max.rt=XXXX才能生效）。
- 异常比列（秒级）
  - QPS >= 5且异常比例（秒级统计）超过阈值时，触发降级；时间窗口结束后，关闭降级 。
- 异常数(分钟级)
  - 异常数(分钟统计）超过阈值时，触发降级；时间窗口结束后，关闭降级

**进一步说明**

- Sentinel熔断降级会在调用链路中某个资源出现不稳定状态时（例如调用超时或异常比例升高），对这个资源的调用进行限制，让请求快速失败，避免影响到其他的资源而导致级联事务；
- 当资源被降级后，在接下来的降级时间窗口之内，对该资源的调用都自动熔断（默认行为是抛出DegradeException）。
- Sentinel的断路器是没有半开状态的（Sentinei 1.8.0 已有半开状态）：
  - 半开的状态系统自动去检测是否请求有异常，没有异常就关闭断路器恢复使用，有异常则继续打开断路器不可用；
  - 【见：12.3.6 服务熔断】



#### 20.5.2 降级策略实战

> **Sentinel降级-RT**

**是什么？**

- 平均响应时间(`DEGRADE_GRADE_RT`)：当1s内持续进入5个请求，对应时刻的平均响应时间（秒级）均超过阈值（ count，以ms为单位），那么在接下的时间窗口（`DegradeRule`中的`timeWindow`，以s为单位）之内，对这个方法的调用都会自动地熔断(抛出DegradeException )。注意Sentinel 默认统计的RT上限是`4900 ms`，超出此阈值的都会算作4900ms，若需要变更此上限可以通过启动配置项`-Dcsp.sentinel.statistic.max.rt=xxx`来配置。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251091.png" alt="image-20210731233437062" />

- **注意**：Sentinel 1.7.0才有**平均响应时间**（`DEGRADE_GRADE_RT`），Sentinel 1.8.0的没有这项，取而代之的是**慢调用比例**(`SLOW_REQUEST_RATIO`)。

**慢调用比例 (`SLOW_REQUEST_RATIO`)**

选择以慢调用比例作为阈值，需要设置允许的慢调用 RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。当单位统计时长（statIntervalMs）内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断。

**测试（ Sentinel 1.7.1）**

- 代码

  ```java
  @RestController
  @Slf4j
  public class FlowLimitController {
  	...
  
      @GetMapping("/testD")
      public String testD() {
          try {
              TimeUnit.SECONDS.sleep(1);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          log.info("testD 测试RT");
          return "------testD";
      }
  }
  ```

- 配置

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251092.png" alt="image-20210731231524896" />

- jmeter压测

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251093.png" alt="image-20210731232454053" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251094.png" alt="image-20210801085518921" />

- 结论

  按照上述配置，永远一秒钟打进来10个线程（大于5个了）调用testD，我们希望200毫秒处理完本次任务，如果超过200毫秒还没处理完，在未来1秒钟的时间窗口内，断路器打开（保险丝跳闸）微服务不可用，保险丝跳闸断电了后续停止jmeter，没有这么大的访问量了，断路器关闭（保险丝恢复），微服务恢复OK。



> **Sentinel降级-异常比例**

**是什么？**

异常比例(`DEGRADE_GRADE_EXCEPTION_RATIO`)：当资源的每秒请求量 >= 5，并且每秒异常总数占通过量的比值超过阈值（ DegradeRule中的 count）之后，资源进入降级状态，即在接下的时间窗口( DegradeRule中的timeWindow，以s为单位）之内，对这个方法的调用都会自动地返回。异常比率的阈值范围是[0.0, 1.0]，代表0% -100%。

**注意**，与Sentinel 1.8.0相比，有些不同（Sentinel 1.8.0才有的半开状态），Sentinel 1.8.0的如下：

异常比例 (ERROR_RATIO)：当单位统计时长（statIntervalMs）内请求数目大于设置的最小请求数目，并且异常的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。异常比率的阈值范围是 [0.0, 1.0]，代表 0% - 100%。

**测试（Sentinel 1.7.1）**

- 代码

  ```java
  @RestController
  @Slf4j
  public class FlowLimitController {
  
      ...
  
      @GetMapping("/testD")
      public String testD() {
          log.info("testD 异常比例");
          int age = 10/0;
          return "------testD";
      }
  }
  
  ```

- 配置

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251095.png" alt="image-20210801090637646" />

- jmeter

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251096.png" alt="image-20210731233842338" />

- 结论

  - 按照上述配置，单独访问一次，必然来一次报错一次(int age = 10/0)，调一次错一次。

  - 开启jmeter后，直接高并发发送请求，多次调用达到我们的配置条件了。断路器开启(保险丝跳闸)，微服务不可用了，不再报错error而是服务降级了。
  
  - 效果：
  
    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251097.png" alt="image-20210801090831283" />
  
    ![image-20210801090803634](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251098.png)
  
    



> **Sentinel降级-异常数**

**是什么？**

- 异常数( `DEGRADE_GRADF_EXCEPTION_COUNT` )：当资源近1分钟的异常数目超过阈值之后会进行熔断。注意由于统计时间窗口是分钟级别的，若`timeWindow`小于60s，则结束熔断状态后码可能再进入熔断状态。
- **异常数是按照分钟统计的，时间窗口一定要大于等于60秒**
- <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251099.png" alt="image-20210731234415679" />

**注意**，与Sentinel 1.8.0相比，有些不同（Sentinel 1.8.0才有的半开状态），Sentinel 1.8.0的如下：

- 异常数 (ERROR_COUNT)：当单位统计时长内的异常数目超过阈值之后会自动进行熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。

**测试**

- 代码

  ```java
  @RestController
  @Slf4j
  public class FlowLimitController{
  	...
  @GetMapping("/testE")
      public String testE() {
          log.info("testE 测试异常数");
          int age = 10 / 0;
          return "------testE 测试异常数";
      }
  }
  
  ```

- 配置

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251100.png" alt="image-20210801091056136" />

- 访问：http://localhost:8401/testE，第一次访问绝对报错，因为除数不能为零，我们看到error窗口，但是达到5次报错后，进入熔断后降级。



***

### 20.6 热点key限流

#### 20.6.1 基本介绍

[官网说明](https://github.com/alibaba/Sentinel/wiki/%E7%83%AD%E7%82%B9%E5%8F%82%E6%95%B0%E9%99%90%E6%B5%81)

> **概述**

何为热点？热点即经常访问的数据。很多时候我们希望统计某个热点数据中访问频次最高的 Top K 数据，并对其访问进行限制。比如：

- 商品 ID 为参数，统计一段时间内最常购买的商品 ID 并进行限制
- 用户 ID 为参数，针对一段时间内频繁访问的用户 ID 进行限制

热点参数限流会统计传入参数中的热点参数，并根据配置的限流阈值与模式，对包含热点参数的资源调用进行限流。热点参数限流可以看做是一种特殊的流量控制，仅对包含热点参数的资源调用生效。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251101.png" alt="sentinel-hot-param-overview-1" />

Sentinel 利用 LRU 策略统计最近最常访问的热点参数，结合令牌桶算法来进行参数级别的流控。热点参数限流支持集群模式。



> **承上启下复习start**

兜底方法，分为系统默认和客户自定义，两种：

- 之前的case，限流出问题后，都是用sentinel系统默认的提示: Blocked by Sentinel (flow limiting)

- 我们能不能自定？类似hystrix，某个方法出问题了，就找对应的**兜底降级方法**

- 结论 ：从`HystrixCommand`到`@SentinelResource`



> **代码**

```java
@RestController
@Slf4j
public class FlowLimitController {

   ......

    /**
     * @Description 热点key限流，兜底方法 deal_testHotKey
     * @param p1 : 
     * @param p2    :         
     * @return java.lang.String
     */
    @GetMapping("/testHotKey")
    @SentinelResource(value = "testHotKey", blockHandler = "deal_testHotKey")
    public String testHotKeys(@RequestParam(value = "p1", required = false) String p1,
                              @RequestParam(value = "p2", required = false) String p2) {
        return "**********testHotKey";
    }


    /**
     * @Description 兜底方法
     * @param p1 :
     * @param p2 :
     * @param blockException :
     * @return java.lang.String
     */
    public String deal_testHotKey(String p1, String p2, BlockException blockException) {
        return "------deal_testHotKey,o(╥﹏╥)o";
    }
}
```



> **配置**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251102.png" alt="image-20210801095456903" />

- `@SentinelResource(value = "testHotKey", blockHandler = "dealHandler_testHotKey")`

  方法testHotKey里面第一个参数只要QPS超过每秒1次，马上降级处理

- 异常用了我们自己定义的兜底方法`dealTestHotKey`



> **测试**

error

- http://localhost:8401/testHotKey?p1=abc
- http://localhost:8401/testHotKey?p1=abc&p2=33

right

- http://localhost:8401/testHotKey?p2=33（不受监控，设置的第一个参数是p1）

#### 20.6.2 参数例外项

上述案例演示了第一参数p1，当QPS超过了1秒1次点击后马上限流。

**特例情况**

- 普通：超过每秒钟一个请求后，达到阈值1后马上被限流
- 我们期望p1参数当它是某个特殊值的时候，它的限流值和平时不一样
- **特例**：假如当p1的值等于**5**时，它的阙值可以达到200

**配置**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251103.png" alt="image-20210801101838992" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251104.png" alt="image-20210801101902106" />

**测试**

- right：http://localhost:8401/testHotKey?p1=5
- error：http://localhost:8401/testHotKey?p1=3
- 当p1等于5的时候，阈值变为200
- 当p1不等于5的时候，阈值就是平常的1

**`前提条件：热点参数的注意点，参数必须是基本类型或者String`**

**手动添加异常看看效果**

```java
 
 @GetMapping("/testHotKey")
    @SentinelResource(value = "testHotKey", blockHandler = "dealTestHotKey")
    public String testHotKeys(@RequestParam(value = "p1", required = false) String p1,
                              @RequestParam(value = "p2", required = false) String p2) {
        int age = 10 / 0;  //添加运行异常
        return "**********testHotKey";
    }
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251105.png" alt="image-20210801102347401" />

**结论**

- `@SentinelResource` ：处理的是sentinel控制台配置的违规情况，有blockHandler方法配置的兜底处理；

- RuntimeException int age = 10/0，这个是java运行时报出的运行时异常RunTimeException，@SentinelResource不管；

- 总结 ：`@SentinelResource`主管**配置出错**，运行出错该走异常走异常。

> ### 系统规则（了解）

[官方文档](https://github.com/alibaba/Sentinel/wiki/系统自适应限流)

Sentinel 系统自适应限流从整体维度对应用入口流量进行控制，结合应用的 Load、CPU 使用率、总体平均 RT、入口 QPS 和并发线程数等几个维度的监控指标，通过自适应的流控策略，让系统的入口流量和系统的负载达到一个平衡，让系统尽可能跑在最大吞吐量的同时保证系统整体的稳定性。

**系统规则**

- 系统保护规则是从应用级别的入口流量进行控制，从单台机器的 load、CPU 使用率、平均 RT、入口 QPS 和并发线程数等几个维度监控应用指标，让系统尽可能跑在最大吞吐量的同时保证系统整体的稳定性。

- 系统保护规则是应用整体维度的，而不是资源维度的，并且**仅对入口流量生效**。入口流量指的是进入应用的流量（EntryType.IN），比如 Web 服务或 Dubbo 服务端接收的请求，都属于入口流量。

- **系统规则支持以下的模式**：
  - Load 自适应（仅对 Linux/Unix-like 机器生效）：系统的 load1 作为启发指标，进行自适应系统保护。当系统 load1 超过设定的启发值，且系统当前的并发线程数超过估算的系统容量时才会触发系统保护（BBR 阶段）。系统容量由系统的 maxQps * minRt 估算得出。设定参考值一般是 CPU cores * 2.5；
  - CPU usage（1.5.0+ 版本）：当系统 CPU 使用率超过阈值即触发系统保护（取值范围 0.0-1.0），比较灵敏；
  - 平均 RT：当单台机器上所有入口流量的平均 RT 达到阈值即触发系统保护，单位是毫秒；
  - 并发线程数：当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护；
  - 入口 QPS：当单台机器上所有入口流量的 QPS 达到阈值即触发系统保护。

***

### 20.7 @SentinelResource配置

#### 20.7.1 SentinelResource配置(上)

> **按资源名称限流+后续处理**

**启动nacos成功**

**启动sentinel成功**

Module：**`cloudalibaba-sentinel-service8401`**

- 新增RateLimitController

  ```java
  @RestController
  public class RateLimitController {
  
      @GetMapping("/byResource")
      @SentinelResource(value = "byResource", blockHandler = "handleException")
      public CommonResult byResource() {
          return new CommonResult(200, "按资源名称限流测试OK", new Payment(2020L, "serial001"));
      }
  
      public CommonResult handleException(BlockException exception) {
          return new CommonResult(444, exception.getClass().getCanonicalName() + "\t 服务不可用");
      }
  
  }
  ```

**配置流控规则**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251106.png" alt="image-20210801184239275" />

- 表示1秒钟内查询次数大于1，就跑到我们自定义的处流，限流。

**测试**

- 1秒钟点击1下，OK

- 超过上述，疯狂点击，返回了自己定义的限流处理信息，限流发生

- ```
  {"code":444, "message":"com.alibaba.csp.sentinel.slots.block.flow.FlowException\t 服务不可用", "data":null}
  ```
  
  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251107.png" alt="image-20210801184417919" />

**额外问题**

此时关闭微服务8401 -> Sentinel控制台，流控规则消失了

> **按照Url地址限流 + 后续处理**

- 通过访问的URL来限流，会返回Sentinel自带默认的限流处理信息

- 业务类RateLimitController

    ```java
    @RestController
    public class RateLimitController
    {
    	...
    
        @GetMapping("/rateLimit/byUrl")
        @SentinelResource(value = "byUrl")
        public CommonResult byUrl()
        {
            return new CommonResult(200,"按url限流测试OK",new Payment(2020L,"serial002"));
        }
    }
    ```

    **Sentinel控制台配置**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251108.png" alt="image-20210801132812228" />

**测试**

- 快速点击：http://localhost:8401/rateLimit/byUrl
- 结果 - 会返回Sentinel自带的限流处理结果 Blocked by Sentinel (flow limiting)

**上面兜底方案面临的问题**

1. 系统默认的，没有体现我们自己的业务要求；
2. 依照现有条件，我们自定义的处理方法又和业务代码耦合在一块，不直观；
3. 每个业务方法都添加—个兜底的，那代码膨胀加剧；
4. 全局统—的处理方法没有体现。



#### 20.7.2 SentinelResource配置(中)

>   **客户自定义限流处理逻辑**

创建`CustomerBlockHandler`类用于自定义限流处理逻辑：

```java
public class CustomerBlockHandler {
    public static CommonResult handlerException(BlockException exception) {
        return new CommonResult(4444,"按客戶自定义,global handlerException----1");
    }
    
    public static CommonResult handlerException2(BlockException exception) {
        return new CommonResult(4444,"按客戶自定义,global handlerException----2");
    }
}

```

RateLimitController

```java
@RestController
public class RateLimitController {
	...

    @GetMapping("/rateLimit/customerBlockHandler")
    @SentinelResource(value = "customerBlockHandler",
            blockHandlerClass = CustomerBlockHandler.class,//自定义限流处理类
            blockHandler = "handlerException2") //兜底方法
    public CommonResult customerBlockHandler()
    {
        return new CommonResult(200,"按客戶自定义",new Payment(2020L,"serial003"));
    }
}
```

Sentinel控制台配置

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251109.png" alt="image-20210801190152637" />

测试

- 启动微服务后先调用一次： http://localhost:8401/rateLimit/customerBlockHandler
- 接着多次快速刷新：http://localhost:8401/rateLimit/customerBlockHandler 。我们自定义的字符串信息就出来了



#### 20.7.3 SentinelResource配置(下)

> **@SentinelResource 注解**

**注意：注解方式埋点不支持 private 方法**。

`@SentinelResource` 用于定义资源，并提供可选的异常处理和 fallback 配置项。 `@SentinelResource` 注解包含以下属性：

- `value`：资源名称，必需项（不能为空）
- `entryType`：entry 类型，可选项（默认为 `EntryType.OUT`）
- `blockHandler / blockHandlerClass`：`blockHandler `对应处理 `BlockException` 的函数名称，可选项。blockHandler 函数访问范围需要是 `public`，返回类型需要与原方法相匹配，参数类型需要和原方法相匹配并且最后加一个额外的参数，类型为 `BlockException`。blockHandler 函数默认需要和原方法在同一个类中。若希望使用其他类的函数，则可以指定 `blockHandlerClass `为对应的类的 Class 对象，注意对应的函数必需为 `static 函数`，否则无法解析。
- `fallback /fallbackClass`：fallback 函数名称，可选项，用于在抛出异常的时候提供 fallback 处理逻辑。fallback 函数可以针对所有类型的异常（除了`exceptionsToIgnore`里面排除掉的异常类型）进行处理。fallback 函数签名和位置要求：
  - 返回值类型必须与原函数返回值类型一致；
  - 方法参数列表需要和原函数一致，或者可以额外多一个 Throwable 类型的参数用于接收对应的异常。
  - fallback 函数默认需要和原方法在同一个类中。若希望使用其他类的函数，则可以指定 fallbackClass 为对应的类的 Class 对象，注意对应的函数必需为 static 函数，否则无法解析。
- `defaultFallback（since 1.6.0）`：默认的 fallback 函数名称，可选项，通常用于通用的 fallback 逻辑（即可以用于很多服务或方法）。默认 fallback 函数可以针对所有类型的异常（除了`exceptionsToIgnore`里面排除掉的异常类型）进行处理。若同时配置了 fallback 和 defaultFallback，则只有 fallback 会生效。defaultFallback 函数签名要求：
  - 返回值类型必须与原函数返回值类型一致；
  - 方法参数列表需要为空，或者可以额外多一个 Throwable 类型的参数用于接收对应的异常。
  - defaultFallback 函数默认需要和原方法在同一个类中。若希望使用其他类的函数，则可以指定 fallbackClass 为对应的类的 Class 对象，注意对应的函数必需为 static 函数，否则无法解析。
- `exceptionsToIgnore（since 1.6.0）`：用于指定哪些异常被排除掉，不会计入异常统计中，也不会进入 fallback 逻辑中，而是会原样抛出。



> **Sentinel主要有三个核心Api**

1. SphU定义资源
2. Tracer定义统计
3. ContextUtil定义了上下文



***

### 20.8 服务熔断功能

**sentinel整合ribbon+openFeign+fallback**

#### 20.8.1 Sentinel服务熔断Ribbon

> **启动nacos和启动sentinel**
>
> **新建9003/9004**
>
> **新建消费者84**

**新建提供者`cloudalibaba-provider-payment9003/9004`**

- POM

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <project xmlns="http://maven.apache.org/POM/4.0.0"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
      <parent>
          <artifactId>springcloud2020</artifactId>
          <groupId>com.gyz.clouddemo</groupId>
          <version>1.0-SNAPSHOT</version>
      </parent>
      <modelVersion>4.0.0</modelVersion>
  
      <artifactId>cloudalibaba-provider-payment9003</artifactId>
  
      <dependencies>
          <!--SpringCloud ailibaba nacos -->
          <dependency>
              <groupId>com.alibaba.cloud</groupId>
              <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
          </dependency>
          <dependency><!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
              <groupId>com.gyz.clouddemo</groupId>
              <artifactId>cloud-api-commons</artifactId>
              <version>${project.version}</version>
          </dependency>
          <!-- SpringBoot整合Web组件 -->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-actuator</artifactId>
          </dependency>
          <!--日常通用jar包配置-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-devtools</artifactId>
              <scope>runtime</scope>
              <optional>true</optional>
          </dependency>
          <dependency>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <optional>true</optional>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-test</artifactId>
              <scope>test</scope>
          </dependency>
      </dependencies>
  
  </project>
  ```

- YML

  ```yaml
  server:
    port: 9003
  
  spring:
    application:
      name: nacos-payment-provider
    cloud:
      nacos:
        discovery:
          server-addr: localhost:8848 #配置Nacos地址
  
  management:
    endpoints:
      web:
        exposure:
          include: '*'
  ```

- 主启动

  ```java
  @SpringBootApplication
  @EnableDiscoveryClient
  public class PaymentMain9003 {
      public static void main(String[] args) {
          SpringApplication.run(PaymentMain9003.class, args);
      }
  }
  ```

- 业务类

  ```java
  @RestController
  public class PaymentController {
  
      @Value("${server.port}")
      private String serverPort;
  
      //模拟数据库
      public static HashMap<Long, Payment> hashMap = new HashMap<>();
  
      static {
          hashMap.put(1L, new Payment(1L, "28a8c1e3bc2742d8848569891fb42181"));
          hashMap.put(2L, new Payment(2L, "bba8c1e3bc2742d8848569891ac32182"));
          hashMap.put(3L, new Payment(3L, "6ua8c1e3bc2742d8848569891xt92183"));
      }
  
      @GetMapping("/paymentSQL/{id}")
      public CommonResult<Payment> paymentSQL(@PathVariable("id") Long id) {
          Payment payment = hashMap.get(id);
          CommonResult<Payment> result = new CommonResult(200, "from mysql,serverPort:  " + serverPort, payment);
          return result;
      }
  
  }
  ```

- 测试

  http://localhost:9003/paymentSQL/1

**新建消费者84`cloudalibaba-consumer-nacos-order84`**

- POM

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <project xmlns="http://maven.apache.org/POM/4.0.0"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
      <parent>
          <artifactId>springcloud2020</artifactId>
          <groupId>com.gyz.clouddemo</groupId>
          <version>1.0-SNAPSHOT</version>
      </parent>
      <modelVersion>4.0.0</modelVersion>
  
      <groupId>com.gyz.clouddemo</groupId>
      <artifactId>cloudalibaba-consumer-nacos-order84</artifactId>
  
      <dependencies>
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-openfeign</artifactId>
          </dependency>
          <!--SpringCloud ailibaba nacos -->
          <dependency>
              <groupId>com.alibaba.cloud</groupId>
              <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
          </dependency>
          <!--SpringCloud ailibaba sentinel -->
          <dependency>
              <groupId>com.alibaba.cloud</groupId>
              <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
          </dependency>
          <!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
          <dependency>
              <groupId>com.gyz.clouddemo</groupId>
              <artifactId>cloud-api-commons</artifactId>
              <version>${project.version}</version>
          </dependency>
          <!-- SpringBoot整合Web组件 -->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-actuator</artifactId>
          </dependency>
          <!--日常通用jar包配置-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-devtools</artifactId>
              <scope>runtime</scope>
              <optional>true</optional>
          </dependency>
          <dependency>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <optional>true</optional>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-test</artifactId>
              <scope>test</scope>
          </dependency>
      </dependencies>
  
  </project>
  ```

- YML

  ```yaml
  server:
    port: 84
  
  spring:
    application:
      name: nacos-order-consumer
    cloud:
      nacos:
        discovery:
          server-addr: localhost:8848
      sentinel:
        transport:
          #配置Sentinel dashboard地址
          dashboard: localhost:8080
          #默认8719端口，假如被占用会自动从8719开始依次+1扫描,直至找到未被占用的端口
          port: 8719
  
  #消费者将要去访问的微服务名称(注册成功进nacos的微服务提供者)
  service-url:
    nacos-user-service: http://nacos-payment-provider
  
  # 激活Sentinel对Feign的支持
  feign:
    sentinel:
      enabled: true
  ```

- 主启动

  ```java
  @EnableDiscoveryClient
  @SpringBootApplication
  @EnableFeignClients
  public class OrderNacosMain84 {
      public static void main(String[] args) {
          SpringApplication.run(OrderNacosMain84.class, args);
      }
  }
  ```

- 业务类

  ApplicationContextConfig

  ```java
  @Configuration
  public class ApplicationContextConfig {
  
      @Bean
      @LoadBalanced
      public RestTemplate getRestTemplate() {
          return new RestTemplate();
      }
  }
  ```

  CircleBreakerController

  ```java
  @RestController
      public class CircleBreakerController {
  
      private static final String SERVICE_URL = "http://nacos-payment-provider";
  
      @Resource
      private RestTemplate restTemplate;
  
      @GetMapping("/consumer/fallback/{id}")
      @SentinelResource(value = "fallback")
      public CommonResult<Payment> fallback(@PathVariable("id") Long id) {
  
          CommonResult<Payment> result = restTemplate.getForObject(SERVICE_URL + "/payment" + id, CommonResult.class, id);
          if (id == 4) {
              throw new IllegalArgumentException("IllegalArgumentException,非法参数异常");
          } else if (result.getData() == null) {
              throw new NullPointerException("NullPointerException,该ID没有对应记录,空指针异常");
          }
  
          return result;
      }
  }
  ```

**测试以下几种情形**

> - 没有任何配置
> - 只配置fallback
> - 只配置blockHandler
> - fallback和blockHandler都配置
> - 忽略属性
> - 测试地址 - http://localhost:84/consumer/fallback/1

- **Sentinel服务熔断无配置**

  ```java
  /**
  *	没有任何配置,用户error页面，不友好
  */
  @RestController
  @Slf4j
  public class CircleBreakerController {
      public static final String SERVICE_URL = "http://nacos-payment-provider";
  
      @Resource
      private RestTemplate restTemplate;
   
      @RequestMapping("/consumer/fallback/{id}")
      @SentinelResource(value = "fallback")//没有配置
      public CommonResult<Payment> fallback(@PathVariable Long id)
      {
          CommonResult<Payment> result = restTemplate.getForObject(SERVICE_URL + "/paymentSQL/"+id,CommonResult.class,id);
  
          if (id == 4) {
              throw new IllegalArgumentException ("IllegalArgumentException,非法参数异常....");
          }else if (result.getData() == null) {
              throw new NullPointerException ("NullPointerException,该ID没有对应记录,空指针异常");
          }
  
          return result;
      }
      
  }
  ```

- **Sentinel服务熔断只配置fallback**

  fallback只负责业务异常

  ```java
  @RestController
  @Slf4j
  public class CircleBreakerController {
      
      public static final String SERVICE_URL = "http://nacos-payment-provider";
  
      @Resource
      private RestTemplate restTemplate;
   
      @RequestMapping("/consumer/fallback/{id}")
      //@SentinelResource(value = "fallback")//没有配置
      @SentinelResource(value = "fallback", fallback = "handlerFallback") //fallback只负责业务异常
      public CommonResult<Payment> fallback(@PathVariable Long id) {
          CommonResult<Payment> result = restTemplate.getForObject(SERVICE_URL + "/paymentSQL/"+id,CommonResult.class,id);
  
          if (id == 4) {
              throw new IllegalArgumentException ("IllegalArgumentException,非法参数异常....");
          }else if (result.getData() == null) {
              throw new NullPointerException ("NullPointerException,该ID没有对应记录,空指针异常");
          }
  
          return result;
      }
      
      //本例是fallback
      public CommonResult handlerFallback(@PathVariable  Long id,Throwable e) {
          Payment payment = new Payment(id,"null");
          return new CommonResult<>(444,"兜底异常handlerFallback,exception内容  "+e.getMessage(),payment);
      }
      
  }
  
  ```

  测试地址 : http://localhost:84/consumer/fallback/4

- **Sentinel服务熔断只配置blockHandler**

  blockHandler只负责**sentinel控制台配置违规**

  ```java
  @RestController
  @Slf4j
  public class CircleBreakerController
  {
      public static final String SERVICE_URL = "http://nacos-payment-provider";
  
      @Resource
      private RestTemplate restTemplate;
  
      @RequestMapping("/consumer/fallback/{id}")
      @SentinelResource(value = "fallback",blockHandler = "blockHandler") //blockHandler只负责sentinel控制台配置违规
      public CommonResult<Payment> fallback(@PathVariable Long id)
      {
          CommonResult<Payment> result = restTemplate.getForObject(SERVICE_URL + "/paymentSQL/"+id,CommonResult.class,id);
  
          if (id == 4) {
              throw new IllegalArgumentException ("IllegalArgumentException,非法参数异常....");
          }else if (result.getData() == null) {
              throw new NullPointerException ("NullPointerException,该ID没有对应记录,空指针异常");
          }
  
          return result;
      }
  
      //本例是blockHandler
      public CommonResult blockHandler(@PathVariable  Long id,BlockException blockException) {
          Payment payment = new Payment(id,"null");
          return new CommonResult<>(445,"blockHandler-sentinel限流,无此流水: blockException  "+blockException.getMessage(),payment);
      }
  }
  
  ```

  测试地址 ： http://localhost:84/consumer/fallback/4

- **Sentinel服务熔断fallback和blockHandler都配置**

  若`blockHandler`和`fallback` 都进行了配置，则被限流降级而抛出`BlockException`时只会进入blockHandler处理逻辑

  ```java
  @RestController
  @Slf4j
  public class CircleBreakerController
  {
      public static final String SERVICE_URL = "http://nacos-payment-provider";
  
      @Resource
      private RestTemplate restTemplate;
  
      @RequestMapping("/consumer/fallback/{id}")
      @SentinelResource(value = "fallback",fallback = "handlerFallback",blockHandler = "blockHandler")
      public CommonResult<Payment> fallback(@PathVariable Long id)
      {
          CommonResult<Payment> result = restTemplate.getForObject(SERVICE_URL + "/paymentSQL/"+id,CommonResult.class,id);
  
          if (id == 4) {
              throw new IllegalArgumentException ("IllegalArgumentException,非法参数异常....");
          }else if (result.getData() == null) {
              throw new NullPointerException ("NullPointerException,该ID没有对应记录,空指针异常");
          }
  
          return result;
      }
      //本例是fallback
      public CommonResult handlerFallback(@PathVariable  Long id,Throwable e) {
          Payment payment = new Payment(id,"null");
          return new CommonResult<>(444,"兜底异常handlerFallback,exception内容  "+e.getMessage(),payment);
      }
      //本例是blockHandler
      public CommonResult blockHandler(@PathVariable  Long id,BlockException blockException) {
          Payment payment = new Payment(id,"null");
          return new CommonResult<>(445,"blockHandler-sentinel限流,无此流水: blockException  "+blockException.getMessage(),payment);
      }
  }
  
  ```

- **Sentinel服务熔断`exceptionsToIgnore`**

  exceptionsToIgnore，忽略指定异常，即这些异常不用兜底方法处理。

  ```java
  @RestController
  @Slf4j
  public class CircleBreakerController    
  
      ...
      
      @RequestMapping("/consumer/fallback/{id}")
      @SentinelResource(value = "fallback",fallback = "handlerFallback",blockHandler = "blockHandler",
              exceptionsToIgnore = {IllegalArgumentException.class})
      public CommonResult<Payment> fallback(@PathVariable Long id){
      
          CommonResult<Payment> result = restTemplate.getForObject(SERVICE_URL + "/paymentSQL/"+id,CommonResult.class,id);
  
          if (id == 4) {
              //exceptionsToIgnore属性有IllegalArgumentException.class，
              //所以IllegalArgumentException不会跳入指定的兜底程序。
              throw new IllegalArgumentException ("IllegalArgumentException,非法参数异常....");
          }else if (result.getData() == null) {
              throw new NullPointerException ("NullPointerException,该ID没有对应记录,空指针异常");
          }
  
          return result;
      }
  
  	...
  }
  
  ```



#### 20.8.2 Sentinel服务熔断OpenFeign

> **修改84模块**
>
> - 84消费者调用提供者9003
> - Feign组件一般是消费侧

POM

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

YML

```xml
# 激活Sentinel对Feign的支持
feign:
  sentinel:
    enabled: true
```

业务类

- 带@Feignclient注解的业务接口，fallback = PaymentFallbackService.class

- ```java
  @FeignClient(value = "nacos-payment-provider",fallback = PaymentFallbackService.class)
  public interface PaymentService{
      @GetMapping(value = "/paymentSQL/{id}")
      public CommonResult<Payment> paymentSQL(@PathVariable("id") Long id);
  }
  ```

- ```java
  @Component
  public class PaymentFallbackService implements PaymentService {
      @Override
      public CommonResult<Payment> paymentSQL(Long id)
      {
          return new CommonResult<>(44444,"服务降级返回,---PaymentFallbackService",new Payment(id,"errorSerial"));
      }
  }
  
  ```

Controller

```java
@RestController
@Slf4j
public class CircleBreakerController {

    ...
    
	//==================OpenFeign
    @Resource
    private PaymentService paymentService;

    @GetMapping(value = "/consumer/paymentSQL/{id}")
    public CommonResult<Payment> paymentSQL(@PathVariable("id") Long id){
        return paymentService.paymentSQL(id);
    }
}

```

主启动

```java
@EnableDiscoveryClient
@SpringBootApplication
@EnableFeignClients
public class OrderNacosMain84 {
    public static void main(String[] args) {
        SpringApplication.run(OrderNacosMain84.class, args);
    }
}
```

**测试**

- http://localhost:84/consumer/paymentSQL/1
- 测试84调用9003，此时故意关闭9003微服务提供者，**84消费侧自动降级**

**熔断框架比较**

|                |                          Sentinel                          | Hystrix                | resilience4j                     |
| -------------- | :--------------------------------------------------------: | ---------------------- | -------------------------------- |
| 隔离策略       |                信号量隔离（并发线程数限流）                | 线程池隔商/信号量隔离  | 信号量隔离                       |
| 熔断降级策略   |               基于响应时间、异常比率、异常数               | 基于异常比率           | 基于异常比率、响应时间           |
| 实时统计实现   |                   滑动窗口（LeapArray）                    | 滑动窗口（基于RxJava） | Ring Bit Buffer                  |
| 动态规则配置   |                       支持多种数据源                       | 支持多种数据源         | 有限支持                         |
| 扩展性         |                         多个扩展点                         | 插件的形式             | 接口的形式                       |
| 基于注解的支持 |                            支持                            | 支持                   | 支持                             |
| 限流           |              基于QPS，支持基于调用关系的限流               | 有限的支持             | Rate Limiter                     |
| 流量整形       |            支持预热模式匀速器模式、预热排队模式            | 不支持                 | 简单的Rate Limiter模式           |
| 系统自适应保护 |                            支持                            | 不支持                 | 不支持                           |
| 控制台         | 提供开箱即用的控制台，可配置规则、查看秒级监控，机器发观等 | 简单的监控查看         | 不提供控制台，可对接其它监控系统 |



***

### 20.9 Sentinel持久化规则

#### 20.9.1 是什么

一旦我们重启应用，sentinel规则将消失，生产环境需要将配置规则进行持久化。

#### 20.9.2 怎么玩

将限流配置规则持久化进Nacos保存，只要刷新8401某个rest地址，sentinel控制台的流控规则就能看到，只要Nacos里面的配置不删除，针对8401上sentinel上的流控规则持续有效。

#### 20.9.3 步骤

**修改`cloudalibaba-sentinel-service8401`**

- POM

  ```xml
  <dependency>
      <groupId>com.alibaba.csp</groupId>
      <artifactId>sentinel-datasource-nacos</artifactId>
  </dependency>
  ```

- YML

  ```yaml
  server:
    port: 8401
  
  spring:
    application:
      name: cloudalibaba-sentinel-service
    cloud:
      nacos:
        discovery:
          server-addr: localhost:8848 #Nacos服务注册中心地址
      sentinel:
        transport:
          dashboard: localhost:8080 #配置Sentinel dashboard地址
          port: 8719
        datasource: #<---------------------------关注点，添加Nacos数据源配置
          ds1:
            nacos:
              server-addr: localhost:8848
              dataId: cloudalibaba-sentinel-service
              groupId: DEFAULT_GROUP
              data-type: json
              rule-type: flow
  
  management:
    endpoints:
      web:
        exposure:
          include: '*'
  
  feign:
    sentinel:
      enabled: true # 激活Sentinel对Feign的支持
  ```

- 添加Nacos业务规则配置

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251110.png" alt="image-20210801204315759" />

  配置内容解析

  ```json
  [{
      "resource": "/rateLimit/byUrl",
      "IimitApp": "default",
      "grade": 1,
      "count": 1, 
      "strategy": 0,
      "controlBehavior": 0,
      "clusterMode": false
  }]
  ```

  - resource：资源名称；
  - limitApp：来源应用；
  - grade：阈值类型，0表示线程数, 1表示QPS；
  - count：单机阈值；
  - strategy：流控模式，0表示直接，1表示关联，2表示链路；
  - controlBehavior：流控效果，0表示快速失败，1表示Warm Up，2表示排队等待；
  - clusterMode：是否集群。

- 启动8401后刷新sentinel发现业务规则有了

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251111.png" alt="image-20210801204524402" />

- 快速访问测试接口

  - http://localhost:8401/rateLimit/byUrl - 页面返回`Blocked by Sentinel (flow limiting)`

    

- 停止8401再看sentinel - 停机后发现流控规则没有了

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251112.png" alt="image-20210801204716682" />

- 重新启动8401再看sentinel

  - 乍一看还是没有，稍等一会儿
  - 多次调用 - http://localhost:8401/rateLimit/byUrl
  - 重新配置出现了，持久化验证通过



***

## 21、Spring Cloud Alibaba Seata处理分布式事务

### 21.1 分布式事务问题

**分布式前**

- 单机库存没这个问题
- 从1:1->1:N->N:N

**分布式之后**

- 单体应用被拆分成微服务应用，原来的三个模块被拆分成三个独立的应用，分别使用三个独立的数据源，业务操作需要调用三个服务来完成。此时**每个服务内部的数据一致性由本地事务来保证， 但是全局的数据一致性问题没法保证**。
- 用户购买商品的逻辑，整个业务由三个微服务提供支持：
  - 仓储服务：对给定的商品扣除仓储数量
  - 订单服务：根据采购需求创建订单
  - 账户服务：从用户账户中扣除余额
  - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251113.png" alt="image-20210803000948862" />

**一句话：一次业务操作需要垮多个数据源或需要垮多个系统进行远程调用,就会产生分布式事务问题！**

***

### 21.2 Seata简介

> **是什么**

- 官网地址：http://seata.io/zh-cn/

- Seata是一款开源的分布式事务解决方案，致力于在微服务架构下提供高性能和简单易用的分布式事务服务



> **能干嘛**

一个典型的分布式事务过程：

- 分布式事务处理过程-ID+三组件模型

  - Transaction ID(XID)：全局唯一的事务id
  - 三组件概念
    - `Transaction Coordinator(TC)`：事务协调器，维护全局事务的运行状态，负责协调并驱动全局事务的提交或回滚
    - `Transaction Manager(TM)`：控制全局事务的边界，负责开启一个全局事务，并最终发起全局提交或全局回滚的决议
    - `Resource Manager(RM)`：控制分支事务，负责分支注册、状态汇报，并接受事务协调的指令，驱动分支(本地)事务的提交和回滚

- 处理过程

  1. TM向TC申请开启一个全局事务，全局事务创建成功并生成一个全局唯一的XID；
  2. XID在微服务调用链路的上下文中传播；
  3. RM向TC注册分支事务，将其纳入XID对应全局事务的管辖；
  4. TM向TC发起针对XID的全局提交或回滚决议；
  5. TC调度XID下管辖的全部分支事务完成提交或回滚请求。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251114.png" alt="image-20210803002330061" />



> **去哪下载**

发布说明: https://github.com/seata/seata/releases



> **怎么玩**

1. 本地@Transational

2. 全局@GlobalTranstional

   - seata的分布式交易解决方案

     <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251115.png" alt="image-20210803003136030" />

   - 我们只需要使用一个 `@GlobalTransactional` 注解在业务方法上；

***

### 21.3 Seata-Server安装

1. 官网地址：https://seata.io/zh-cn/

2. 下载版本：0.9.0

3. `seata-server-0.9.0.zip`解压到指定目录并修改`conf`目录下的`file.conf`配置文件

   - 先备份`原始file.conf`文件

   - 主要修改：自定义事务组名称 + 事务日志存储模式为db + 数据库连接

   - file.conf

     - service模块

       ```
       service {
           ##fsp_tx_group是自定义的
           vgroup_mapping.my.test.tx_group="fsp_tx_group" 
           default.grouplist = "127.0.0.1:8091"
           enableDegrade = false
           disable = false
           max.commitretry.timeout= "-1"
           max.ollbackretry.timeout= "-1"
       }
       ```

     - store模块

       <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251116.png" alt="image-20210803233226407" />

       <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251117.png" alt="image-20210803233250935" />

       ```
       ## transaction log store
       store {
       	## store mode: file, db
       	## 改成db
       	mode = "db"
       	
       	## file store
       	file {
       		dir = "sessionStore"
       		
       		# branch session size, if exceeded first try compress lockkey, still exceeded throws exceptions
       		max-branch-session-size = 16384
       		# globe session size, if exceeded throws exceptions
       		max-global-session-size = 512
       		# file buffer size, if exceeded allocate new buffer
       		file-write-buffer-cache-size = 16384
       		# when recover batch read size
       		session.reload.read_size= 100
       		# async, sync
       		flush-disk-mode = async
       	}
       
       	# database store
       	db {
       		## the implement of javax.sql.DataSource, such as DruidDataSource(druid)/BasicDataSource(dbcp) etc.
       		datasource = "dbcp"
       		## mysql/oracle/h2/oceanbase etc.
       		## 配置数据源
       		db-type = "mysql"
       		driver-class-name = "com.mysql.jdbc.Driver"
       		url = "jdbc:mysql://127.0.0.1:3306/seata"
       		user = "root"
       		password = "你自己密码"
       		min-conn= 1
       		max-conn = 3
       		global.table = "global_table"
       		branch.table = "branch_table"
       		lock-table = "lock_table"
       		query-limit = 100
       	}
       }
       ```

   4. mysql5.7数据库新建库`seata`

      - 建表`db_store.sql`在`seata-server-0.9.0\seata\conf`目录里面

      - ```sql
        -- the table to store GlobalSession data
        drop table if exists `global_table`;
        create table `global_table` (
          `xid` varchar(128)  not null,
          `transaction_id` bigint,
          `status` tinyint not null,
          `application_id` varchar(32),
          `transaction_service_group` varchar(32),
          `transaction_name` varchar(128),
          `timeout` int,
          `begin_time` bigint,
          `application_data` varchar(2000),
          `gmt_create` datetime,
          `gmt_modified` datetime,
          primary key (`xid`),
          key `idx_gmt_modified_status` (`gmt_modified`, `status`),
          key `idx_transaction_id` (`transaction_id`)
        );
        
        -- the table to store BranchSession data
        drop table if exists `branch_table`;
        create table `branch_table` (
          `branch_id` bigint not null,
          `xid` varchar(128) not null,
          `transaction_id` bigint ,
          `resource_group_id` varchar(32),
          `resource_id` varchar(256) ,
          `lock_key` varchar(128) ,
          `branch_type` varchar(8) ,
          `status` tinyint,
          `client_id` varchar(64),
          `application_data` varchar(2000),
          `gmt_create` datetime,
          `gmt_modified` datetime,
          primary key (`branch_id`),
          key `idx_xid` (`xid`)
        );
        
        -- the table to store lock data
        drop table if exists `lock_table`;
        create table `lock_table` (
          `row_key` varchar(128) not null,
          `xid` varchar(96),
          `transaction_id` long ,
          `branch_id` long,
          `resource_id` varchar(256) ,
          `table_name` varchar(32) ,
          `pk` varchar(36) ,
          `gmt_create` datetime ,
          `gmt_modified` datetime,
          primary key(`row_key`)
        );
        
        ```

   5. 修改`seata-server-0.9.0\seata\conf`目录下的`registry.conf`目录下的`registry.conf`配置文件

      <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251118.png" alt="image-20210803232105525" />

      ```
      registry {
        # file 、nacos 、eureka、redis、zk、consul、etcd3、sofa
        # 改用为nacos
        type = "nacos"
      
        nacos {
        	## 加端口号
          serverAddr = "localhost:8848"
          namespace = ""
          cluster = "default"
        }
        ...
      }
      ```

   6. 先启动Nacos端口号8848：`nacos\bin\startup.cmd`

   7. 再启动seata-server：`seata-server-0.9.0\seata\bin` - `seata-server.bat`

   

***

### 21.4 订单/库存/账户业务数据库准备

**注意：以下演示都需要先启动Nacos后启动Seata,保证两个都OK ！**

**分布式事务业务说明**

- 这里我们会创建三个服务，一个订单服务，一个库存服务，一个账户服务；
- 当用户下单时,会在订单服务中创建一个订单, 然后通过远程调用库存服务来扣减下单商品的库存，再通过远程调用账户服务来扣减用户账户里面的余额，最后在订单服务中修改订单状态为已完成；
- 该操作跨越三个数据库，有两次远程调用，很明显会有分布式事务问题。

**创建业务数据库**

- seata_order：存储订单的数据库

- seata_storage：存储库存的数据库

- seata_account：存储账户信息的数据库

- 建表SQL

  ```
  create database seata_order;
  create database seata_storage;
  create database seata_account;
  ```

**按照上述3库分别建立对应业务表**

- `seata_order`库下新建`t_order`表

  ```sql
  DROP TABLE IF EXISTS `t_order`;
  CREATE TABLE `t_order`  (
    `int` bigint(11) NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) DEFAULT NULL COMMENT '用户id',
    `product_id` bigint(11) DEFAULT NULL COMMENT '产品id',
    `count` int(11) DEFAULT NULL COMMENT '数量',
    `money` decimal(11, 0) DEFAULT NULL COMMENT '金额',
    `status` int(1) DEFAULT NULL COMMENT '订单状态:  0:创建中 1:已完结',
    PRIMARY KEY (`int`) USING BTREE
  ) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '订单表' ROW_FORMAT = Dynamic;
  ```

- `seata_storage`库下建`t_storage`表

  ```sql
  DROP TABLE IF EXISTS `t_storage`;
  CREATE TABLE `t_storage`  (
    `int` bigint(11) NOT NULL AUTO_INCREMENT,
    `product_id` bigint(11) DEFAULT NULL COMMENT '产品id',
    `total` int(11) DEFAULT NULL COMMENT '总库存',
    `used` int(11) DEFAULT NULL COMMENT '已用库存',
    `residue` int(11) DEFAULT NULL COMMENT '剩余库存',
    PRIMARY KEY (`int`) USING BTREE
  ) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '库存' ROW_FORMAT = Dynamic;
  INSERT INTO `t_storage` VALUES (1, 1, 100, 0, 100);
  ```

- `seata_account`库下建`t_account`表

  ```sql
  DROP TABLE IF EXISTS `t_account`;
  CREATE TABLE `t_account`  (
    `id` bigint(11) NOT NULL COMMENT 'id',
    `user_id` bigint(11) DEFAULT NULL COMMENT '用户id',
    `total` decimal(10, 0) DEFAULT NULL COMMENT '总额度',
    `used` decimal(10, 0) DEFAULT NULL COMMENT '已用余额',
    `residue` decimal(10, 0) DEFAULT NULL COMMENT '剩余可用额度',
    PRIMARY KEY (`id`) USING BTREE
  ) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '账户表' ROW_FORMAT = Dynamic;
   
  INSERT INTO `t_account` VALUES (1, 1, 1000, 0, 1000);
  ```

**按照上述3库分别建立对应的回滚日志表**

- 订单-库存-账户3个库下都需要建各自独立的回滚日志表

- sql目录：`seata-server-0.9.0\seata\conf\目录下的db_undo_log.sql`

- 建表SQL

  ```sql
  -- the table to store seata xid data
  -- 0.7.0+ add context
  -- you must to init this sql for you business databese. the seata server not need it.
  -- 此脚本必须初始化在你当前的业务数据库中，用于AT 模式XID记录。与server端无关（注：业务数据库）
  -- 注意此处0.3.0+ 增加唯一索引 ux_undo_log
  drop table `undo_log`;
  CREATE TABLE `undo_log` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `branch_id` bigint(20) NOT NULL,
    `xid` varchar(100) NOT NULL,
    `context` varchar(128) NOT NULL,
    `rollback_info` longblob NOT NULL,
    `log_status` int(11) NOT NULL,
    `log_created` datetime NOT NULL,
    `log_modified` datetime NOT NULL,
    `ext` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_undo_log` (`xid`,`branch_id`)
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
  ```

  

***

### 21.5 订单/库存/账户业务微服务准备

> **业务需求**

下订单->减库存->扣余额->改(订单)状态



> **新建订单Order-Module**

1. 新建Moudle - `seata-order-service2001`

2. POM

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <project xmlns="http://maven.apache.org/POM/4.0.0"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
       <parent>
           <artifactId>springcloud2020</artifactId>
           <groupId>com.gyz.clouddemo</groupId>
           <version>1.0-SNAPSHOT</version>
       </parent>
       <modelVersion>4.0.0</modelVersion>
   
       <artifactId>seata-order-service2001</artifactId>
   
       <dependencies>
           <!--nacos-->
           <dependency>
               <groupId>com.alibaba.cloud</groupId>
               <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
           </dependency>
           <!--seata-->
           <dependency>
               <groupId>com.alibaba.cloud</groupId>
               <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
               <exclusions>
                   <exclusion>
                       <artifactId>seata-all</artifactId>
                       <groupId>io.seata</groupId>
                   </exclusion>
               </exclusions>
           </dependency>
           <dependency>
               <groupId>io.seata</groupId>
               <artifactId>seata-all</artifactId>
               <version>0.9.0</version>
           </dependency>
           <!--feign-->
           <dependency>
               <groupId>org.springframework.cloud</groupId>
               <artifactId>spring-cloud-starter-openfeign</artifactId>
           </dependency>
           <!--web-actuator-->
           <dependency>
               <groupId>org.springframework.boot</groupId>
               <artifactId>spring-boot-starter-web</artifactId>
           </dependency>
           <dependency>
               <groupId>org.springframework.boot</groupId>
               <artifactId>spring-boot-starter-actuator</artifactId>
           </dependency>
           <!--mysql-druid-->
           <dependency>
               <groupId>mysql</groupId>
               <artifactId>mysql-connector-java</artifactId>
               <version>5.1.37</version>
           </dependency>
           <dependency>
               <groupId>com.alibaba</groupId>
               <artifactId>druid-spring-boot-starter</artifactId>
               <version>1.1.10</version>
           </dependency>
           <dependency>
               <groupId>org.mybatis.spring.boot</groupId>
               <artifactId>mybatis-spring-boot-starter</artifactId>
               <version>2.0.0</version>
           </dependency>
           <dependency>
               <groupId>org.springframework.boot</groupId>
               <artifactId>spring-boot-starter-test</artifactId>
               <scope>test</scope>
           </dependency>
           <dependency>
               <groupId>org.projectlombok</groupId>
               <artifactId>lombok</artifactId>
               <optional>true</optional>
           </dependency>
       </dependencies>
   
   </project>
   ```

3. YML

   ```yaml
   server:
     port: 2001
   
   spring:
     application:
       name: seata-order-service
     cloud:
       alibaba:
         seata:
           #自定义事务组名称需要与seata-server中的对应
           tx-service-group: fsp_tx_group
       nacos:
         discovery:
           server-addr: localhost:8848
     datasource:
       driver-class-name: com.mysql.jdbc.Driver
       url: jdbc:mysql://localhost:3306/seata_order
       username: root
       password: root
   
   ###熔断开关
   feign:
     hystrix:
       enabled: false
   
   ###日志级别
   logging:
     level:
       io:
         seata: info
   
   mybatis:
     mapperLocations: classpath:mapper/*.xml
   ```

4. 项目resources文件夹下新建`file.conf`、`registry.conf`

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251119.png" alt="image-20210804003415482" />

   ```
   ### file.conf
   transport {
     # tcp udt unix-domain-socket
     type = "TCP"
     #NIO NATIVE
     server = "NIO"
     #enable heartbeat
     heartbeat = true
     #thread factory for netty
     thread-factory {
       boss-thread-prefix = "NettyBoss"
       worker-thread-prefix = "NettyServerNIOWorker"
       server-executor-thread-prefix = "NettyServerBizHandler"
       share-boss-worker = false
       client-selector-thread-prefix = "NettyClientSelector"
       client-selector-thread-size = 1
       client-worker-thread-prefix = "NettyClientWorkerThread"
       # netty boss thread size,will not be used for UDT
       boss-thread-size = 1
       #auto default pin or 8
       worker-thread-size = 8
     }
     shutdown {
       # when destroy server, wait seconds
       wait = 3
     }
     serialization = "seata"
     compressor = "none"
   }
   
   service {
   
     vgroup_mapping.fsp_tx_group = "default" #修改自定义事务组名称
   
     default.grouplist = "127.0.0.1:8091"
     enableDegrade = false
     disable = false
     max.commit.retry.timeout = "-1"
     max.rollback.retry.timeout = "-1"
     disableGlobalTransaction = false
   }
   
   
   client {
     async.commit.buffer.limit = 10000
     lock {
       retry.internal = 10
       retry.times = 30
     }
     report.retry.count = 5
     tm.commit.retry.count = 1
     tm.rollback.retry.count = 1
   }
   
   ## transaction log store
   store {
     ## store mode: file、db
     mode = "db"
   
     ## file store
     file {
       dir = "sessionStore"
   
       # branch session size , if exceeded first try compress lockkey, still exceeded throws exceptions
       max-branch-session-size = 16384
       # globe session size , if exceeded throws exceptions
       max-global-session-size = 512
       # file buffer size , if exceeded allocate new buffer
       file-write-buffer-cache-size = 16384
       # when recover batch read size
       session.reload.read_size = 100
       # async, sync
       flush-disk-mode = async
     }
   
     ## database store
     db {
       ## the implement of javax.sql.DataSource, such as DruidDataSource(druid)/BasicDataSource(dbcp) etc.
       datasource = "dbcp"
       ## mysql/oracle/h2/oceanbase etc.
       db-type = "mysql"
       driver-class-name = "com.mysql.jdbc.Driver"
       url = "jdbc:mysql://127.0.0.1:3306/seata"
       user = "root"
       password = "root"
       min-conn = 1
       max-conn = 3
       global.table = "global_table"
       branch.table = "branch_table"
       lock-table = "lock_table"
       query-limit = 100
     }
   }
   lock {
     ## the lock store mode: local、remote
     mode = "remote"
   
     local {
       ## store locks in user's database
     }
   
     remote {
       ## store locks in the seata's server
     }
   }
   recovery {
     #schedule committing retry period in milliseconds
     committing-retry-period = 1000
     #schedule asyn committing retry period in milliseconds
     asyn-committing-retry-period = 1000
     #schedule rollbacking retry period in milliseconds
     rollbacking-retry-period = 1000
     #schedule timeout retry period in milliseconds
     timeout-retry-period = 1000
   }
   
   transaction {
     undo.data.validation = true
     undo.log.serialization = "jackson"
     undo.log.save.days = 7
     #schedule delete expired undo_log in milliseconds
     undo.log.delete.period = 86400000
     undo.log.table = "undo_log"
   }
   
   ## metrics settings
   metrics {
     enabled = false
     registry-type = "compact"
     # multi exporters use comma divided
     exporter-list = "prometheus"
     exporter-prometheus-port = 9898
   }
   
   support {
     ## spring
     spring {
       # auto proxy the DataSource bean
       datasource.autoproxy = false
     }
   }
   ```

   ```
   ### registry.conf
   registry {
     # file 、nacos 、eureka、redis、zk、consul、etcd3、sofa
     type = "nacos"
   
     nacos {
       serverAddr = "localhost:8848"
       namespace = ""
       cluster = "default"
     }
     eureka {
       serviceUrl = "http://localhost:8761/eureka"
       application = "default"
       weight = "1"
     }
     redis {
       serverAddr = "localhost:6379"
       db = "0"
     }
     zk {
       cluster = "default"
       serverAddr = "127.0.0.1:2181"
       session.timeout = 6000
       connect.timeout = 2000
     }
     consul {
       cluster = "default"
       serverAddr = "127.0.0.1:8500"
     }
     etcd3 {
       cluster = "default"
       serverAddr = "http://localhost:2379"
     }
     sofa {
       serverAddr = "127.0.0.1:9603"
       application = "default"
       region = "DEFAULT_ZONE"
       datacenter = "DefaultDataCenter"
       cluster = "default"
       group = "SEATA_GROUP"
       addressWaitTime = "3000"
     }
     file {
       name = "file.conf"
     }
   }
   
   config {
     # file、nacos 、apollo、zk、consul、etcd3
     type = "file"
   
     nacos {
       serverAddr = "localhost"
       namespace = ""
     }
     consul {
       serverAddr = "127.0.0.1:8500"
     }
     apollo {
       app.id = "seata-server"
       apollo.meta = "http://192.168.1.204:8801"
     }
     zk {
       serverAddr = "127.0.0.1:2181"
       session.timeout = 6000
       connect.timeout = 2000
     }
     etcd3 {
       serverAddr = "http://localhost:2379"
     }
     file {
       name = "file.conf"
     }
   }
   
   ```

5. domain实体包新建`CommonResult.java`、`Order.java`

   ```java
   @NoArgsConstructor
   @AllArgsConstructor
   @Data
   public class CommonResult<T> {
   
       private Integer code;
       private String message;
       private T data;
   
       public CommonResult(Integer code, String message) {
           this(code, message, null);
       }
   }
   ```

   ```java
   @Data
   @AllArgsConstructor
   @NoArgsConstructor
   public class Order {
   
       private Long id;
   
       private Long userId;
   
       private Long productId;
   
       private Integer count;
   
       private BigDecimal money;
       /** 订单状态：0：创建中；1：已完结 */
       private Integer status;
   
   }
   ```

6. Dao接口实现

   - OrderDao

     ```java
     @Mapper
     public interface OrderDao {
     
         /**
          * @Description 新建订单
          * @param order :
          * @return void
          */
         void create(Order order);
     
         /**
          * @Description 修改订单状态，从零改为1
          * @param userId :
          * @param status :         
          * @return void
          */
         void update(@Param("userId") Long userId, @Param("status") Integer status);
     }
     
     ```

   - resources文件夹下新建mapper文件夹后添加 - `OrderMapper.xml`

     ```xml
     <?xml version="1.0" encoding="UTF-8" ?>
     <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
     
     <mapper namespace="com.gyz.clouddemo.dao.OrderDao">
     
         <resultMap id="BaseResultMap" type="com.gyz.clouddemo.domain.Order">
             <id column="id" property="id" jdbcType="BIGINT"/>
             <result column="user_id" property="userId" jdbcType="BIGINT"/>
             <result column="product_id" property="productId" jdbcType="BIGINT"/>
             <result column="count" property="count" jdbcType="INTEGER"/>
             <result column="money" property="money" jdbcType="DECIMAL"/>
             <result column="status" property="status" jdbcType="INTEGER"/>
         </resultMap>
     
         <insert id="create">
             insert into t_order (id,user_id,product_id,count,money,status)
             values (null,#{userId},#{productId},#{count},#{money},0);
         </insert>
     
     
         <update id="update">
             update t_order set status = 1
             where user_id=#{userId} and status = #{status};
         </update>
     
     </mapper>
     
     ```

7. Service接口及实现

   - OrderService

     ```java
     public interface OrderService {
     
         void create(Order order);
     }
     ```

   - OrderServiceImpl

     ```java
     @Service
     @Slf4j
     public class OrderServiceImpl implements OrderService {
         @Resource
         private OrderDao orderDao;
         @Resource
         private StorageService storageService;
         @Resource
         private AccountService accountService;
     
         /**
          * 创建订单->调用库存服务扣减库存->调用账户服务扣减账户余额->修改订单状态
          * 简单说：下订单->扣库存->减余额->改状态
          */
         @Override
         @GlobalTransactional(name = "fsp-create-order",rollbackFor = Exception.class)
         public void create(Order order) {
             log.info("----->开始新建订单");
             //1 新建订单
             orderDao.create(order);
     
             //2 扣减库存
             log.info("----->订单微服务开始调用库存，做扣减Count");
             storageService.decrease(order.getProductId(), order.getCount());
             log.info("----->订单微服务开始调用库存，做扣减end");
     
             //3 扣减账户
             log.info("----->订单微服务开始调用账户，做扣减Money");
             accountService.decrease(order.getUserId(), order.getMoney());
             log.info("----->订单微服务开始调用账户，做扣减end");
     
             //4 修改订单状态，从零到1,1代表已经完成
             log.info("----->修改订单状态开始");
             orderDao.update(order.getUserId(), 0);
             log.info("----->修改订单状态结束");
     
             log.info("----->下订单结束了，O(∩_∩)O哈哈~");
     
         }
     }
     ```

   - AccountService

     ```java
     @FeignClient(value = "seata-account-service")
     public interface AccountService {
         
         @PostMapping(value = "/account/decrease")
         CommonResult decrease(@RequestParam("userId") Long userId, @RequestParam("money") BigDecimal money);
     
     }
     ```

   - StorageService

     ```java
     @FeignClient(value = "seata-storage-service")
     public interface StorageService {
         @PostMapping(value = "/storage/decrease")
         CommonResult decrease(@RequestParam("productId") Long productId, @RequestParam("count") Integer count);
     }
     ```

8. Controller

   ```java
   @RestController
   public class OrderController {
       @Resource
       private OrderService orderService;
   
   
       @GetMapping("/order/create")
       public CommonResult create(Order order) {
           orderService.create(order);
           return new CommonResult(200, "订单创建成功");
       }
   }
   ```

9. Config配置

   Mybatis DataSourceProxyConfig配置，这里是使用Seata对数据源进行代理。

   ```java
   @Configuration
   public class DataSourceProxyConfig {
   
       @Value("${mybatis.mapperLocations}")
       private String mapperLocations;
   
       @Bean
       @ConfigurationProperties(prefix = "spring.datasource")
       public DataSource druidDataSource(){
           return new DruidDataSource();
       }
   
       @Bean
       public DataSourceProxy dataSourceProxy(DataSource dataSource) {
           return new DataSourceProxy(dataSource);
       }
   
       @Bean
       public SqlSessionFactory sqlSessionFactoryBean(DataSourceProxy dataSourceProxy) throws Exception {
           SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
           sqlSessionFactoryBean.setDataSource(dataSourceProxy);
           sqlSessionFactoryBean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources(mapperLocations));
           sqlSessionFactoryBean.setTransactionFactory(new SpringManagedTransactionFactory());
           return sqlSessionFactoryBean.getObject();
       }
   
   }
   ```

   Mybatis配置

   ```java
   @Configuration
   @MapperScan({"com.gyz.clouddemo.dao"})
   public class MyBatisConfig {
   }
   ```

10. 主启动

    ```java
    @EnableDiscoveryClient
    @EnableFeignClients
    @SpringBootApplication(exclude = DataSourceAutoConfiguration.class)//取消数据源的自动创建
    public class SeataOrderMainApp2001 {
        public static void main(String[] args) {
            SpringApplication.run(SeataOrderMainApp2001.class, args);
        }
    }
    ```




> **新建库存Storage-Module**

1. 新建`seata-storage-service2002`

2. POM（与`seata-order-service2001`模块大致相同）

3. YML

   ```yaml
   server:
     port: 2002
   
   spring:
     application:
       name: seata-storage-service
     cloud:
       nacos:
         discovery:
           server-addr: localhost:8848
       alibaba:
         seata:
           tx-service-group: fsp_tx_group
     datasource:
       driver-class-name: com.mysql.jdbc.Driver
       url: jdbc:mysql://localhost:3306/seata_storage
       username: root
       password: root
   
   logging:
     level:
       io:
         seata: info
   
   mybatis:
     mapper-locations: classpath:mapper/*.xml
   ```

4. 将`seata-order-service2001`中的`file.conf`、`registry.conf`粘贴到resources下

5. domain

   ```java
   package com.gyz.clouddemo.domain;
   
   import lombok.Data;
   
   @Data
   public class Storage {
   
       private Long id;
   
       /**产品id*/
   
       private Long productId;
   
       /**总库存*/
   
       private Integer total;
   
       /**已用库存*/
   
       private Integer used;
   
       /**剩余库存 */
   
       private Integer residue;
   
   }
   ```

   ```java
   @NoArgsConstructor
   @AllArgsConstructor
   @Data
   public class CommonResult<T> {
   
       private Integer code;
       private String message;
       private T data;
   
       public CommonResult(Integer code, String message) {
           this(code, message, null);
       }
   }
   ```

6. Dao接口及实现

   ```java
   @Mapper
   public interface StorageDao {
   
       void decrease(@Param("productId") Long id, @Param("count") Integer count);
   }
   ```

   ```xml
   <?xml version="1.0" encoding="UTF-8" ?>
   <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
   
   <mapper namespace="com.gyz.clouddemo.dao.StorageDao">
       <resultMap id="BaseResultMao" type="com.gyz.clouddemo.domain.Storage">
           <id column="id" property="id" jdbcType="BIGINT"/>
           <result column="product_id" property="productId" jdbcType="BIGINT"/>
           <result column="total" property="total" jdbcType="INTEGER"/>
           <result column="used" property="used" jdbcType="INTEGER"/>
           <result column="residue" property="residue" jdbcType="INTEGER"/>
       </resultMap>
   
       <update id="decrease">
            UPDATE
               t_storage
           SET
               used = used + #{count},residue = residue - #{count}
           WHERE
               product_id = #{productId}
       </update>
   </mapper>
   ```

7. Service接口及实现

   ```java
   public interface StorageService {
       /**
        * 扣减库存
        */
       void decrease(Long productId, Integer count);
   }
   ```

   ```java
   package com.gyz.clouddemo.service.impl;
   
   import com.gyz.clouddemo.dao.StorageDao;
   import com.gyz.clouddemo.service.StorageService;
   import org.slf4j.Logger;
   import org.slf4j.LoggerFactory;
   import org.springframework.stereotype.Service;
   
   import javax.annotation.Resource;
   
   @Service
   public class StorageServiceImpl implements StorageService {
   
       private static final Logger LOGGER = LoggerFactory.getLogger(StorageServiceImpl.class);
   
       @Resource
       private StorageDao storageDao;
   
       /**
        * 扣减库存
        */
       @Override
       public void decrease(Long productId, Integer count) {
           LOGGER.info("------->storage-service中扣减库存开始");
           storageDao.decrease(productId, count);
           LOGGER.info("------->storage-service中扣减库存结束");
       }
   
   }
   ```

8. Controller

   ```java
   @RestController
   public class StorageController {
   
       @Autowired
       private StorageService storageService;
   
       /**
        * 扣减库存
        */
       @RequestMapping("/storage/decrease")
       public CommonResult decrease(Long productId, Integer count) {
           storageService.decrease(productId, count);
           return new CommonResult(200, "扣减库存成功！");
       }
   }
   ```

9. Config配置（与seata-order-service2001模块大致相同）

10. 主启动（与seata-order-service2001模块大致相同）



> **新建账户Account-Module**

1. 新建`seata-account-service2003`

2. POM（与seata-order-service2001模块大致相同）

3. YML

   ```yaml
   server:
     port: 2003
   
   spring:
     application:
       name: seata-account-service
     cloud:
       alibaba:
         seata:
           tx-service-group: fsp_tx_group
       nacos:
         discovery:
           server-addr: localhost:8848
     datasource:
       driver-class-name: com.mysql.jdbc.Driver
       url: jdbc:mysql://localhost:3306/seata_account
       username: root
       password: 123456
   
   feign:
     hystrix:
       enabled: false
   
   logging:
     level:
       io:
         seata: info
   
   mybatis:
     mapperLocations: classpath:mapper/*.xml
   ```

4. 将`seata-order-service2001`中的`file.conf`、`registry.conf`粘贴到resources下

5. domain

   ```java
   @Data
   @AllArgsConstructor
   @NoArgsConstructor
   public class Account {
   
       private Long id;
   
       /**
        * 用户id
        */
       private Long userId;
   
       /**
        * 总额度
        */
       private BigDecimal total;
   
       /**
        * 已用额度
        */
       private BigDecimal used;
   
       /**
        * 剩余额度
        */
       private BigDecimal residue;
   }
   ```

   CommonResult（与seata-order-service2001模块大致相同）

6. Dao接口及实现

   ```java
   @Mapper
   public interface AccountDao {
   
       /**
        * 扣减账户余额
        */
       void decrease(@Param("userId") Long userId, @Param("money") BigDecimal money);
   }
   ```

   ```xml
   <?xml version="1.0" encoding="UTF-8" ?>
   <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
   
   <mapper namespace="com.gyz.clouddemo.dao.AccountDao">
   
       <resultMap id="BaseResultMap" type="com.gyz.clouddemo.domain.Account">
           <id column="id" property="id" jdbcType="BIGINT"/>
           <result column="user_id" property="userId" jdbcType="BIGINT"/>
           <result column="total" property="total" jdbcType="DECIMAL"/>
           <result column="used" property="used" jdbcType="DECIMAL"/>
           <result column="residue" property="residue" jdbcType="DECIMAL"/>
       </resultMap>
   
       <update id="decrease">
           UPDATE t_account
           SET
             residue = residue - #{money},used = used + #{money}
           WHERE
             user_id = #{userId};
       </update>
   
   </mapper>
   ```

7. Service接口及实现

   ```java
   public interface AccountService {
   
       /**
        * 扣减账户余额
        * @param userId 用户id
        * @param money 金额
        */
       void decrease(@RequestParam("userId") Long userId, @RequestParam("money") BigDecimal money);
   }
   ```

   ```java
   @Service
   public class AccountServiceImpl implements AccountService {
   
       private static final Logger LOGGER = LoggerFactory.getLogger(AccountServiceImpl.class);
   
   
       @Resource
       AccountDao accountDao;
   
       /**
        * 扣减账户余额
        */
       @Override
       public void decrease(Long userId, BigDecimal money) {
           LOGGER.info("------->account-service中扣减账户余额开始");
           accountDao.decrease(userId,money);
           LOGGER.info("------->account-service中扣减账户余额结束");
       }
   }
   ```

8. Controller

   ```java
   @RestController
   public class AccountController {
   
       @Resource
       AccountService accountService;
   
       /**
        * 扣减账户余额
        */
       @RequestMapping("/account/decrease")
       public CommonResult decrease(@RequestParam("userId") Long userId, @RequestParam("money") BigDecimal money) {
           accountService.decrease(userId, money);
           return new CommonResult(200, "扣减账户余额成功！");
       }
   }
   ```

9. Config配置（与seata-order-service2001模块大致相同）

10. 主启动（与seata-order-service2001模块大致相同）

***

### 21.6 Seata之@GlobalTransactional验证

**下订单 -> 减库存 -> 扣余额 -> 改（订单）状态**

**数据库初始情况：**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251120.png" alt="image-20210804234426126" />

**正常下单**

- http://localhost:2001/order/create?userId=1&productId=1&count=10&money=100

- 数据库正常下单后状况：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251121.png" alt="image-20210804234517681" />

**超时异常,没加@GlobalTransactional**

- 模拟AccountServiceImpl添加超时

  ```java
  @Service
  public class AccountServiceImpl implements AccountService {
  
      private static final Logger LOGGER = LoggerFactory.getLogger(AccountServiceImpl.class);
  
  
      @Resource
      AccountDao accountDao;
  
      /**
       * 扣减账户余额
       */
      @Override
      public void decrease(Long userId, BigDecimal money) {
          LOGGER.info("------->account-service中扣减账户余额开始");
          //模拟超时异常，全局事务回滚
          //暂停几秒钟线程
          try { TimeUnit.SECONDS.sleep(20); } catch (InterruptedException e) { e.printStackTrace(); }
          accountDao.decrease(userId,money);
          LOGGER.info("------->account-service中扣减账户余额结束");
      }
  }
  
  ```

- 另外，OpenFeign的调用默认时间是1s以内，所以最后会抛异常。

- 数据库情况

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251122.png" alt="af40cc3756cef7179e58c813ed404db3" />

- **故障情况**

  - 当库存和账户金额扣减后，订单状态并没有设置为已经完成，没有从零改为1
  - 而且由于feign的重试机制，账户余额还有可能被多次扣减



**超时异常,添加@GlobalTransactional**

- 用@GlobalTransactional标注OrderServiceImpl的create()方法

  ```java
  @Service
  @Slf4j
  public class OrderServiceImpl implements OrderService {
      
      ...
  
      /**
       * 创建订单->调用库存服务扣减库存->调用账户服务扣减账户余额->修改订单状态
       * 简单说：下订单->扣库存->减余额->改状态
       */
      @Override
      //rollbackFor = Exception.class表示对任意异常都进行回滚
      @GlobalTransactional(name = "fsp-create-order",rollbackFor = Exception.class)
      public void create(Order order)
      {
  		...
      }
  }
  ```

- 还是模拟AccountServiceImpl添加超时，下单后数据库数据并没有任何改变，记录都添加不进来，**达到出异常，数据库回滚的效果**

***

### 21.7 Seata原理简介

> **TC/TM/RM三个组件**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251123.png" alt="image-20210803003646181" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251124.png" alt="image-20210803003658113" />

- 形象比喻：TM相当于学生、TC相当于上课教师、RM相当于课程ID
- **分布式事务的执行流程**：
  - TM开启分布式事务(TM向TC注册全局事务记录)
  - 按业务场景,编排数据库、服务等事务内资源(RM向TC汇报资源准备状态)
  - TM结束分布式事务，事务一阶段结束(TM通知TC提交/回滚分布式事务)
  - TC汇报事务信息，决定分布式事务是提交还是回滚
  - TC通知所有RM提交/回滚资源，事务二阶段结束



> **AT模式（默认）如何做到对业务的无侵入**

**是什么？**

- 前提
  - 基于支持本地 ACID 事务的关系型数据库。
  - Java 应用，通过 JDBC 访问数据库。

- 整体机制
  - 两阶段提交协议的演变：
    - 一阶段：业务数据和回滚日志记录在同一个本地事务中提交，释放本地锁和连接资源。
    - 二阶段：
      - 提交异步化，非常快速地完成。
      - 回滚通过一阶段的回滚日志进行反向补偿。



**一阶段加载**

在一阶段，Seata会拦截“业务SQL”

- 解析SQL语义，找到“业务SQL" 要更新的业务数据，在业务数据被更新前，将其保存成`before image`

- 执行“业务SQL" 更新业务数据，在业务数据更新之后,其保存成`after image`，最后生成行锁。

以上操作全部在一个数据库事务内完成, 这样保证了一阶段操作的原子性。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251125.png" alt="image-20210803004403296" />

**二阶段提交**

- 二阶段如果顺利提交的话，因为"业务SQL"在一阶段已经提交至数据库，所以Seata框架只需将一阶段保存的快照数据和行锁删掉，完成数据清理即可。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251126.png" alt="image-20210803004443861" />

**三阶段回滚**

- 二阶段如果是回滚的话，Seata 就需要回滚一阶段已经执行的 “业务SQL"，还原业务数据。

- 回滚方式便是用`before image`还原业务数据；但在还原前要首先要校验脏写，对比`数据库当前业务数据`和`after image`。

- 如果两份数据完全一致就说明没有脏写， 可以还原业务数据，如果不一致就说明有脏写, 出现脏写就需要转人工处理。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251127.png" alt="image-20210803004618837" />

**补充**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251128.png" alt="image-20210803004729401" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151251129.png" alt="image-20210803004736944" />

**源码学习**

//TODO
