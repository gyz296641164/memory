## Spring Session官方文档

[Spring Session 3.2.1](https://docs.spring.io/spring-session/reference/guides/boot-redis.html)

### 更新依赖项

在将 Spring Session 与 Redis 一起使用之前，必须确保具有正确的依赖项。我们假设您正在使用一个正在运行的 Spring Boot Web 应用程序。

```xml
<dependencies>
	<!-- ... -->

	<dependency>
		<groupId>org.springframework.session</groupId>
		<artifactId>spring-session-data-redis</artifactId>
	</dependency>
</dependencies>
```

Spring Boot 为 Spring Session 模块提供依赖管理，因此您无需显式声明依赖版本。

### Spring启动配置

添加所需的依赖项后，我们可以创建 Spring Boot 配置。得益于一流的自动配置支持，设置由 Redis 支持的 Spring Session 就像向您的 中添加单个配置属性一样简单`application.properties`，如以下清单所示：

`src/main/resources/application.properties`

```
spring.session.store-type=redis ＃会话存储类型。
```

在底层，Spring Boot 应用的配置相当于手动添加`@EnableRedisHttpSession`注释。这将创建一个名为`springSessionRepositoryFilter`Implements的 Spring bean `Filter`。过滤器负责替换`HttpSession`Spring Session 支持的实现。

可以使用应用程序进一步自定义`application.properties`，如以下清单所示：

`src/main/resources/application.properties`

```
server.servlet.session.timeout= # 会话超时。如果未指定持续时间后缀，则使用秒。
spring.session.redis.flush-mode=on_save ＃会话刷新模式。
spring.session.redis.namespace=spring:session # 用于存储会话的键的命名空间。
```

有关更多信息，请参阅Spring Boot 文档的[Spring Session部分。](https://docs.spring.io/spring-boot/docs/3.0.7/reference/htmlsingle/#boot-features-session)

### 配置Redis连接

Spring Boot 自动创建一个`RedisConnectionFactory`将 Spring Session 连接到本地主机上端口 6379（默认端口）的 Redis 服务器。在生产环境中，您需要更新配置以指向 Redis 服务器。例如，您可以在 application.properties 中包含以下内容：

`src/main/resources/application.properties`

```
spring.data.redis.host=localhost # Redis 服务器主机。
spring.data.redis.password= # redis服务器的登录密码。
spring.data.redis.port=6379 # Redis 服务器端口。
```

有关更多信息，请参阅Spring Boot 文档的[连接到 Redis部分。](https://docs.spring.io/spring-boot/docs/3.0.7/reference/htmlsingle/#boot-features-connecting-to-redis)

### Servlet容器初始化

我们的[Spring Boot 配置](https://docs.spring.io/spring-session/reference/3.0/guides/boot-redis.html#boot-spring-configuration)创建了一个名为的 Spring bean，`springSessionRepositoryFilter`它实现了`Filter`.该`springSessionRepositoryFilter`bean 负责`HttpSession`用 Spring Session 支持的自定义实现替换。

为了让我们`Filter`发挥它的魔力，Spring 需要加载我们的`Config`类。最后，我们需要确保我们的 servlet 容器（即 Tomcat）`springSessionRepositoryFilter`对每个请求都使用我们的。幸运的是，Spring Boot 为我们处理了这两个步骤。

---

## Spring Session整合

`cfmall-auth-server`服务整合Spring Session

### 导入依赖

`cfmall-auth-server/pom.xml`

```xml
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

### Spring启动配置

`cfmall-auth-server/src/main/resources/application.properties`

```properties
# 会话存储类型
spring.session.store-type=redis
# 会话超时。如果未指定持续时间后缀，则使用秒
server.servlet.session.timeout=30s
# 会话刷新模式
spring.session.redis.flush-mode=on_save
# 用于存储会话的键的命名空间
spring.session.redis.namespace=spring:session
```

### Redis配置

`cfmall-auth-server/src/main/resources/application.yml`

```yaml
spring:
  application:
    name: cfmall-auth-server
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
  redis:
    host: 192.168.17.130
    port: 6379
```

### Java配置

CfmallAuthServerApplication启动类上加`@EnableRedisHttpSession`注解，

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableRedisHttpSession
public class CfmallAuthServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallAuthServerApplication.class, args);
    }

}
```

### 测试

看是否将session存入redis中

出现问题：DefaultSerializer requires a Serializable payload but received an object of type [com.atguigu.gulimall.auth.vo.MemberRespVo]

原因： MemberResponseVo未实现序列化解接口

解决：`public class MemberResponseVo implements Serializable {...}`

再次测试发现redis中存储session数据，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/5870da054fce1f97e54c6c317fe7d04b.png#id=CoGy0&originHeight=111&originWidth=274&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**将**`**cfmall-product**`**服务同样按照上述操作进行Spring Session整合**
