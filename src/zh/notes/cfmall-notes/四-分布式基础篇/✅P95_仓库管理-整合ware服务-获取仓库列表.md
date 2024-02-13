---
title: ✅P95_仓库管理-整合ware服务-获取仓库列表
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## cfmall-ware服务
### pom.xml

`cfmall-ware/pom.xml`

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
    <artifactId>cfmall-ware</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>cfmall-ware</name>
    <description>cfmall-ware:仓储服务</description>

    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR3</spring-cloud.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.gyz.cfmall</groupId>
            <artifactId>cfmall-common</artifactId>
            <version>0.0.1-SNAPSHOT</version>
            <exclusions>
                <exclusion>
                    <artifactId>guava</artifactId>
                    <groupId>com.google.guava</groupId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <artifactId>asm</artifactId>
                    <groupId>org.ow2.asm</groupId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-seata</artifactId>
            <version>2.1.0.RELEASE</version>
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

### 启动类

`cfmall-ware/src/main/java/com/gyz/cfmall/ware/CfmallWareApplication.java`

```java
@SpringBootApplication
@MapperScan("com.gyz.cfmall.ware.dao") 
@EnableDiscoveryClient //开启服务注册与发现
@EnableFeignClients 
public class CfmallWareApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallWareApplication.class, args);
    }

}
```

### application.yml

`cfmall-ware/src/main/resources/application.yml`

```yaml
server:
  port: 8800

spring:
  application:
    name: cfmall-ware
  datasource:
    username: root
    password: 123456
    url: jdbc:mysql://192.168.xx.xx:3308/gulimall_wms?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
    driver-class-name: com.mysql.cj.jdbc.Driver
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848  # Nacos地址


mybatis-plus:
  mapper-locations: classpath:/mapper/**/*.xml
  #设置实体类的自增主键
  global-config:
    db-config:
      id-type: auto

# 打印sql日志
logging:
  level:
    com.gyz.cfmall: debug
```

### Nacos命名空间

新建命名空间，[Nacos地址](http://localhost:8848/nacos/#/namespace?dataId=&group=&appName=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241432864.png#id=uBUmL&originHeight=570&originWidth=1719&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

在项目`bootstrap.properties`中配置生成的命名空间ID，

```properties
# cfmall-ware/src/main/resources/bootstrap.properties
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
spring.cloud.nacos.config.namespace=ceed4eb4-5661-4dd6-9f38-d3bd5992cc91
```

启动服务后发现被注册到Nacos中，

`服务管理`->`服务列表`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241435719.png#id=JwyEm&originHeight=494&originWidth=984&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 路由配置

`cfmall-gateway/src/main/resources/application.yml`

```java
spring:
  cloud:
    gateway:
      routes:
		//......        
        - id: ware_route
          uri: lb://cfmall-ware
          predicates:
            - Path=/api/ware/**
          filters:
            - RewritePath=/api/(?<segment>/?.*),/$\{segment}
```

---

## 仓库列表

### 接口地址

```java
GET：/ware/wareinfo/list
```

### 请求参数

```java
{
   page: 1,//当前页码
   limit: 10,//每页记录数
   sidx: 'id',//排序字段
   order: 'asc/desc',//排序方式
   key: '华为'//检索关键字
}
```

> 分页数据


### 响应数据

```java
{
	"msg": "success",
	"code": 0,
	"page": {
		"totalCount": 0,
		"pageSize": 10,
		"totalPage": 0,
		"currPage": 1,
		"list": [{
			"id": 2,
			"name": "aa",
			"address": "bbb",
			"areacode": "124"
		}]
	}
}
```

### 后端代码

#### Controller

`cfmall-ware/src/main/java/com/gyz/cfmall/ware/controller/WareInfoController.java`

```java
    @Autowired
    private WareInfoService wareInfoService;

	/**
     * 列表
     */
    @RequestMapping("/list")
    public R list(@RequestParam Map<String, Object> params){
        PageUtils page = wareInfoService.queryPage(params);

        return R.ok().put("page", page);
    }
```

#### Service

```java
    @Override
    public PageUtils queryPage(Map<String, Object> params) {
        QueryWrapper<WareInfoEntity> queryWrapper = new QueryWrapper<>();

        String key = (String) params.get("key");

        if (!StringUtils.isEmpty(key)) {
            queryWrapper.eq("id", key)
                    .or().like("name", key)
                    .or().like("address", key)
                    .or().like("areacode", key);
        }

        IPage<WareInfoEntity> page = this.page(
                new Query<WareInfoEntity>().getPage(params),
                queryWrapper
        );

        return new PageUtils(page);
    }
```
