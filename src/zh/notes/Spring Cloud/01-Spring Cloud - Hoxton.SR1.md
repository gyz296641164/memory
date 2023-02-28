---
title: Spring Cloud - Hoxton.SR1(上)
category:
  - Spring Cloud
date: 2023-02-27
---

<!-- import -->

## 1、Spring Cloud简介

Spring Cloud是基于Spring Boot的。Spring Cloud提供了开发分布式微服务系统的一些常用组件，例如**服务注册和发现**、**配置中心**、**熔断器**、**智能路由**、**微代理**、**控制总线**、**全局锁**、**分布式会话**等。Spring Cloud包装的其他技术框架如下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248717.png" alt="image-20210711184017479" />

**Spring Cloud技术栈**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248719.png" alt="netflix" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248720.png" alt="img" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248721.png" alt="image-20210711184448633" />



***

## 2、Boot和Cloud版本选型

### 2.1 SpringBoot版本选择

- [git源码地址](https:github.com/spring-projects/spring-boot/releases/)
- SpringBoot2.0新特性
  -  https:github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.0-Release-Notes
  - 通过上面官网发现 Boot官方强烈建议你升级到2.X以上版本



### 2.2 SpringCloud版本选择

- [git源码地址](https:github.com/spring-projects/spring-cloud/releases/)

- [官网](htts://spring.io/projects/spring-cloud)

- 官网看Cloud版本

  - Cloud命名规则

    ![image-20210711190711961](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248722.png)

    ![image-20210711190726941](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248723.png)



### 2.3 Springcloud和Springboot之间的依赖关系如何看

- https://spring.io/projects/spring-cloud#overview

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248724.png" alt="image-20210711191038044" />

- 依赖

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248725.png" alt="image-20210711191058996" />

- 更详细的版本对应查看方法

  - https://start.spring.io/actuator/info

    ![image-20210724112239685](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248726.png)

  - 查看json串返回结果

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248727.png" alt="image-20210724112450605" />



> **后面项目环境版本**

- Cloud - Hoxton.SR1
- Boot - 2.2.2.RELEASE
- Cloud Alibaba - 2.1.0.RELEASE
- Java - Java 8
- Maven - 3.5及以上
- MySQL - 5.7及以上



***

## 3、Cloud组件停更说明



<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248728.png" alt="image-20210711200946272" />



参考资料见官网：

- Spring Cloud：https://cloud.spring.io/spring-cloud-static/Hoxton.SR1/reference/htmlsingle/
- Spring Cloud中文文档：https://www.bookstack.cn/read/spring-cloud-docs/docs-index.md
- Spring Boot：https://docs.spring.io/spring-boot/docs/2.2.2.RELEASE/reference/htmlsingle/



***

## 4、父工程Project空间新建

### 4.1 父工程步骤

1. New Project

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248729.png" alt="image-20210711231751796" />

2. 聚合总父工程名字

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248731.png" alt="image-20210711231825089" />

3. Maven选版本

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248732.png" alt="image-20210711231842629" />

4. 字符编码

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248733.png" alt="image-20210711231903658" />

5. 注解生效激活

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248734.png" alt="image-20210711231919152" />

6. java编译版本选8

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248735.png" alt="image-20210711231934793" />

8. File Type过滤（看个人习惯）

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248736.png" alt="image-20210711231951411" />



### 4.2 父工程pom

```xml
<?xml version="1.0" encoding="UTF-8"?>

<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.gyz.clouddemo</groupId>
  <artifactId>springcloud2020</artifactId>
  <version>1.0-SNAPSHOT</version>
  <packaging>pom</packaging><!-- 这里添加，注意不是jar或war -->


  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
    <junit.version>4.12</junit.version>
    <log4j.version>1.2.17</log4j.version>
    <lombok.version>1.16.18</lombok.version>
    <mysql.version>5.1.47</mysql.version>
    <druid.version>1.1.16</druid.version>
    <mybatis.spring.boot.version>1.3.0</mybatis.spring.boot.version>
  </properties>


  <!-- dependencyManagement:子模块继承之后，提供作用：锁定版本+子modlue不用写groupId和version -->
  <dependencyManagement>
    <dependencies>
      <!--spring boot 2.2.2-->
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>2.2.2.RELEASE</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <!--spring cloud Hoxton.SR1-->
      <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-dependencies</artifactId>
        <version>Hoxton.SR1</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <!--spring cloud alibaba 2.1.0.RELEASE-->
      <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-alibaba-dependencies</artifactId>
        <version>2.1.0.RELEASE</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>${mysql.version}</version>
      </dependency>
      <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid</artifactId>
        <version>${druid.version}</version>
      </dependency>
      <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>${mybatis.spring.boot.version}</version>
      </dependency>
      <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>${junit.version}</version>
      </dependency>
      <dependency>
        <groupId>log4j</groupId>
        <artifactId>log4j</artifactId>
        <version>${log4j.version}</version>
      </dependency>
      <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>${lombok.version}</version>
        <optional>true</optional>
      </dependency>
    </dependencies>
  </dependencyManagement>


  <build>
    <pluginManagement><!-- lock down plugins versions to avoid using Maven defaults (may be moved to parent pom) -->
      <plugins>
        <plugin>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-maven-plugin</artifactId>
          <configuration>
            <fork>true</fork>
            <addResources>true</addResources>
          </configuration>
        </plugin>
        <plugin>
          <artifactId>maven-clean-plugin</artifactId>
          <version>3.1.0</version>
        </plugin>
        <plugin>
          <artifactId>maven-site-plugin</artifactId>
          <version>3.7.1</version>
        </plugin>
      </plugins>
    </pluginManagement>
  </build>

</project>

```



### 4.3 Maven中的DependencyManagement和Dependencies

- Maven使用dependencyManagement元素来提供了一种管理依赖版本号的方式。

- 通常会在一个组织或者项目的最顶层的父POM中看到dependencyManagement元素。

- 使用pom.xml中的dependencyManagement元素能让所有在子项目中引用个依赖而不用显式的列出版本量。

- Maven会沿着父子层次向上走，直到找到一个拥有dependencyManagement元素的项目，然后它就会使用这个
  dependencyManagement元素中指定的版本号。

  ```xml
  <dependencyManagement>
      <dependencies>
          <dependency>
          <groupId>mysq1</groupId>
          <artifactId>mysql-connector-java</artifactId>
          <version>5.1.2</version>
          </dependency>
      <dependencies>
  </dependencyManagement>
  
  ```

  然后在子项目里就可以添加`mysql-connector`时可以不指定版本号，例如：

  ```xml
  <dependencies>
      <dependency>
      <groupId>mysq1</groupId>
      <artifactId>mysql-connector-java</artifactId>
      </dependency>
  </dependencies>
  
  ```

  这样做的**好处**就是：如果有多个子项目都引用同一样依赖，则可以避免在每个使用的子项目里都声明一个版本号，这样当想升级或切换到另一个版本时，只需要在顶层父容器里更新，而不需要一个一个子项目的修改；另外如果某个子项目需要另外的一个版本，只需要声明version就可。

- dependencyManagement里只是声明依赖，并不实现引入，因此子项目需要显示的声明需要用的依赖。

- 如果不在子项目中声明依赖，是不会从父项目中继承下来的；只有在子项目中写了该依赖项,并且没有指定具体版本，才会从父项目中继承该项，并且version和scope都读取自父pom。

- 如果子项目中指定了版本号，那么会使用子项目中指定的jar版本。

- 父工程创建完成执行`mvn : install`将父工程发布到仓库方便子工程继承。



***

## 5、支付模块构建

### 项目结构图

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248737.png" alt="image-20210717203614371" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248738.png" alt="image-20210717203631789" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248739.png" alt="image-20210717203648872" />

***

### 5.1 cloud-api-commons模块

**pom.xml**

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

    <artifactId>cloud-api-commons</artifactId>

    <dependencies>
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
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>5.1.0</version>
        </dependency>
    </dependencies>

</project>
```

**entity**

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
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
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Payment implements Serializable {
    private Long id;
    private String serial;

}
```



***

### 5.2 cloud-provider-payment8001模块

**pom.xml**

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
    <artifactId>cloud-provider-payment8001</artifactId>


    <dependencies>
       
        <!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
        <dependency>
            <groupId>com.gyz.clouddemo</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid-spring-boot-starter</artifactId>
            <version>1.1.10</version>
        </dependency>
        <!--mysql-connector-java-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <!--jdbc-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
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

**application.yml**

```yaml
server:
  port: 8001

spring:
  application:
    name: cloud-payment-service
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource            # 当前数据源操作类型
    driver-class-name: com.mysql.jdbc.Driver        # mysql驱动包
    url: jdbc:mysql://localhost:3306/db29?useUnicode=true&characterEncoding=utf-8
    username: root
    password: 填自己的

mybatis:
  mapperLocations: classpath:mapper/*.xml
  type-aliases-package: com.gyz.clouddemo.entity    # 所有Entity别名类所在包

logging:
  level:
    org:
      springframework:
        boot:
          autoconfigure: ERROR
```

**PaymentDao.java**

```java
@Mapper
public interface PaymentDao {

    int create(Payment payment);

    Payment getPaymentById(@Param("id") Long id);
}
```

**PaymentMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >

<mapper namespace="com.gyz.clouddemo.dao.PaymentDao">

    <insert id="create" parameterType="Payment" useGeneratedKeys="true" keyProperty="id">
        insert into payment(serial)  values(#{serial});
    </insert>

    <resultMap id="BaseResultMap" type="com.gyz.clouddemo.entity.Payment">
        <id column="id" property="id" jdbcType="BIGINT"/>
        <id column="serial" property="serial" jdbcType="VARCHAR"/>
    </resultMap>

    <select id="getPaymentById" parameterType="Long" resultMap="BaseResultMap">
        select * from payment where id=#{id};
    </select>

</mapper>

```

**PaymentService.java**

```java
public interface PaymentService {
    int create(Payment payment);

    Payment getPaymentById(@Param("id") Long id);
}

```

**PaymentServiceImpl.java**

```java
@Service
public class PaymentServiceImpl implements PaymentService {

    @Resource
    private PaymentDao paymentDao;

    @Override
    public int create(Payment payment) {
        return paymentDao.create(payment);
    }

    @Override
    public Payment getPaymentById(Long id) {
        return paymentDao.getPaymentById(id);
    }
}
```

**PaymentController.java**

```java
@RestController
@Slf4j
public class PaymentController {

    @Resource
    private PaymentService paymentService;


    @PostMapping(value = "/payment/create")
    public CommonResult create(Payment payment) {
        int result = paymentService.create(payment);
        log.info("******插入结果" + result);
        if (result > 0) {
            return new CommonResult(200, "插入数据成功", result);
        } else {
            return new CommonResult(444, "插入数据失败", null);
        }
    }

    @GetMapping(value = "/payment/get/{id}")
    public CommonResult<Payment> getPaymentById(@PathVariable("id") Long id) {
        Payment payment = paymentService.getPaymentById(id);
        log.info("查询结果：" + payment+"\t"+"哈哈哈");
        if (payment != null) {
            return new CommonResult(200, "查询成功", payment);
        } else {
            return new CommonResult(444, "查询失败", null);
        }
    }

}
```

**PaymentMain8001.java**

```java
@SpringBootApplication
public class PaymentMain8001 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentMain8001.class, args);
    }
}
```



### 5.3 cloud-consumer-order80模块

**pom.xml**

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

    <artifactId>cloud-consumer-order80</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.gyz.clouddemo</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

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

**ApplicationContextConfig.java**

```java
@Configuration
public class ApplicationContextConfig {
    @Bean
    public RestTemplate getRestTemplate() {
        return new RestTemplate();
    }
}
```

**OrderController.java**

```java
@RestController
@Slf4j
public class OrderController {

    private static final String UrlPth = "http://localhost:8001";


    @Resource
    private RestTemplate restTemplate;

    @GetMapping("/consumer/payment/create")
    public CommonResult<Payment> create(@RequestBody Payment payment) {
        return restTemplate.postForObject(UrlPth + "/payment/create", payment, CommonResult.class);
    }

    @GetMapping("/consumer/payment/get/{id}")
    public CommonResult<Payment> getPaymentById(@PathVariable("id") Long id) {
        return restTemplate.getForObject(UrlPth + "/payment/get/" + id, CommonResult.class);
    }
}
```

**OrderMain80.java**

```java
@SpringBootApplication
public class OrderMain80 {
    public static void main(String[] args) {
        SpringApplication.run(OrderMain80.class, args);
    }
}
```



***

## 6、Eureka

### 6.1 Eureka基础知识

> **什么是服务治理**

- Spring Cloud封装了Netflix 公司开发的Eureka模块来实现服务治理。

- 在传统的RPC远程调用框架中，管理每个服务与服务之间依赖关系比较复杂，管理比较复杂，所以需要使用服务治理，管理服务于服务之间依赖关系，可以实现服务调用、负载均衡、容错等，实现服务发现与注册。

> **什么是服务注册**

- Eureka采用了CS的设计架构，Eureka Sever作为服务注册功能的服务器，它是服务注册中心。而系统中的其他微服务，使用Eureka的客户端连接到 Eureka Server并维持心跳连接。这样系统的维护人员就可以通过Eureka Server来监控系统中各个微服务是否正常运行。

- 在服务注册与发现中，有一个注册中心。当服务器启动的时候，会把当前自己服务器的信息比如服务地址通讯地址等以别名方式注册到注册中心上。另一方(消费者服务提供者)，以该别名的方式去注册中心上获取到实际的服务通讯地址，然后再实现本地RPC调用RPC远程调用框架核心设计思想:在于注册中心，因为使用注册中心管理每个服务与服务之间的一个依赖关系(服务治理概念)。在任何RPC远程框架中，都会有一个注册中心存放服务地址相关信息(接口地址)

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248740.png" alt="image-20210718123935698" />



> **Eureka两组件**

Eureka包含两个组件：**Eureka Server** 和 **Eureka Client**

- **Eureka Server**提供服务注册服务
  - 各个微服务节点通过配置启动后，会在EurekaServer中进行注册，这样EurekaServer中的服务注册表中将会存储所有可用服务节点的信息，服务节点的信息可以在界面中直观看到。
- **EurekaClient**通过注册中心进行访问
  - 它是一个Java客户端，用于简化Eureka Server的交互，客户端同时也具备一个内置的、使用轮询(round-robin)负载算法的负载均衡器。在应用启动后，将会向Eureka Server发送心跳(默认周期为30秒)。如果Eureka Server在多个心跳周期内没有接收到某个节点的心跳，EurekaServer将会从服务注册表中把这个服务节点移除（默认90秒)



***

### 6.2 EurekaServer服务端安装

> 新建 **cloud-eureka-server7001**模块

**pom.xml**

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

    <artifactId>cloud-eureka-server7001</artifactId>

    <dependencies>
        <!--eureka-server-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
        <dependency>
            <groupId>com.gyz.clouddemo</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--一般为通用配置-->
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



> **添加application.yml**

```yaml
server:
  port: 7001
eureka:
  instance:
    hostname: localhost  #eureka服务端的实例名称
  client:
    register-with-eureka: false #false表示不向注册中心注册自己
    fetch-registry: false       #false表示自己端就是注册中心，我的职责就是维护服务实例，并不需要去检索服务
    service-url:
      #设置与Eureka server交互的地址查询服务和注册服务都需要依赖这个地址
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/

```



> **启动类**

```java
@SpringBootApplication
@EnableEurekaServer //指明为server端
public class EurekaMain7001 {
    public static void main(String[] args) {
        SpringApplication.run(EurekaMain7001.class, args);
    }
}
```

> **测试**

运行EurekaMain7001启动类，浏览器输入`http://localhost:7001/`回车，会查看到Spring Eureka服务主页。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248741.png" alt="image-20210718135849553" />



***

### 6.3 cloud-provider-payment8001 注册进EurekaServer

EurekaClient端`cloud-provider-payment8001` 将注册进EurekaServer成为服务提供者provider。

> **修改cloud-provider-payment8001的pom.xml文件**

添加spring-cloud-starter-netflix-eureka-client依赖：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>

```



> **添加yml配置**

```yaml
eureka:
  client:
    #表示是否将自己注册进Eurekaserver默认为true。
    register-with-eureka: true
    #是否从EurekaServer抓取已有的注册信息，默认为true。单节点无所谓，集群必须设置为true才能配合ribbon使用负载均衡
    fetchRegistry: true
    service-url:
      defaultZone: http://localhost:7001/eureka

```



> **启动类添加注解`@EnableEurekaClient`**

```java
@SpringBootApplication
@EnableEurekaClient  //说明为Client端
public class PaymentMain8001 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentMain8001.class, args);
    }
}
```



> **测试**

重新启动`cloud-eureka-server7001`和`cloud-provider-payment8001`工程。浏览器输入：http://localhost:7001/

![image-20210718141132429](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248742.png)

注册名称就是我们application.yml中配置的服务名称：

```
spring:
  application:
    name: cloud-payment-service
```



***

### 6.4 cloud-consumer-order80 注册进EurekaServer

EurekaClient端`cloud-consumer-order80` 将注册进EurekaServer成为服务消费者consumer。

> **添加依赖至pom.xml文件**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>

```



> **添加yml配置**

```yaml
spring:
  application:
    name: cloud-order-service

eureka:
  client:
    #表示是否将自己注册进Eurekaserver默认为true。
    register-with-eureka: true
    #是否从EurekaServer抓取已有的注册信息，默认为true。单节点无所谓，集群必须设置为true才能配合ribbon使用负载均衡
    fetchRegistry: true
    service-url:
      defaultZone: http://localhost:7001/eureka
```



> **主启动类**

```java
@SpringBootApplication
@EnableEurekaClient
public class OrderMain80 {
    public static void main(String[] args) {
        SpringApplication.run(OrderMain80.class, args);
    }
}
```



> **测试**

- 启动cloud-eureka-server7001、cloud-provider-payment8001、和cloud-consumer-order80这三个工程。

- 浏览器输入 http://localhost:7001 , 在主页的`Instances currently registered with Eureka`将会看到`cloud-provider-payment8001`、`cloud-consumer-order80`两个工程名。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248743.png" alt="image-20210718142029318" />

  

> **注意**

- application.yml配置中层次缩进和空格，两者不能少。

- 否则，会抛出异常`Failed to bind properties under 'eureka.client.service-url' to java.util.Map <java.lang.String, java.lang.String>`。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248744.png" alt="image-20210718142206196" />



***

### 6.5 Eureka集群原理说明

**Eureka集群原理如图所示**。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248745.png" alt="image-20210718170737252" />

服务注册：将服务信息注册进注册中心

服务发现：从注册中心上获取服务信息

实质：存key服务命取value闭用地址

**流程说明**：

1. 先启动eureka注主册中心
2. 启动服务提供者payment支付服务
3. 支付服务启动后会把自身信息(比服务地址L以别名方式注朋进eureka
4. 消费者order服务在需要调用接口时，使用服务别名去注册中心获取实际的RPC远程调用地址
5. 消去者导调用地址后，底屋实际是利用HttpClient技术实现远程调用
6. 消费者实癸导服务地址后会缓存在本地jvm内存中，默认每间隔30秒更新—次服务调用地址

**问题：微服务RPC远程服务调用最核心的是什么**

- 高可用，试想你的注册中心只有一个，万一它出故障了，会导致整个为服务环境不可用。

- 解决办法：搭建Eureka注册中心集群，实现负载均衡+故障容错。

`注：互相注册，相互守望。`

***

### 6.6 Eureka集群环境构建

参考cloud-eureka-server7001，新建cloud-eureka-server7002。

- 找到C:\Windows\System32\drivers\etc路径下的hosts文件，添加如下配置至hosts文件

  ```
  127.0.0.1 eureka7001.com
  127.0.0.1 eureka7002.com
  ```

- 修改cloud-eureka-server7002配置文件

  ```yaml
  server:
    port: 7002
  spring:
    application:
      name: cloud-eureka-service2
  eureka:
    instance:
      hostname: eureka7002.com
    client:
      register-with-eureka: false
      fetch-registry: false
      service-url:
        defaultZone: http://eureka7001.com:7001/eureka/
  ```

- 修改cloud-eureka-server7001配置文件

  ```yaml
  server:
    port: 7001
  eureka:
    instance:
      hostname: eureka7001.com #eureka服务端的实例名称
    client:
      register-with-eureka: false #false表示不向注册中心注册自己
      fetch-registry: false       #false表示自己端就是注册中心，我的职责就是维护服务实例，并不需要去检索服务
      service-url:
        #集群指向其它eureka
        defaultZone: http://eureka7002.com:7002/eureka/
        #单机就是7001自己
        #defaultZone: http://eureka7001.com:7001/eureka/
  
  ```



***



### 6.7 订单支付两微服务注册进Eureka集群

**将`支付服务8001微服务`、`订单服务80微服务`发布到上面2台Eureka集群（7001、7002）配置中。**

将它们的配置文件的eureka.client.service-url.defaultZone进行修改:

```yaml
eureka:
  client:
    #表示是否将自己注册进Eurekaserver默认为true。
    register-with-eureka: true
    #是否从EurekaServer抓取已有的注册信息，默认为true。单节点无所谓，集群必须设置为true才能配合ribbon使用负载均衡
    fetchRegistry: true
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka, http://eureka7002.com:7002/eureka
```

**测试（顺序要注意）**：

- 先启动EurekaServer：7001/7002服务
- 再启动服务提供者：8001服务
- 然后启动消费者：80服务
- 浏览器输入： http://localhost/consumer/payment/get/1



***



### 6.8 支付微服务集群配置

参考`cloud-provider-payment8001`，新建`cloud-provider-payment8002`。直接复制粘贴一份到父模块下。

- 修改8001/8002的Controller，添加**serverPort**

  ```java
  @RestController
  @Slf4j
  public class PaymentController {
  
      @Resource
      private PaymentService paymentService;
  
      @Value("${server.port}")
      private String serverPort;
  
      @PostMapping(value = "/payment/create")
      public CommonResult create(Payment payment) {
          int result = paymentService.create(payment);
          log.info("******插入结果" + result);
          if (result > 0) {
              return new CommonResult(200, "插入数据成功,serverPort："+serverPort,result);
          } else {
              return new CommonResult(444, "插入数据失败", null);
          }
      }
  ```

- **cloud-consumer-order80**订单服务访问地址不能写死，修改如下：

  ```java
    /** 通过在eureka上注册过的微服务名称调用 */
      private static final String UrlPth = "http://CLOUD-PAYMENT-SERVICE";
  ```

- 使用@LoadBalanced注解赋予RestTemplate负载均衡的能力

  ```java
  package com.gyz.clouddemo.config;
  
  import org.springframework.cloud.client.loadbalancer.LoadBalanced;
  import org.springframework.context.annotation.Bean;
  import org.springframework.context.annotation.Configuration;
  import org.springframework.web.client.RestTemplate;
  
  @Configuration
  
  public class ApplicationContextConfig {
  
      /**
       * @Description   使用@LoadBalanced注解赋予RestTemplate负载均衡的能力
       * @return org.springframework.web.client.RestTemplate
       */
      @Bean
      @LoadBalanced
      public RestTemplate getRestTemplate() {
          return new RestTemplate();
      }
  }
  ```

**测试**

- 先要启动EurekaServer，7001/7002服务

- 再要启动服务提供者provider，8001/8002服务

- 浏览器输入 ： http://localhost/consumer/payment/get/31

- 结果：负载均衡效果达到，8001/8002端口交替出现

- <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248746.png" alt="image-20210718182727202" />

- 红色描述说明：

  自我保护机制。紧急情况！EUREKA可能错误地声称实例在没有启动的情况下启动了。续订小于阈值，因此实例不会为了安全而过期。



***



### 6.9 actuator微服务信息完善

> **主机名称:服务名称修改（将Eureka网站显示的IP地址，换成可读性高的名字）**

修改`cloud-provider-payment8001`，`cloud-provider-payment8002`的部分 **YML**配置

```yaml
eureka:
  ...
  instance:
    instance-id: payment8001 #添加此处
```

```yaml
eureka:
  ...
  instance:
    instance-id: payment8002 #添加此处
```

**效果**：

![image-20210718183642454](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248747.png)



> **访问信息有IP信息提示，（就是将鼠标指针移至payment8001，payment8002名下，会有IP地址提示）**

我的不用配置就显示IP信息。如果不显示就配置 YML ： 添加`eureka.instance.prefer-ip-address`

```yaml
eureka:
  ...
  instance:
    instance-id: payment8002 #显示的IP地址，换成可读性高的名字
    prefer-ip-address: true
```

**效果**：

![image-20210718184149386](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248748.png)



***



### 6.10 服务发现Discovery

**对于注册eureka里面的微服务,可以通过服务发现来获得该服务的信息。**

修改cloud-provider-payment8001的Controller，添加服务发现方法：

```java
 /**
     * @return java.lang.Object
     * @Description 服务发现
     */
    @GetMapping(value = "/payment/discovery")
    public Object discovery() {
        List<String> services = discoveryClient.getServices();
        for (String element : services) {
            log.info("******* element:" + element);
        }

        //一个微服务下的全部实例
        List<ServiceInstance> instances = discoveryClient.getInstances("CLOUD-PAYMENT-SERVICE");
        for (ServiceInstance serviceInstance : instances) {
            log.info(serviceInstance.getPort() + "\t" + serviceInstance.getHost() + "\t" + serviceInstance.getUri());
        }

        return this.discoveryClient;
    }
```

8001主启动类添加注解：`@EnableDiscoveryClient`

```java
@SpringBootApplication
@EnableEurekaClient
@EnableDiscoveryClient
public class PaymentMain8001 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentMain8001.class, args);
    }
}
```

**测试**：

- 先启动EurekaSeryer

- 再启动8001主启动类，需要稍等一会儿

- 浏览器输入http://localhost:8001/payment/discovery

  - 输出结果

    ![image-20210718185809850](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248749.png)

  - 后台输出：

    ![image-20210718185922805](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248750.png)



***

### 6.11 eureka自我保护

> **故障现象**

- 保护模式主要用于一组客户端和Eureka Server之间存在网络分区场景下的保护。一旦进入保护模式，Eureka Server将会尝试保护其服务注册表中的信息，不再删除服务注册表中的数据，也就是不会注销任何微服务。

- 如果在Eureka Server的首页看到以下这段提示，则说明Eureka进入了保护模式:

  ```
  EMERGENCY! EUREKA MAY BE INCORRECTLY CLAIMING INSTANCES ARE UP WHEN THEY’RE NOT. RENEWALS ARE LESSER THANTHRESHOLD AND HENCE THE INSTANCES ARE NOT BEING EXPIRED JUSTTO BE SAFE
  ```



> **导致原因**

- **一个微服务不可用了,Eureka不会立刻清理,依旧会对该服务的信息进行保存**。

- 属于CAP里面的AP分支。

  

> **为什么会产生Eureka自我保护机制?**

为了EurekaClient可以正常运行，防止与EurekaServer网络不通情况下，EurekaServer不会立刻将EurekaClient服务剔除



> **什么是自我保护模式?**

- 默认情况下，如果EurekaServer在一定时间内没有接收到某个微服务实例的心跳，EurekaServer将会注销该实例(默认90秒)。但是当网络分区故障发生(延时、卡顿、拥挤)时，微服务与EurekaServer之间无法正常通信，以上行为可能变得非常危险了——因为微服务本身其实是健康的，此时本不应该注销这个微服务。Eureka通过“自我保护模式”来解决这个问题——当EurekaServer节点在短时间内丢失过多客户端时(可能发生了网络分区故障)，那么这个节点就会进入自我保护模式。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248751.png" alt="image-20210718190455534" />

- 自我保护机制∶默认情况下EurekaClient定时向EurekaServer端发送心跳包。

- 如果Eureka在server端在一定时间内(默认90秒)没有收到EurekaClient发送心跳包，便会直接从服务注册列表中剔除该服务，但是在短时间( 90秒中)内丢失了大量的服务实例心跳，这时候Eurekaserver会开启自我保护机制，不会剔除该服务（该现象可能出现在如果网络不通但是EurekaClient为出现宕机，此时如果换做别的注册中心如果一定时间内没有收到心跳会将剔除该服务，这样就出现了严重失误，因为客户端还能正常发送心跳，只是网络延迟问题，而保护机制是为了解决此问题而产生的)。

- **在自我保护模式中，Eureka Server会保护服务注册表中的信息，不再注销任何服务实例**。

- 它的设计哲学就是宁可保留错误的服务注册信息，也不盲目注销任何可能健康的服务实例。一句话讲解：**好死不如赖活着**。

- 综上，**自我保护模式是一种应对网络异常的安全保护措施**。它的架构哲学是宁可同时保留所有微服务（健康的微服务和不健康的微服务都会保留）也不盲目注销任何健康的微服务。使用自我保护模式，可以让Eureka集群更加的健壮、稳定。

***



### 6.12 怎么禁止自我保护

> **在注册中心eurekaServer端7001进行配置**：

出产默认，自我保护机制是开启的，使用`eureka.server.enable-self-preservation=false` 可以禁用自我保护模式

```yaml
eureka:
  ...
  server:
      #关闭自我保护机制，保证不可用服务被及时踢除
      enable-self-preservation: false
      eviction-interval-timer-in-ms: 2000

```

效果：

![image-20210718191246089](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248752.png)



> **生产者客户端eureakeClient端8001**

默认：

```
eureka.instance.lease-renewal-interval-in-seconds=30
eureka.instance.lease-expiration-duration-in-seconds=90
```

配置：

```yaml
eureka:
  ...
  instance:
    instance-id: payment8001 #显示的IP地址，换成可读性高的名字
    prefer-ip-address: true
    #Eureka客户端向服务端发送心跳的时间间隔，单位为秒(默认是30秒)
    lease-renewal-interval-in-seconds: 1
    #Eureka服务端在收到最后一次心跳后等待时间上限，单位为秒(默认是90秒)，超时将剔除服务
    lease-expiration-duration-in-seconds: 2
```

测试：

- 先启动7001再启动8001
- 关闭8001
- 发现马上被删除
- ![image-20210718192114808](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248753.png)



> **Eureka停更说明**

https://github.com/Netflix/eureka/wiki



***

## 7、Zookeeper服务注册与发现

TODO：Zookeeper待学习。。。



***

## 8、Consul服务注册与发现

### 8.1 Consul简介

Consul官网：https://www.consul.io/docs/intro

- Consul是一套开源的分布式服务发现和配置管理系统，由HashiCorp 公司用Go语言开发。
- 提供了微服务系统中的服务治理、配置中心、控制总线等功能。这些功能中的每一个都可以根据需要单独使用，也可以一起使用以构建全方位的服务网格，总之Consul提供了一种完整的服务网格解决方案。
- 它具有很多优点。包括：基于raft协议，比较简洁；支持健康检查，同时支持HTTP和DNS协议支持跨数据中心的WAN集群提供图形界面跨平台，支持Linux、Mac、Windows。

**用处**：

- 服务发现 - 提供HTTP和DNS两种发现方式。
- 健康监测 - 支持多种方式，HTTP、TCP、Docker、Shell脚本定制化
- KV存储 - Key、Value的存储方式
- 多数据中心 - Consul支持多数据中心
- 可视化Web界面

***



### 8.2 安装并运行Consul

下载地址：https://www.consul.io/downloads.html

中文文档：https://www.springcloud.cc/spring-cloud-consul.html

官网安装说明：https://learn.hashicorp.com/consul/getting-started/install.html

- 下载完成后只有一个consul.exe文件， 硬盘路径在地址栏输入`cmd`回车，查看版本信息

  ```
  consul --version
  ```

  ![image-20210719224732988](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248754.png)

- 使用开发模式启动

  ```
  consul agent -dev
  ```

- 通过以下地址可以访问Consul的首页: http://localhost:8500

- 结果页面

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248756.png" alt="image-20210719224818807" />



***

### 8.3 服务提供者注册进Consul

**新建Module支付服务`cloud-providerconsul-payment8006`**

**pom.xml**

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

    <artifactId>cloud-providerconsul-payment8006</artifactId>

    <dependencies>
        <!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
        <dependency>
            <groupId>com.gyz.clouddemo</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <!--SpringCloud consul-server -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-consul-discovery</artifactId>
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
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>RELEASE</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>RELEASE</version>
            <scope>test</scope>
        </dependency>
    </dependencies>


</project>
```

**application.yml**

```yaml
#consul服务端口号
server:
  port: 8006

spring:
  application:
    name: consul-provider-payment
  #consul注册中心地址
  cloud:
    consul:
      host: localhost
      port: 8500
      discovery:
        #hostname: 127.0.0.1
        service-name: ${spring.application.name}

```

**主启动类**

```java
@SpringBootApplication
@EnableDiscoveryClient
public class PaymentMain8006 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentMain8006.class,args);
    }
}
```

**PaymentController.java**

```java
@RestController
@Slf4j
public class PaymentController {

    @Value("${server.port}")
    private String serverPort;

    @RequestMapping(value = "/payment/consul")
    public String paymentConsual() {
        return "spring cloud consul" + serverPort + "\t" + UUID.randomUUID().toString();
    }
}
```

**测试**：

- http://localhost:8006/payment/consul

  ![image-20210719232521734](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248757.png)

- http://localhost:8500

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248758.png" alt="image-20210719232547522" />



***

### 8.4 服务消费者注册进Consul

**新建Module消费服务`cloud-consumerconsul-order80`**

**pom.xml**

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

    <artifactId>cloud-consumerconsul-order80</artifactId>

    <dependencies>
        <!--SpringCloud consul-server -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-consul-discovery</artifactId>
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

**application.yml**

```yaml
server:
  port: 80
spring:
  application:
    name: cloud-consumer-order
  cloud:
    consul:
      # consul注册中心地址
      host: localhost
      port: 8500
      discovery:
        hostname: 127.0.0.1
        service-name: ${spring.application.name}

```

**主启动类**

```java
/**
 * @Description @EnableDiscoveryClient ：该注解用于向使用consul或者zookeeper作为注册中心时注册服务
 * @Author GongYuZhuo
 * @Date 2021/7/19 23:34
 * @Version 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
public class OrderConsulMain80 {
    public static void main(String[] args) {
        SpringApplication.run(OrderConsulMain80.class,args);
    }
}
```

**配置Bean**

```java
@Configuration
public class ApplicationContextConfig {

    /**
     * @Description   使用@LoadBalanced注解赋予RestTemplate负载均衡的能力
     * @return org.springframework.web.client.RestTemplate
     */
    @Bean
    @LoadBalanced
    public RestTemplate getRestTemplate() {
        return new RestTemplate();
    }
}
```

**Controller**

```java
@RestController
@Slf4j
public class OrderConsulController {

    @Resource
    private RestTemplate restTemplate;

    public static final String INVOKE_URL = "http://consul-provider-payment";

    @GetMapping(value = "/consumer/payment/consul")
    public String paymentInfo() {
        String result = restTemplate.getForObject(INVOKE_URL + "/payment/consul", String.class);
        return result;
    }

}
```

**测试**

- http://localhost:8500/ 

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248759.png" alt="image-20210719234445870" />

- 服务消费获取地址： http://localhost/consumer/payment/consul

  ![image-20210719234606320](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248760.png)



***

## 9、三个注册中心异同点



| 组件名    | 语言CAP | 服务健康检查 | 对外暴露接口 | Spring Cloud集成 |
| --------- | ------- | ------------ | ------------ | ---------------- |
| Eureka    | Java    | AP           | 可配支持     | HTTP             |
| Consul    | Go      | CP           | 支持         | HTTP/DNS         |
| Zookeeper | Java    | CP           | 支持客户端   | 已集成           |



> **CAP**：

- C：Consistency (强一致性)
- A：Availability (可用性)
- P：Partition tolerance （分区容错性)

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248761.png" alt="image-20210719234800286" />

**最多只能同时较好的满足两个**。

CAP理论的核心是：**一个分布式系统不可能同时很好的满足一致性，可用性和分区容错性这三个需求**。

因此，根据CAP原理将NoSQL数据库分成了满足CA原则、满足CP原则和满足AP原则三大类：

- CA - 单点集群，满足—致性，可用性的系统，通常在可扩展性上不太强大。
- CP - 满足一致性，分区容忍必的系统，通常性能不是特别高。
- AP - 满足可用性，分区容忍性的系统，通常可能对一致性要求低一些。



> **AP架构（Eureka）**

当网络分区出现后，为了保证可用性，系统B可以返回旧值，保证系统的可用性。

结论：违背了一致性C的要求，只满足可用性和分区容错，即AP。

![image-20210719235016160](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248762.png)



> **CP架构（ZooKeeper/Consul）**

当网络分区出现后，为了保证一致性，就必须拒接请求，否则无法保证一致性。

结论：违背了可用性A的要求，只满足一致性和分区容错，即CP。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248763.png)



***

## 10、Ribbon入门介绍

### 10.1 概述

> Spring Cloud Ribbon是基于Netflix Ribbon实现的一套**客户端负载均衡的工具**。

- 简单的说，Ribbon是Netflix发布的开源项目，主要功能是提供**客户端的软件负载均衡算法和服务调用**。Ribbon客户端组件提供一系列完善的配置项如连接超时，重试等。
- 在配置文件中列出Load Balancer(简称LB)后面所有的机器，Ribbon会自动的帮助你基于某种规则(如简单轮询，随机连接等）去连接这些机器。我们很容易使用Ribbon实现自定义的负载均衡算法。



> **官网资料**：

- https://github.com/Netflix/ribbon/wiki/Getting-Started

Ribbon目前也进入维护模式，未来可能被Spring Cloud LoadBalacer替代。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248764.png" alt="image-20210720231257178" />



> **能干嘛**？

LB(负载均衡)：

- 简单的说就是将用户的请求平摊的分配到多个服务上，从而达到系统的HA (高可用)。

- 常见的负载均衡有软件Nginx，LVS，硬件F5等。

  - **集中式LB**

    即在服务的消费方和提供方之间使用独立的LB设施(可以是硬件，如F5, 也可以是软件，如nginx)，由该设施负责把访问请求通过某种策略转发至服务的提供方；

  - **进程内LB**

    将LB逻辑集成到消费方，消费方从服务注册中心获知有哪些地址可用，然后自己再从这些地址中选择出一个合适的服务器。

    **Ribbon就属于进程内LB**，它只是一个类库，集成于消费方进程，消费方通过它来获取到服务提供方的地址。



**Ribbon本地负载均衡客户端VS Nginx服务端负载均衡区别**

Nginx是服务器负载均衡，客户端所有请求都会交给nginx，然后由nginx实现转发请求。即负载均衡是由服务端实现的。Ribbon本地负载均衡，在调用微服务接口时候，会在注册中心上获取注册信息服务列表之后缓存到JVM本地，从而在本地实现RPC远程服务调用技术。



**一句话**

负载均衡 + RestTemplate调用

***

### 10.2 Ribbon负载均衡演示

> **架构说明**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248765.png" alt="image-20210722004454346" />

Ribbon在工作时分成两步：

- 第一步先选择EurekaServer ,它优先选择在同一个区域内负载较少的server。
- 第二步再根据用户指定的策略，在从server取到的服务注册列表中选择一个地址。

其中Ribbon提供了多种策略：比如**轮询**、**随机**和**根据响应时间加权**。

**总结**: Ribbon其实就是一个软负载均衡的客户端组件,  他可以和其他所需请求的客户端结合使用,和eureka结合只是其中一个实例。



> **POM**

先前工程项目没有引入spring-cloud-starter-ribbon也可以使用ribbon。

```xml
<dependency>
    <groupld>org.springframework.cloud</groupld>
    <artifactld>spring-cloud-starter-netflix-ribbon</artifactid>
</dependency>

```

这是因为spring-cloud-starter-netflix-eureka-client自带了spring-cloud-starter-ribbon引用。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248766.png" alt="image-20210722004828563" />



> **RestTemplate的使用**

官网：https://docs.spring.io/spring-framework/docs/5.2.2.RELEASE/javadoc-api/org/springframework/web/client/RestTemplate.html

**getForObject方法/getForEntity方法 \- GET请求方法**。

- getForObject()：返回对象为响应体中数据转化成的对象，基本上可以理解为Json。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248767.png" alt="image-20210722005145663" />

- getForEntity()：返回对象为ResponseEntity对象，包含了响应中的一些重要信息，比如响应头、响应状态码、响应体等。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248768.png" alt="image-20210722005152982" />

**postForObject() / postForEntity() - POST请求方法**



***

### 10.3 Ribbon核心组件IRule

> **IRule:根据特定算法从服务列表中选取一个要访问的服务**

![image-20210722005443465](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248769.png)

- **com.netflix.loadbalancer.RoundRobinRule** - **轮询**
- **com.netflix.loadbalancer.RandomRule** - **随机**
- **com.netflix.loadbalancer.RetryRule** - 先按照RoundRobinRule的策略获取服务,如果获取服务失败则在指定时间内进行重试,获取可用的服务
- **WeightedResponseTimeRule** - 对RoundRobinRule的扩展,响应速度越快的实例选择权重越多大,越容易被选择
- **BestAvailableRule** - 会先过滤掉由于多次访问故障而处于断路器跳闸状态的服务,然后选择一个并发量最小的服务
- **AvailabilityFilteringRule** - 先过滤掉故障实例,再选择并发较小的实例
- **ZoneAvoidanceRule** - 默认规则,复合判断server所在区域的性能和server的可用性选择服务器

***

### 10.4 Ribbon负载规则替换

**如何替换**?

- 修改`cloud-consumer-order80`

- **注意配置细节**

  - 官方文档明确给出了警告:
    - 这个自定义配置类不能放在@ComponentScan所扫描的当前包下以及子包下
    - 否则我们自定义的这个配置类就会被所有的Ribbon客户端所共享，达不到特殊化定制的目的了
  - **也就是说不要将Ribbon配置类与主启动类同包**

- 新建package：`com.gyz.myrule`，新建`MySelfRule`规则类

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248770.png" alt="image-20210722225826475" />

  ```java
  /**
   * @Description 新建MySelfRule规则类.不要将Ribbon配置类与主启动类同包
   * @Author GongYuZhuo
   * @Date 2021/7/22 22:56
   * @Version 1.0.0
   */
  @Configuration
  public class MySelfRule {
      @Bean
      public IRule myRule() {
          // 定义为随机
          return new RoundRobinRule();
      }
  
  }
  ```

  

- 主启动类添加`@RibbonClient`

  ```java
  @SpringBootApplication
  @EnableEurekaClient
  @RibbonClient(name = "CLOUD-PAYMENT-SERVICE",configuration = MySelfRule.class)
  public class OrderMain80 {
      public static void main(String[] args) {
          SpringApplication.run(OrderMain80.class, args);
      }
  }
  ```

  

- **测试**

  - 启动服务cloud-eureka-server7001，cloud-provider-payment8001，cloud-provider-payment8002，cloud-consumer-order80

  - 浏览器-输入：http://localhost/consumer/payment/get/1

  - 返回结果中的serverPort在8001与8002两种间反复转换

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248771.png" alt="image-20210722231608751" />

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248772.png" alt="image-20210722231619782" />



***

### 10.5 Ribbon负载均衡算法

> ### Ribbon默认负载轮询算法原理

**默认负载轮训算法: rest接口第几次请求数 % 服务器集群总数量 = 实际调用服务器位置下标，每次服务重启动后rest接口计数从1开始**。

```java
List<Servicelnstance> instances = discoveryClient.getInstances("CLOUD-PAYMENT-SERVICE");
```

例如:

- List [0] instances = 127.0.0.1:8002
- List [1] instances = 127.0.0.1:8001

8001+ 8002组合成为集群，它们共计2台机器，集群总数为2，按照轮询算法原理：

- 当总请求数为1时:1%2=1对应下标位置为1，则获得服务地址为127.0.0.1:8001
- 当总请求数位2时:2%2=0对应下标位置为0，则获得服务地址为127.0.0.1:8002
- 当总请求数位3时:3%2=1对应下标位置为1，则获得服务地址为127.0.0.1:8001
- 当总请求数位4时:4%2=0对应下标位置为0，则获得服务地址为127.0.0.1:8002
- 如此类推…



> ### RoundRobinRule源码分析

```java
public interface IRule{
    /*
     * choose one alive server from lb.allServers or
     * lb.upServers according to key
     * 
     * @return choosen Server object. NULL is returned if none
     *  server is available 
     */

    //重点关注这方法
    public Server choose(Object key);
    
    public void setLoadBalancer(ILoadBalancer lb);
    
    public ILoadBalancer getLoadBalancer();    
}

```

```java
package com.netflix.loadbalancer;

import com.netflix.client.config.IClientConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * The most well known and basic load balancing strategy, i.e. Round Robin Rule.
 *
 * @author stonse
 * @author Nikos Michalakis <nikos@netflix.com>
 *
 */
public class RoundRobinRule extends AbstractLoadBalancerRule {

    private AtomicInteger nextServerCyclicCounter;
    private static final boolean AVAILABLE_ONLY_SERVERS = true;
    private static final boolean ALL_SERVERS = false;

    private static Logger log = LoggerFactory.getLogger(RoundRobinRule.class);

    public RoundRobinRule() {
        nextServerCyclicCounter = new AtomicInteger(0);
    }

    public RoundRobinRule(ILoadBalancer lb) {
        this();
        setLoadBalancer(lb);
    }

    //重点关注这方法。
    public Server choose(ILoadBalancer lb, Object key) {
        if (lb == null) {
            log.warn("no load balancer");
            return null;
        }

        Server server = null;
        int count = 0;
        while (server == null && count++ < 10) {
            List<Server> reachableServers = lb.getReachableServers();
            List<Server> allServers = lb.getAllServers();
            int upCount = reachableServers.size();
            int serverCount = allServers.size();

            if ((upCount == 0) || (serverCount == 0)) {
                log.warn("No up servers available from load balancer: " + lb);
                return null;
            }

            int nextServerIndex = incrementAndGetModulo(serverCount);
            server = allServers.get(nextServerIndex);

            if (server == null) {
                /* Transient. */
                Thread.yield();
                continue;
            }

            if (server.isAlive() && (server.isReadyToServe())) {
                return (server);
            }

            // Next.
            server = null;
        }

        if (count >= 10) {
            log.warn("No available alive servers after 10 tries from load balancer: "
                    + lb);
        }
        return server;
    }

    /**
     * Inspired by the implementation of {@link AtomicInteger#incrementAndGet()}.
     *
     * @param modulo The modulo to bound the value of the counter.
     * @return The next value.
     */
    private int incrementAndGetModulo(int modulo) {
        for (;;) {
            int current = nextServerCyclicCounter.get();
            int next = (current + 1) % modulo;//求余法
            if (nextServerCyclicCounter.compareAndSet(current, next))
                return next;
        }
    }

    @Override
    public Server choose(Object key) {
        return choose(getLoadBalancer(), key);
    }

    @Override
    public void initWithNiwsConfig(IClientConfig clientConfig) {
    }
}

```



> ## Ribbon之手写轮询算法

手写一个类似RoundRobinRule的本地负载均衡器。

- 7001/7002集群启动

- 8001/8002微服务改造- Controller

  ```java
  @RestController
  @Slf4j
  public class PaymentController {
  
      @Resource
      private PaymentService paymentService;
  
      @Value("${server.port}")
      private String serverPort;
  
      ...
  
      @GetMapping(value = "/payment/lb")
      public String getPaymentLB() {
          return serverPort;
      }
  }
  ```

- 80订单微服务改造

  - ApplicationContextConfig去掉注解@LoadBalanced，OrderMain80去掉注解@RibbonClient

  - 创建LoadBalancer接口

    ```java
    public interface LoadBalancer {
        ServiceInstance getInstances(List<ServiceInstance> serviceInstances);
    }
    ```

  - 实现LoadBalancer接口

    ```java
    @Slf4j
    @Component
    public class MyLB implements LoadBalancer {
    
        AtomicInteger atomicInteger = new AtomicInteger(0);
    
        /**
         * @param serviceInstances :
         * @return org.springframework.cloud.client.ServiceInstance
         * @Description 负载均衡算法：rest接口第几次请求数 % 服务器集群总数量 = 实际调用服务器位置下标  ，每次服务重启动后rest接口计数从1开始。
         */
        @Override
        public ServiceInstance getInstances(List<ServiceInstance> serviceInstances) {
            int index = getAndIncrement() % serviceInstances.size();
            return serviceInstances.get(index);
        }
    
        public final int getAndIncrement() {
            int current, next;
            do {
                current = this.atomicInteger.get();
                next = current > Math.pow(2, 31) - 1 ? 0 : current + 1;
            } while (!this.atomicInteger.compareAndSet(current, next));  //自旋锁
            log.info("第几次访问,次数next:" + next);
            return next;
        }
    }
    ```

  - OrderController

    ```java
    @RestController
    @Slf4j
    public class OrderController {
    
        /** 通过在eureka上注册过的微服务名称调用 */
        private static final String UrlPth = "http://CLOUD-PAYMENT-SERVICE";
    
    
        @Resource
        private RestTemplate restTemplate;
    
        @Resource
        private LoadBalancer loadBalancer;
    
        @Resource
        private DiscoveryClient discoveryClient;
    
        ...
    
        @GetMapping(value = "/consumer/payment/lb")
        public String getPaymentLB() {
            List<ServiceInstance> instances = discoveryClient.getInstances("CLOUD-PAYMENT-SERVICE");
            if (instances == null || instances.size() <= 0) {
                return null;
            }
            ServiceInstance serviceInstance = loadBalancer.getInstances(instances);
            URI uri = serviceInstance.getUri();
            return restTemplate.getForObject(uri + "payment/lb", String.class);
        }
    
    }
    ```

  - 测试

    - 浏览器输入：http://localhost/consumer/payment/lb
    - 8001和8002交替出现



***

## 11、OpenFeign服务接口调用

### 11.1 概述

**OpenFeign是什么**

- 官网解释：https://cloud.spring.io/spring-cloud-static/Hoxton.SR1/reference/htmlsingle/#spring-cloud-openfeign
- GitHub：https://github.com/spring-cloud/spring-cloud-openfeign
- Feign是一个声明式WebService客户端。使用Feign能让编写Web Service客户端更加简单。它的使用方法是定义一个服务接口然后在上面添加注解。Feign也支持可拔插式的编码器和解码器。Spring Cloud对Feign进行了封装，使其支持了Spring MVC标准注解和HttpMessageConverters。Feign可以与Eureka和Ribbon组合使用以支持负载均衡。

**Feign能干什么**

- Feign旨在使编写Java Http客户端变得更容易
- 前面在使用Ribbon+RestTemplate时，利用RestTemplate对http请求的封装处理，形成了一套模版化的调用方法。但是在实际开发中，由于对服务依赖的调用可能不止一处，往往一个接口会被多处调用，所以通常都会针对每个微服务自行封装一些客户端类来包装这些依赖服务的调用。所以，Feign在此基础上做了进一步封装，由他来帮助我们定义和实现依赖服务接口的定义。在Feign的实现下，我们只需创建一个接口并使用注解的方式来配置它(以前是Dao接口上面标注Mapper注解,现在是一个微服务接口上面标注一个Feign注解即可)，即可完成对服务提供方的接口绑定，简化了使用Spring cloud Ribbon时，自动封装服务调用客户端的开发量。

**Feign集成了Ribbon**

- 利用Ribbon维护了Payment的服务列表信息，并且通过轮询实现了客户端的负载均衡。而与Ribbon不同的是，**通过feign只需要定义服务绑定接口且以声明式的方法**，优雅而简单的实现了服务调用。

**Feign和OpenFeign两者区别**

![image-20210723002533392](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248773.png)



***

### 11.2 OpenFeign使用步骤

**接口+注解**：微服务调用接口 + @FeignClient

- 新建`cloud-consumer-feign-order80`（**Feign在消费端使用**）

- pom.xml

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
  
      <artifactId>cloud-consumer-feign-order80</artifactId>
  
      <dependencies>
          <!--openfeign-->
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-openfeign</artifactId>
          </dependency>
          <!--eureka client-->
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
          </dependency>
          <!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
          <dependency>
              <groupId>com.gyz.clouddemo</groupId>
              <artifactId>cloud-api-commons</artifactId>
              <version>${project.version}</version>
          </dependency>
          <!--web-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-actuator</artifactId>
          </dependency>
          <!--一般基础通用配置-->
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

- application.yml

  ```yaml
  server:
    port: 80
  eureka:
    client:
      register-with-eureka: false
      fetch-registry: true
      service-url:
        defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka
  ```

- 主启动

  ```java
  @SpringBootApplication
  @EnableEurekaClient
  @EnableFeignClients
  public class OrderFeignMain80 {
      public static void main(String[] args) {
          SpringApplication.run(OrderFeignMain80.class, args);
      }
  }
  ```

- 业务类：新建PaymentFeignService接口并新增注解@FeignClient

  ```java
  @Component
  @FeignClient(value = "CLOUD-PAYMENT-SERVICE")
  public interface PaymentFeignService {
      @GetMapping(value = "/payment/get/{id}")
      CommonResult<Payment> getPaymentById(@PathVariable("id") Long id);
  }
  ```

- Controller

  ```java
  @RestController
  @Slf4j
  public class OrderFeignController {
      @Resource
      private PaymentFeignService paymentFeignService;
  
      @GetMapping(value = "/consumer/payment/get/{id}")
      public CommonResult<Payment> getPaymentById(@PathVariable("id") Long id) {
          return paymentFeignService.getPaymentById(id);
      }
  
  }
  ```

- 测试

  - 先启动2个eureka集群7001/7002
  - 再启动2个微服务8001/8002
  - 启动OpenFeign
  - 浏览器输入：http://localhost/consumer/payment/get/1
  - Feign自带负载均衡配置项

- 小总结

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248774.png" alt="image-20210724111429438" />



***

### 11.3 OpenFeign超时控制

**超时设置，故意设置超时演示出错情况**

- 服务提供方8001/8002故意写暂停程序

  ```java
  @RestController
  @Slf4j
  public class PaymentController {
      
      ...
      
      @Value("${server.port}")
      private String serverPort;
  
      ...
      
      @GetMapping(value = "/payment/feign/timeout")
      public String paymentFeignTimeout()
      {
          // 业务逻辑处理正确，但是需要耗费3秒钟
          try {
              TimeUnit.SECONDS.sleep(3);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          return serverPort;
      }
      
      ...
  }
  
  ```

- 服务消费方80添加超时方法PaymentFeignService

  ```java
  @Component
  @FeignClient(value = "CLOUD-PAYMENT-SERVICE")
  public interface PaymentFeignService {
  
     ...
  
      @GetMapping(value = "/payment/feign/timeout")
      String paymentFeignTimeout();
  }
  ```

- 服务消费方80添加超时方法OrderFeignController

  ```java
  @RestController
  @Slf4j
  public class OrderFeignController
  {
      @Resource
      private PaymentFeignService paymentFeignService;
  
      ...
  
      @GetMapping(value = "/consumer/payment/feign/timeout")
      public String paymentFeignTimeout()
      {
          // OpenFeign客户端一般默认等待1秒钟
          return paymentFeignService.paymentFeignTimeout();
      }
  }
  
  ```

- 测试

  - 多次刷新：http://localhost/consumer/payment/feign/timeout

  - 将会跳出错误Spring Boot默认错误页面

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248775.png" alt="image-20210723005742676" />

  - OpenFeign默认等待1秒钟，但是服务器处理超过1秒钟，导致 Fegin客户端不想等了，直接返回报错，为了避免这样的情况，有时候我们需要设置Fegin客户端的超时控制

  - yml中开启配置

    ```yaml
    server:
      port: 80
    
    eureka:
      client:
        register-with-eureka: false
        fetch-registry: true
        service-url:
          defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka
    
    # 设置feign客户端超时时间(OpenFeign默认支持ribbon)
    ribbon:
      # 指的是建立连接所用的时间,适用于网络状态正常的情况下,两端连接所用的时间
      ReadTimeout: 5000
      # 指的是建立连接后从服务器读取到可用资源所用的时间
      ConnectTimeout: 5000
    ```

  - 效果

    ![image-20210723010204818](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248776.png)



***

### 11.4 OpenFeign日志打印功能

**日志打印功能**

- Feign提供了日志打印功能，我们可以通过配置来调整日恙级别，从而了解Feign 中 Http请求的细节；

- 说白了就是对Feign接口的调用情况进行监控和输出 。

**日志级别**

- NONE：默认的，不显示任何日志;
- BASIC：仅记录请求方法、URL、响应状态码及执行时间;
- HEADERS：除了BASIC中定义的信息之外，还有请求和响应的头信息;
- FULL：除了HEADERS中定义的信息之外，还有请求和响应的正文及元数据。

**配置日志bean**

```java
@Configuration
public class FeignConfig
{
    @Bean
    Logger.Level feignLoggerLevel()
    {
        return Logger.Level.FULL;
    }
}
```

**YML文件里需要开启日志的Feign客户端**

```yaml
logging:
  level:
    # feign日志以什么级别监控哪个接口
    com.lun.springcloud.service.PaymentFeignService: debug
```

**后台日志查看**



***

## 12、Hystrix

### 12.1 概述

> ### 先谈分布式系统面临的问题

复杂分布式体系结构中的应用程序   有数十个依赖关系,每个依赖关系在某些时候将不可避免地失败。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248777.png" alt="image-20210724114858340" />

> ### 服务雪崩

- 多个微服务之间调用的时候，假设微服务A调用微服务B和微服务C，微服务B和微服务C又调用其它的微服务，这就是所谓的 “**扇出**”。如果扇出的链路上某个微服务的调用响应时间过长或者不可用，对微服务A的调用就会占用越来越多的系统资源，进而引起系统崩溃，所谓的 “**雪崩效应**”。 
- 对于高流量的应用来说，单一的后避依赖可能会导致所有服务器上的所有资源都在几秒钟内饱和。比失败更糟糕的是，这些应用程序还可能导致服务之间的延迟增加，备份队列，线程和其他系统资源紧张，导致整个系统发生更多的级联故障。这些都表示需要对故障和延迟进行隔离和管理，以便单个依赖关系的失败，不能取消整个应用程序或系统。
- 所以，通常当你发现一个模块下的某个实例失败后，这时候这个模块依然还会接收流量，然后这个有问题的模块还调用了其他的模块，这样就会发生级联故障，或者叫**雪崩**。

> ### Hystrix是什么

Hystrix是一个用于处理分布式系统的**延迟**和**容错**的开源库，在分布式系统里，许多依赖不可避免的会调用失败，比如超时、异常等，Hystrix能够保证在一个依赖出问题的情况下，**不会导致整体服务失败，避免级联故障，以提高分布式系统的弹性**。

"**断路器**”本身是一种开关装置，当某个服务单元发生故障之后，通过断路器的故障监控（类似熔断保险丝)，**向调用方返回一个符合预期的、可处理的备选响应（FallBack)，而不是长时间的等待或者抛出调用方无法处理的异常**，这样就保证了服务调用方的线程不会被长时间、不必要地占用，从而避免了故障在分布式系统中的蔓延，乃至雪崩。

> ### 能干嘛

- 服务降级
- 服务熔断
- 接近实时的监控

> ### 官网资料

地址：https://github.com/Netflix/hystrix/wiki

Hystrix官宣,停更进维：https://github.com/Netflix/hystrix

- 被动修复bugs
- 不再接受合并请求
- 不再发布新版本

***

### 12.2 HyStrix重要概念

> ### 服务降级

**服务器忙,请稍后再试，不让客户端等待并立刻返回一个友好提示，fallback**。

**哪些情况会发出降级**

- 程序运行异常
- 超时
- 服务熔断触发服务降级
- 线程池、信号量也会导致服务降级



> ### 服务熔断

类比保险丝达到最大服务访问后，直接拒绝访问，拉闸限电，然后调用服务降级的方法并返回友好提示。

**服务的降级->进而熔断->恢复调用链路**



> ### 服务限流

秒杀高并发等操作，严禁一窝蜂的过来拥挤，大家排队，一秒钟N个，有序进行。

***

### 12.3 hystrix案例

#### 12.3.1 基础构建

- 新建`cloud-provider-hystrix-payment8001`

- pom.xml

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
  
      <artifactId>cloud-provider-hystrix-payment8001</artifactId>
  
  
      <dependencies>
          <!--hystrix-->
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
          </dependency>
          <!--eureka client-->
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
          </dependency>
          <dependency>
              <groupId>com.gyz.clouddemo</groupId>
              <artifactId>cloud-api-commons</artifactId>
              <version>${project.version}</version>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
          <!--监控-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-actuator</artifactId>
          </dependency>
          <!--热部署-->
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

- application.yml

  ```yaml
  server:
    port: 8001
  
  spring:
    application:
      name: cloud-provider-hystrix-payment
  
  eureka:
    client:
      register-with-eureka: true
      fetch-registry: true
      service-url:
        #defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka
        defaultZone: http://eureka7001.com:7001
  ```

- service

  ```java
  @Service
  public class PaymentService {
  
      public String paymentInfoOK(Integer id) {
          return "线程池：" + Thread.currentThread().getName() + "paymentOK,id" + "\t" + "哈哈";
      }
  
      public String paymentInfo_TimeOut(Integer id) {
          try {
              TimeUnit.MILLISECONDS.sleep(3000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          return "线程池：" + Thread.currentThread().getName() + "id" + id + "哈哈";
      }
  }
  ```

- Controller

  ```java
  @RestController
  @Slf4j
  public class PaymentController {
      @Resource
      private PaymentService paymentService;
  
      @Value("${server.port}")
      private String serverPort;
  
      @GetMapping(value = "/payment/hystrix/ok/{id}")
      public String paymentInfoOK(@PathVariable("id") Integer id) {
          String result = paymentService.paymentInfoOK(id);
          log.info("*****result:" + result);
          return result;
      }
  
      @GetMapping("/payment/hystrix/timeout/{id}")
      public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {
          String result = paymentService.paymentInfo_TimeOut(id);
          log.info("*****result: " + result);
          return result;
      }
  }
  ```

- 正常测试

  - 启动eureka7001、启动eureka-provider-hystrix-payment8001

  - 访问：

    - success的方法：http://localhost:8001/payment/hystrix/ok/1

      <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248778.png" alt="image-20210724143253076" />

    - 每次调用耗费5秒钟：http://localhost:8001/payment/hystrix/timeout/1

      <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248779.png" alt="image-20210724143326061" />

  - 上述module均OK，以上述为根基平台,从正确->错误->降级熔断->恢复



#### 12.3.2 高并发测试

**Jmeter下载安装**

- Jmeter下载安装包：https://archive.apache.org/dist/jmeter/binaries/ 

  - 解压下载后的文件
  - 注意：jmeter3.0的对应jdk1.7，jmeter4.0对应jdk1.8及以上，jmeter4.0要求jdk1.8+

- 配置环境变量

  - 计算机---->右键，属性---->高级系统设置---->高级---->环境变量
  - 添加：
    - 变量名：`JMETER_HOME`
      变量值：Jmeter安装地址

- 启动Jmeter

  - 找到Jmeter解压路径下的`bin`文件中的`jmeter.bat` 文件，双击运行

  - 一个是命令窗口，一个是JMETER窗口

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248780.png" alt="image-20210724151043925" />

**Jmeter测试流程**

- 右键 –> 添加 –> 线程 –> 线程组

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248781.png" alt="image-20210724151317643" />

- 设置线程数量即并发数量

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248782.png" alt="image-20210724151413977" />

- 配置http请求

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248783.png" alt="image-20210724151540906" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248784.png" alt="image-20210724152103800" />

- 点击绿色三角形图标启动

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248785.png" alt="image-20210724152132945" />

- 演示结果：拖慢，原因：tomcat的默认的工作线程数被打满了，没有多余的线程来分解压力和处理。

- **Jmeter压测结论**

  上面还是服务提供者8001自己测试，假如此时外部的消费者80也来访问，那消费者只能干等，最终导致消费端80不满意，服务端8001直接被拖慢。



#### 12.3.3 新建订单微服务调用支付服务出现卡顿

- 新建`cloud-consumer-feign-hystrix-order80`

- pom.xml

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
  
      <artifactId>cloud-consumer-feign-hystrix-order80</artifactId>
  
      <dependencies>
          <!--openfeign-->
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-openfeign</artifactId>
          </dependency>
          <!--hystrix-->
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
          </dependency>
          <!--eureka client-->
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
          </dependency>
          <!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
          <dependency>
              <groupId>com.gyz.clouddemo</groupId>
              <artifactId>cloud-api-commons</artifactId>
              <version>${project.version}</version>
          </dependency>
          <!--web-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
          <!-- 监控-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-actuator</artifactId>
          </dependency>
          <!--热部署-->
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

- application.yml

  ```yaml
  server:
    port: 80
  
  eureka:
    client:
      service-url:
        defaultZone: http://eureka7002:com:7002/eureka/
  ```

- 启动类

  ```java
  @SpringBootApplication
  @EnableEurekaClient
  public class OrderHystrixMain80 {
      public static void main(String[] args) {
          SpringApplication.run(OrderHystrixMain80.class,args);
      }
  }
  ```

- Service

  ```java
  @Component
  @FeignClient(value = "CLOUD-PROVIDER-HYSTRIX-PAYMENT")
  public interface PaymentHystrixService {
      /**
       * @param id :
       * @return java.lang.String
       * @Description 正常访问
       */
      @GetMapping("/payment/hystrix/ok/{id}")
      String paymentInfo_OK(@PathVariable("id") Integer id);
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 超时访问
       */
      @GetMapping("/payment/hystrix/timeout/{id}")
      String paymentInfo_TimeOut(@PathVariable("id") Integer id);
  
  }
  ```

- controller

  ```java
  @RestController
  @Slf4j
  public class OrderHyrixController {
  
      @Resource
      private PaymentHystrixService paymentHystrixService;
  
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 正常访问
       */
      @GetMapping("/payment/hystrix/ok/{id}")
      public String paymentInfo_OK(@PathVariable("id") Integer id) {
          String result = paymentHystrixService.paymentInfo_OK(id);
          return result;
      }
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 超时访问
       */
      @GetMapping("/payment/hystrix/timeout/{id}")
      public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {
          String result = paymentHystrixService.paymentInfo_TimeOut(id);
          return result;
      }
  }
  ```

- 正常测试

  http://localhost/consumer/payment/hystrix/ok/1

- 高并发测试

  - 2W个线程压8001
  - 消费端80微服务再去访问正常的ok微服务8001地址
  - http://localhost/consumer/payment/hystrix/ok/1
  - 故障和导致现象：
    - 8001同一层次的其他接口被困死，因为tomcat线程池里面的工作线程已经被挤占完毕
    - 80此时调用8001，客户端访问响应缓慢，转圈圈
  - 正因为有上述故障或不佳表现  才有我们的降级/容错/限流等技术诞生

  

#### 12.3.4 降级容错解决的维度要求

- 超时导致服务器变慢(转圈) - 超时不再等待
- 出错(宕机或程序运行出错) - 出错要有兜底
- 解决：
  - 对方服务(8001)超时了，调用者(80)不能一直卡死等待，必须有服务降级
  - 对方服务(8001)宕机了，调用者(80)不能一直卡死等待，必须有服务降级
  - 对方服务(8001)ok，调用者(80)自己有故障或有自我要求(自己的等待时间小于服务提供者)



#### 12.3.5 服务降级

> **降级配置**

```
@HystrixCommand
```



> **8001先从自身找问题**

设置自身调用超时时间的峰值,峰值内可以正常运行,  超过了需要有兜底的方法处理,做服务降级fallback。



> **Hystrix之服务降级支付侧fallback**

**业务类启用 - `@HystrixCommand`报异常后如何处理**：

- 一旦调用服务方法失败并抛出了错误信息后,会自动调用@HystrixCommand标注好的fallbckMethod调用类中的指定方法。

  ```java
  @Service
  public class PaymentService {
  
  
      public String paymentInfoOK(Integer id) {
          return "线程池：" + Thread.currentThread().getName() + "paymentOK,id" + "\t" + "哈哈";
      }
  
  
      @HystrixCommand(fallbackMethod = "paymentInfo_TimeOutHandler", commandProperties = {
              @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000")})
      public String paymentInfo_TimeOut(Integer id) {
          try {
              TimeUnit.MILLISECONDS.sleep(5000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          return "线程池：" + Thread.currentThread().getName() + "id" + id + "哈哈";
      }
  
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 用来善后的方法
       */
      public String paymentInfo_TimeOutHandler(Integer id) {
          return "线程池:  " + Thread.currentThread().getName() + "  8001系统繁忙或者运行报错，请稍后再试,id:  " + id + "\t" + "o(╥﹏╥)o";
      }
  
  }
  ```

  上述代码制造的异常：能接受3秒钟，运行了5秒钟，超时异常。

  当前服务不可用了，做服务降级，兜底的方案都是`paymentInfo_TimeOutHandler`

  

  

  

**主启动类激活**

添加新注解`@EnableCircuitBreaker`

```java
@SpringBootApplication
@EnableEurekaClient
@EnableCircuitBreaker //主启动类激活
public class PaymentHystrixMain8001 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentHystrixMain8001.class, args);
    }
}
```



> **Hystrix之服务降级订单侧fallback**

80订单微服务，也可以更好的保护自己，自己也依样画葫芦进行客户端降级保护。

注意：我们自己配置过的热部署方式对java代码的改动明显,但对`@HystrixCommand内属性`的修改建议重启微服务。

- YML

  ```yaml
  server:
    port: 80
  
  eureka:
    client:
      service-url:
        defaultZone: http://eureka7002:com:7002/eureka/
  
  #开启
  feign:
    hystrix:
      enabled: true
  ```

- 主启动

  ```java
  @SpringBootApplication
  @EnableEurekaClient
  @EnableHystrix //添加此注解
  public class OrderHystrixMain80 {
      public static void main(String[] args) {
          SpringApplication.run(OrderHystrixMain80.class,args);
      }
  }
  ```

- Controller

  ```java
   @GetMapping("/payment/hystrix/timeout/{id}")
      @HystrixCommand(fallbackMethod = "paymentTimeOutFallbackMethod", commandProperties = {
              @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "1500")
      })
      public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {
          String result = paymentHystrixService.paymentInfo_TimeOut(id);
          return result;
      }
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 托底方法
       */
      public String paymentTimeOutFallbackMethod(@PathVariable("id") Integer id) {
          return "我是消费者80,对方支付系统繁忙请10秒钟后再试或者自己运行出错请检查自己,o(╥﹏╥)o";
      }
  ```

- 目前问题：每个业务方法对应一个兜底的方法,代码膨胀



> **解决办法**
>
> **Hystrix之全局服务降级DefaultProperties**

1、每个方法配置一个服务降级方法，技术上可以，但是不聪明

2、除了个别重要核心业务有专属，其它普通的可以通过@DefaultProperties(defaultFallback = “”)统一跳转到统一处理结果页面

通用的和独享的各自分开，避免了代码膨胀，合理减少了代码量。

```java
@RestController
@DefaultProperties(defaultFallback = "payment_Global_FallbackMethod")
@Slf4j
public class OrderHyrixController {

    @Resource
    private PaymentHystrixService paymentHystrixService;


    /**
     * @param id :
     * @return java.lang.String
     * @Description 正常访问
     */
    @GetMapping("/payment/hystrix/ok/{id}")
    public String paymentInfo_OK(@PathVariable("id") Integer id) {
        String result = paymentHystrixService.paymentInfo_OK(id);
        return result;
    }

    /**
     * @param id :
     * @return java.lang.String
     * @Description 超时访问
     */
    @GetMapping("/payment/hystrix/timeout/{id}")
//    @HystrixCommand(fallbackMethod = "paymentTimeOutFallbackMethod", commandProperties = {
//            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "1500")
//    })
    public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {
        String result = paymentHystrixService.paymentInfo_TimeOut(id);
        return result;
    }

    /**
     * @param id :
     * @return java.lang.String
     * @Description 托底方法
     */
    public String paymentTimeOutFallbackMethod(@PathVariable("id") Integer id) {
        return "我是消费者80,对方支付系统繁忙请10秒钟后再试或者自己运行出错请检查自己,o(╥﹏╥)o";
    }


    /**
     * @Description    全局fallback方法
     * @return java.lang.String
     */
    public String payment_Global_FallbackMethod()
    {
        return "Global异常处理信息，请稍后再试，/(ㄒoㄒ)/~~";
    }
}
```



> **Hystrix之通配服务降级FeignFallback**
>
> 

**服务降级，客户端去调用服务端，碰上服务端宕机或关闭**

本次案例服务降级处理是在客户端80实现完成，与服务端8001没有关系，只需要为Feign客户端定义的接口添加一个服务降级处理的实现类即可实现解耦。

未来我们要面对的异常：

- 运行
- 超时
- 宕机

**修改cloud-consumer-feign-hystrix-order80**

- 根据cloud-consumer-feign-hystrix-order80已经有的PaymentHystrixService接口，重新新建一个类(AaymentFallbackService)实现该接口，统一为接口里面的方法进行异常处理

- PaymentFallbackService类实现PaymentHystrixService接口

  ```java
  @Component
  public class PaymentFallbackService implements PaymentHystrixService {
  
      @Override
      public String paymentInfo_OK(Integer id) {
          return "-----PaymentFallbackService fall back-paymentInfo_OK ,o(╥﹏╥)o";
      }
  
      @Override
      public String paymentInfo_TimeOut(Integer id) {
          return "-----PaymentFallbackService fall back-paymentInfo_TimeOut ,o(╥﹏╥)o";
      }
  }
  ```

- YML

  ```yaml
  server:
    port: 80
  
  eureka:
    client:
      service-url:
        defaultZone: http://eureka7002:com:7002/eureka/
  
  #在feign中开启hystrix
  feign:
    hystrix:
      enabled: true
  ```

- PaymentHystrixService接口

  ```java
  /**
   * @Description “fallback = PaymentFallbackService.class” 指定类PaymentFallbackService
   * @Author GongYuZhuo
   * @Date 2021/7/24 18:15
   * @Version 1.0.0
   */
  @Component
  @FeignClient(value = "CLOUD-PROVIDER-HYSTRIX-PAYMENT",
               fallback = PaymentFallbackService.class)
  public interface PaymentHystrixService {
      /**
       * @param id :
       * @return java.lang.String
       * @Description 正常访问
       */
      @GetMapping("/payment/hystrix/ok/{id}")
      String paymentInfo_OK(@PathVariable("id") Integer id);
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 超时访问
       */
      @GetMapping("/payment/hystrix/timeout/{id}")
      String paymentInfo_TimeOut(@PathVariable("id") Integer id);
  
  }
  ```

- 测试

  - 单个eureka先启动7001
  - PaymentHystrixMain8001启动
  - 正常访问测试：http://localhost/consumer/payment/hystrix/ok/1
  - 故意关闭微服务8001
  - 客户端自己调用提示：此时服务端provider已经down ,但是我们做了服务降级处理,  让客户端在服务端不可用时也会获得提示信息而不会挂起耗死服务器

***

#### 12.3.6 服务熔断

断路器：理解为家里的保险丝

> **熔断机制概述**

熔断机制是应对雪崩效应的一种微服务链路保护机制。当扇出链路的某个微服务出错不可用或者响应时间太长时，会进行服务的降级，进而熔断该节点微服务的调用，快速返回错误的响应信息。**当检测到该节点微服务调用响应正常后，恢复调用链路**。

在Spring Cloud框架里，熔断机制通过Hystrix实现。Hystrix会监控微服务间调用的状况，当失败的调用到一定阈值，缺省是5秒内20次调用失败，就会启动熔断机制。熔断机制的注解是@HystrixCommand。

Martin Fowler论文：https://martinfowler.com/bliki/CircuitBreaker.html

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248786.png" alt="image-20210724182257047" />

三个状态：Open（全开）、Half Open（半开）、Closed（关闭）



> **Hystrix之服务熔断案例(上)**
>
> 

**修改cloud-provider-hystrix-payment8001**

- PaymentService 

  ```java
  @Service
  public class PaymentService {
  
  	......
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 服务熔断
       * name = "circuitBreaker.enabled"                    //是否开启断路器
       * name = "circuitBreaker.requestVolumeThreshold"     //请求次数
       * name = "circuitBreaker.sleepWindowInMilliseconds"  //时间窗口期
       * name = "circuitBreaker.errorThresholdPercentage"   //失败率达到多少后跳闸
       */
      @HystrixCommand(fallbackMethod = "paymentCircuitBreaker_fallback", commandProperties = {
              @HystrixProperty(name = "circuitBreaker.enabled", value = "true"),
              @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "10"),
              @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "10000"),
              @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "60"),
      })
      public String paymentCircuitBreaker(@PathVariable("id") Integer id) {
          if (id < 0) {
              throw new RuntimeException("*****id不能为负数");
          }
          //用的hutool工具类，还有日期工具包很好用。“IdUtil.simpleUUID()”和"UUID.randomUUID().toString()"类似
          String uuid = IdUtil.simpleUUID();
          return Thread.currentThread().getName() + "\t" + "调用成功，流水号: " + uuid;
      }
  
      public String paymentCircuitBreaker_fallback(@PathVariable("id") Integer id) {
          return "id 不能负数，请稍后再试，/(ㄒoㄒ)/~~   id: " + id;
      }
  }
  ```

- Controller

  ```java
  @RestController
  @Slf4j
  public class PaymentController {
      ......
  
      /**
       * @param id :
       * @return java.lang.String
       * @Description 服务熔断
       */
      @GetMapping("/payment/circuit/{id}")
      public String paymentCircuitBreaker(@PathVariable("id") Integer id) {
          String result = paymentService.paymentCircuitBreaker(id);
          log.info("****result: " + result);
          return result;
      }
  
  }
  ```

- 关于HystrixCommandProperties的配置

  ```java
  public abstract class HystrixCommandProperties {
      private static final Logger logger = LoggerFactory.getLogger(HystrixCommandProperties.class);
      static final Integer default_metricsRollingStatisticalWindow = 10000;
      private static final Integer default_metricsRollingStatisticalWindowBuckets = 10;
      private static final Integer default_circuitBreakerRequestVolumeThreshold = 20;
      private static final Integer default_circuitBreakerSleepWindowInMilliseconds = 5000;
      private static final Integer default_circuitBreakerErrorThresholdPercentage = 50;
      private static final Boolean default_circuitBreakerForceOpen = false;
      static final Boolean default_circuitBreakerForceClosed = false;
      private static final Integer default_executionTimeoutInMilliseconds = 1000;
      private static final Boolean default_executionTimeoutEnabled = true;
      
      ......
   
  } 
  ```

- 测试

  - 自测cloud-provider-hystrix-payment8001
  - 正确：http://localhost:8001/payment/circuit/1
  - 错误：http://localhost:8001/payment/circuit/-1
  - 重点测试：多次测试错误请求达到跳闸峰值，然后测试正确请求，发现刚开始访问也不成功了，等待几秒后又可以正确访问



> **Hystrix之服务熔断总结**
>
> 

**大神结论**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248787.png" alt="image-20210724192438033" />

**熔断类型**

- 熔断打开（Open）

  请求不再调用当前服务，内部设置一般为MTTR(平均故障处理时间),当打开长达导所设时钟则进入半熔断状态

- 熔断关闭（Closed）

  熔断关闭后不会对服务进行熔断

- 熔断半开（Half Open）

  部分请求根据规则调用当前服务，如果请求成功且符合规则则认为当前服务恢复正常，关闭熔断

**官网断路器流程图**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248788.png" alt="image-20210724193200601" />

**断路器在什么情况下开始起作用**

```java
//=====服务熔断
@HystrixCommand(fallbackMethod = "paymentCircuitBreaker_fallback",commandProperties = {
    @HystrixProperty(name = "circuitBreaker.enabled",value = "true"),// 是否开启断路器
    @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold",value = "10"),// 请求次数
    @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds",value = "10000"), // 时间窗口期
    @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage",value = "60"),// 失败率达到多少后跳闸
})
public String paymentCircuitBreaker(@PathVariable("id") Integer id) {
    ...
}

```

涉及到断路器的三个重要参数：

1. **快照时间窗**：断路器确定是否打开需要统计一些请求和错误数据，而统计的时间范围就是快照时间窗，默认为最近的10秒。
2. **请求总数阀值**：在快照时间窗内，必须满足请求总数阀值才有资格熔断。默认为20，意味着在10秒内，如果该hystrix命令的调用次数不足20次7,即使所有的请求都超时或其他原因失败，断路器都不会打开。
3. **错误百分比阀值**：当请求总数在快照时间窗内超过了阀值，比如发生了30次调用，如果在这30次调用中，有15次发生了超时异常，也就是超过50%的错误百分比，在默认设定50%阀值情况下，这时候就会将断路器打开。

**断路器开启或者关闭的条件**

- 到达以下阀值，断路器将会开启：

  当满足一定的阀值的时候（默认10秒内超过20个请求次数)
  当失败率达到一定的时候（默认10秒内超过50%的请求失败)
  当开启的时候，所有请求都不会进行转发

- 一段时间之后（默认是5秒)，这个时候断路器是半开状态，会让其中一个请求进行转发。如果成功，断路器会关闭，若失败，继续开启。

**断路器打开之后**

- 再有请求调用的时候，将不会调用主逻辑，而是直接调用降级fallback。通过断路器，实现了自动地发现错误并将降级逻辑切换为主逻辑，减少响应延迟的效果。

- 原来的主逻辑要如何恢复呢？

  对于这一问题，hystrix也为我们实现了自动恢复功能。

  当断路器打开，对主逻辑进行熔断之后，hystrix会启动一个休眠时间窗，在这个时间窗内，降级逻辑是临时的成为主逻辑，当休眠时间窗到期，断路器将进入半开状态，释放一次请求到原来的主逻辑上，如果此次请求正常返回，那么断路器将继续闭合，主逻辑恢复，如果这次请求依然有问题，断路器继续进入打开状态，休眠时间窗重新计时。

**All配置**

```java
@HystrixCommand(fallbackMethod = "fallbackMethod", 
                groupKey = "strGroupCommand", 
                commandKey = "strCommand", 
                threadPoolKey = "strThreadPool",
                
                commandProperties = {
                    // 设置隔离策略，THREAD 表示线程池 SEMAPHORE：信号池隔离
                    @HystrixProperty(name = "execution.isolation.strategy", value = "THREAD"),
                    // 当隔离策略选择信号池隔离的时候，用来设置信号池的大小（最大并发数）
                    @HystrixProperty(name = "execution.isolation.semaphore.maxConcurrentRequests", value = "10"),
                    // 配置命令执行的超时时间
                    @HystrixProperty(name = "execution.isolation.thread.timeoutinMilliseconds", value = "10"),
                    // 是否启用超时时间
                    @HystrixProperty(name = "execution.timeout.enabled", value = "true"),
                    // 执行超时的时候是否中断
                    @HystrixProperty(name = "execution.isolation.thread.interruptOnTimeout", value = "true"),
                    
                    // 执行被取消的时候是否中断
                    @HystrixProperty(name = "execution.isolation.thread.interruptOnCancel", value = "true"),
                    // 允许回调方法执行的最大并发数
                    @HystrixProperty(name = "fallback.isolation.semaphore.maxConcurrentRequests", value = "10"),
                    // 服务降级是否启用，是否执行回调函数
                    @HystrixProperty(name = "fallback.enabled", value = "true"),
                    // 是否启用断路器
                    @HystrixProperty(name = "circuitBreaker.enabled", value = "true"),
                    // 该属性用来设置在滚动时间窗中，断路器熔断的最小请求数。例如，默认该值为 20 的时候，如果滚动时间窗（默认10秒）内仅收到了19个请求， 即使这19个请求都失败了，断路器也不会打开。
                    @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "20"),
                    
                    // 该属性用来设置在滚动时间窗中，表示在滚动时间窗中，在请求数量超过 circuitBreaker.requestVolumeThreshold 的情况下，如果错误请求数的百分比超过50, 就把断路器设置为 "打开" 状态，否则就设置为 "关闭" 状态。
                    @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50"),
                    // 该属性用来设置当断路器打开之后的休眠时间窗。 休眠时间窗结束之后，会将断路器置为 "半开" 状态，尝试熔断的请求命令，如果依然失败就将断路器继续设置为 "打开" 状态，如果成功就设置为 "关闭" 状态。
                    @HystrixProperty(name = "circuitBreaker.sleepWindowinMilliseconds", value = "5000"),
                    // 断路器强制打开
                    @HystrixProperty(name = "circuitBreaker.forceOpen", value = "false"),
                    // 断路器强制关闭
                    @HystrixProperty(name = "circuitBreaker.forceClosed", value = "false"),
                    // 滚动时间窗设置，该时间用于断路器判断健康度时需要收集信息的持续时间
                    @HystrixProperty(name = "metrics.rollingStats.timeinMilliseconds", value = "10000"),
                    
                    // 该属性用来设置滚动时间窗统计指标信息时划分"桶"的数量，断路器在收集指标信息的时候会根据设置的时间窗长度拆分成多个 "桶" 来累计各度量值，每个"桶"记录了一段时间内的采集指标。
                    // 比如 10 秒内拆分成 10 个"桶"收集这样，所以 timeinMilliseconds 必须能被 numBuckets 整除。否则会抛异常
                    @HystrixProperty(name = "metrics.rollingStats.numBuckets", value = "10"),
                    // 该属性用来设置对命令执行的延迟是否使用百分位数来跟踪和计算。如果设置为 false, 那么所有的概要统计都将返回 -1。
                    @HystrixProperty(name = "metrics.rollingPercentile.enabled", value = "false"),
                    // 该属性用来设置百分位统计的滚动窗口的持续时间，单位为毫秒。
                    @HystrixProperty(name = "metrics.rollingPercentile.timeInMilliseconds", value = "60000"),
                    // 该属性用来设置百分位统计滚动窗口中使用 “ 桶 ”的数量。
                    @HystrixProperty(name = "metrics.rollingPercentile.numBuckets", value = "60000"),
                    // 该属性用来设置在执行过程中每个 “桶” 中保留的最大执行次数。如果在滚动时间窗内发生超过该设定值的执行次数，
                    // 就从最初的位置开始重写。例如，将该值设置为100, 滚动窗口为10秒，若在10秒内一个 “桶 ”中发生了500次执行，
                    // 那么该 “桶” 中只保留 最后的100次执行的统计。另外，增加该值的大小将会增加内存量的消耗，并增加排序百分位数所需的计算时间。
                    @HystrixProperty(name = "metrics.rollingPercentile.bucketSize", value = "100"),
                    
                    // 该属性用来设置采集影响断路器状态的健康快照（请求的成功、 错误百分比）的间隔等待时间。
                    @HystrixProperty(name = "metrics.healthSnapshot.intervalinMilliseconds", value = "500"),
                    // 是否开启请求缓存
                    @HystrixProperty(name = "requestCache.enabled", value = "true"),
                    // HystrixCommand的执行和事件是否打印日志到 HystrixRequestLog 中
                    @HystrixProperty(name = "requestLog.enabled", value = "true"),

                },
                threadPoolProperties = {
                    // 该参数用来设置执行命令线程池的核心线程数，该值也就是命令执行的最大并发量
                    @HystrixProperty(name = "coreSize", value = "10"),
                    // 该参数用来设置线程池的最大队列大小。当设置为 -1 时，线程池将使用 SynchronousQueue 实现的队列，否则将使用 LinkedBlockingQueue 实现的队列。
                    @HystrixProperty(name = "maxQueueSize", value = "-1"),
                    // 该参数用来为队列设置拒绝阈值。 通过该参数， 即使队列没有达到最大值也能拒绝请求。
                    // 该参数主要是对 LinkedBlockingQueue 队列的补充,因为 LinkedBlockingQueue 队列不能动态修改它的对象大小，而通过该属性就可以调整拒绝请求的队列大小了。
                    @HystrixProperty(name = "queueSizeRejectionThreshold", value = "5"),
                }
               )
public String doSomething() {
	...
}

```



***

#### 12.3.7 hystrix工作流程

[官网解释](https://github.com/Netflix/Hystrix/wiki/How-it-Works)

**Hystrix工作流程**

- 官网图例

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248789.png" alt="image-20210724194515003" />

- 步骤说明
  1. 创建HystrixCommand （用在依赖的服务返回单个操作结果的时候）或HystrixObserableCommand（用在依赖的服务返回多个操作结果的时候）对象。
  2. 命令执行
  3. 其中 HystrixCommand实现了下面前两种执行方式
     - execute()：同步执行，从依赖的服务返回一个单一的结果对象或是在发生错误的时候抛出异常
     - queue()：异步执行，直接返回一个Future对象，其中包含了服务执行结束时要返回的单一结果对象
  4. 而 HystrixObservableCommand实现了后两种执行方式
     - obseve()：返回Observable对象，它代表了操作的多个统果，它是一个Hot Observable （不论“事件源”是否有“订阅者”，都会在创建后对事件进行发布，所以对于Hot Observable的每一个“订阅者”都有可能是从“事件源”的中途开始的，并可能只是看到了整个操作的局部过程）
     - toObservable()：同样会返回Observable对象，也代表了操作的多个结果，但它返回的是一个Cold Observable（没有“订间者”的时候并不会发布事件，而是进行等待，直到有“订阅者"之后才发布事件，所以对于Cold Observable 的订阅者，它可以保证从一开始看到整个操作的全部过程）
  5. 若当前命令的请求缓存功能是被启用的，并且该命令缓存命中，那么缓存的结果会立即以Observable对象的形式返回
  6. 检查断路器是否为打开状态。如果断路器是打开的，那么Hystrix不会执行命令，而是转接到fallback处理逻辑(第8步)；如果断路器是关闭的，检查是否有可用资源来执行命令(第5步)
  7. 线程池/请求队列信号量是否占满。如果命令依赖服务的专有线程地和请求队列，或者信号量（不使用线程的时候）已经被占满，那么Hystrix也不会执行命令，而是转接到fallback处理理辑(第8步) 
  8. Hystrix会根据我们编写的方法来决定采取什么样的方式去请求依赖服务
     - HystrixCommand.run()：返回一个单一的结果，或者抛出异常
     - HystrixObservableCommand.construct()：返回一个Observable对象来发射多个结果，或通过onError发送错误通知
  9. Hystix会将“成功”、“失败”、“拒绝”、“超时” 等信息报告给断路器，而断路器会维护一组计数器来统计这些数据。断路器会使用这些统计数据来决定是否要将断路器打开，来对某个依赖服务的请求进行"熔断/短路"
  10. 当命令执行失败的时候，Hystix会进入fallback尝试回退处理，我们通常也称波操作为“服务降级”。而能够引起服务降级处理的情况有下面几种
      - 第4步∶当前命令处于“熔断/短路”状态，断洛器是打开的时候
      - 第5步∶当前命令的钱程池、请求队列或者信号量被占满的时候
      - 第6步∶HystrixObsevableCommand.construct()或HytrixCommand.run()抛出异常的时候
  11. 当Hystrix命令执行成功之后，它会将处理结果直接返回或是以Observable的形式返回
- `注意：如果我们没有为命令实现降级逻辑或者在降级处理逻辑中抛出了异常，Hystrix依然会运回一个Obsevable对象，但是它不会发射任结果数惯，而是通过onError方法通知命令立即中断请求，并通过onError方法将引起命令失败的异常发送给调用者`

***

#### 12.3.8 服务监控hystrixDashboard

> **Hystrix图形化Dashboard搭建**
>
> 

**概述**

- 除了隔离依赖服务的调用以外，Hystrix还提供了准实时的调用监控(Hystrix Dashboard)，Hystrix会持续地记录所有通过Hystrix发起的请求的执行信息，并以统计报表和图形的形式展示给用户，包括每秒执行多少请求多少成功，多少失败等。

- Netflix通过hystrix-metrics-event-stream项目实现了对以上指标的监控。Spring Cloud也提供了Hystrix Dashboard的整合，对监控内容转化成可视化界面。

**仪表盘9001**

- 新建`cloud-consumer-hystrix-dashboard9001`

- pom.xml

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
      <artifactId>cloud-consumer-hystrix-dashboard9001</artifactId>
  
      <dependencies>
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-actuator</artifactId>
          </dependency>
  
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

   

- application.yml

  ```
  server:
    port: 9001
  ```

- 主启动类加`@EnableHystrixDashboard`

  ```java
  @SpringBootApplication
  @EnableHystrixDashboard
  public class HystrixDashboardMain9001 {
      public static void main(String[] args) {
          SpringApplication.run(HystrixDashboardMain9001.class, args);
      }
  }
  ```

- 所有Provider微服务提供类都需要监控依赖配置

  ```java
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
  </dependency>
  ```

- 启动cloud-consumer-hystrix-dashboard9001该微服务后续将监控微服务8001

- 浏览器输入：http://localhost:9001/hystrix



> **断路器演示(服务监控hystrixDashboard)**
>
> 

**修改cloud-provider-hystrix-payment8001**

- **注意**：新版本Hystrix需要在主启动MainAppHystrix8001中指定监控路径

  ```java
  /**
   * @Description Hystrix演示
   * @Author GongYuZhuo
   * @Date 2021/7/24 12:44
   * @Version 1.0.0
   */
  @SpringBootApplication
  @EnableEurekaClient
  @EnableCircuitBreaker
  public class PaymentHystrixMain8001 {
  
      public static void main(String[] args) {
          SpringApplication.run(PaymentHystrixMain8001.class, args);
      }
  
      /**
       * @Description 此配置是为了服务监控而配置，与服务容错本身无关，springcloud升级后的坑
       *               ServletRegistrationBean因为springboot的默认路径不是"/hystrix.stream"，
       *               只要在自己的项目里配置上下面的servlet就可以了。
       *               不配置会出现：Unable to connect to Command Metric Stream.404
       *
       * @return org.springframework.boot.web.servlet.ServletRegistrationBean
       */
      @Bean
      public ServletRegistrationBean getServlet() {
          HystrixMetricsStreamServlet streamServlet = new HystrixMetricsStreamServlet();
          ServletRegistrationBean registrationBean = new ServletRegistrationBean(streamServlet);
          registrationBean.setLoadOnStartup(1);
          registrationBean.addUrlMappings("/hystrix.stream");
          registrationBean.setName("HystrixMetricsStreamServlet");
          return registrationBean;
      }
  
  }
  ```

**监控测试**

- 启动`eureka7001`、`cloud-provider-hystrix-payment8001`，`cloud-consumer-hystrix-dashboard9001`

- 浏览器输入测试地址：

  - http://localhost:8001/payment/circuit/1
  - http://localhost:8001/payment/circuit/-1

- 观察监控窗口

  - 9001监控8001：填写监控地址 - http://localhost:8001/hystrix.stream 

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248790.png" alt="image-20210724204040516" />

  - 先访问正确地址，再访问错误地址，再正确地址，会发现图示断路器都是慢慢放开的。

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248791.png" alt="image-20210724205201620" />

  - 如果一直访问错误请求，那么Circuit会是`Open`状态

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248792.png" alt="image-20210724205307858" />

**如何看?**

- 7色

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248793.png" alt="image-20210724205456238" />

- 1圈

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248794.png" alt="image-20210724205736274" />

  - 实心圆：共有两种含义。它通过颜色的变化代表了实例的健康程度，它的健康度从绿色<黄色<橙色<红色递减。

  - 该实心圆除了颜色的变化之外，它的大小也会根据实例的请求流量发生变化，**流量越大该实心圆就越大**。所以通过该实心圆的展示，就可以在大量的实例中快速的发现故障实例和高压力实例。 

- 1线

  曲线：用来记录2分钟内流量的相对变化，可以通过它来观察到流量的上升和下降趋势。

- 整图说明

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248795.png" alt="image-20210724205945564" />

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248796.png" alt="image-20210724205952853" />

- 整图说明2

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248797.png" alt="image-20210724210022517" />



***

## 关于我遇到的坑



> **在SpringBoot启动时，控制台出现如下信息，说明有logging.level属性**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248798.png" alt="image-20210718135030015" />

**两种解决方法：**

1、在application.yml中配置

```yaml
logging:
  level:
    org:
      springframework:
        boot:
          autoconfigure: ERROR
```

2、在IDEA中配置：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248799.png" alt="image-20210718135318964" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248800.png" alt="image-20210718135408491" />



> **关于端口被占用情况**

- 在启动**cloud-consumer-order80**模块的时候，报了如下错误：

  `java.net.BindException: Address already in use: JVM_Binding`

  将配置的80端口服务杀掉也不管用，后来我将8080端口的`ftpsvc`服务停用后，就解决了！

- 查找端口号被占用：

  ```
  netstat -ano |findstr “端口号”
  ```

- 杀死命令：

  ```
  taskkill /f /t /im “端口号”
  ```

  

  ![image-20210719232730685](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248801.png)



> **启动的时候报找不到主加载类的错误**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248802.png" alt="image-20210718174125382" />



> **cloud-provider-hystrix-payment8001构建启动8001报错：Cannot execute request on any known server**

报错如下：

```
com.netflix.discovery.shared.transport.TransportException: Cannot execute request on any known server
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248803.png" alt="image-20210724142824331" />

原因：

在`application.yml`中defaultZone少了/eureka

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151248804.png" alt="image-20210724143014306" />
