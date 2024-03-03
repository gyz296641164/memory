---
title: 09_SpringBoot中的Actuator应用
category:
  - SpringBoot
date: 2024-03-04
---

<!-- more -->

## 1.Actuator介绍

通过前面的介绍我们明白了SpringBoot为什么能够很方便快捷的构建Web应用，那么应用部署上线后的健康问题怎么发现呢？在SpringBoot中给我们提供了Actuator来解决这个问题。

官网地址：[https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)

> ```
>   Spring Boot includes a number of additional features to help you monitor and manage your application when you push it to production. You can choose to manage and monitor your application by using HTTP endpoints or with JMX. Auditing, health, and metrics gathering can also be automatically applied to your application.
>
>   Spring Boot包括许多附加特性，可以帮助您在将应用程序投入生产时监视和管理应用程序。您可以选择使用HTTP端点或使用JMX来管理和监视应用程序。审计、运行状况和度量收集也可以自动应用于您的应用程序。
> ```

使用Actuator我们需要添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/38a320a117f2af41.png)

---

## 2.端点(Endpoints)

执行器端点（endpoints）可用于监控应用及与应用进行交互，Spring Boot包含很多内置的端点，你也可以添加自己的。例如，health端点提供了应用的基本健康信息。

每个端点都可以启用或禁用。这控制着端点是否被创建，并且它的bean是否存在于应用程序上下文中。要远程访问端点，还必须通过JMX或HTTP进行暴露,大部分应用选择HTTP，端点的ID映射到一个带 `/actuator`前缀的URL。例如，health端点默认映射到 `/actuator/health`。

**注意**：Spring Boot 2.0的端点基础路径由“/”调整到”/actuator”下,如：`/info`调整为 `/actuator/info` 可以通过以下配置改为和旧版本一致:

```
management.endpoints.web.base-path=/
```

默认在只放开了 `health`和 `info`两个 Endpoint。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/43f5fd387d5062e2.png)

如果要放开更多的Endpoint，我们需要配置如下信息

```
management.endpoints.web.exposure.include=*
```

以下是SpringBoot中提供的Endpoint。

| ID             | 描述                                                                                                                              | 默认启用 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| auditevents    | 显示当前应用程序的审计事件信息                                                                                                    | Yes      |
| beans          | 显示一个应用中 `所有Spring Beans`的完整列表                                                                                     | Yes      |
| conditions     | 显示 `配置类和自动配置类`(configuration and auto-configuration classes)的状态及它们被应用或未被应用的原因                       | Yes      |
| configprops    | 显示一个所有 `@ConfigurationProperties`的集合列表                                                                               | Yes      |
| env            | 显示来自Spring的 `ConfigurableEnvironment`的属性                                                                                | Yes      |
| flyway         | 显示数据库迁移路径，如果有的话                                                                                                    | Yes      |
| health         | 显示应用的 `健康信息`（当使用一个未认证连接访问时显示一个简单的’status’，使用认证连接访问则显示全部信息详情）                 | Yes      |
| info           | 显示任意的 `应用信息`                                                                                                           | Yes      |
| liquibase      | 展示任何Liquibase数据库迁移路径，如果有的话                                                                                       | Yes      |
| metrics        | 展示当前应用的 `metrics`信息                                                                                                    | Yes      |
| mappings       | 显示一个所有 `@RequestMapping`路径的集合列表                                                                                    | Yes      |
| scheduledtasks | 显示应用程序中的 `计划任务`                                                                                                     | Yes      |
| sessions       | 允许从Spring会话支持的会话存储中检索和删除(retrieval and deletion)用户会话。使用Spring Session对反应性Web应用程序的支持时不可用。 | Yes      |
| shutdown       | 允许应用以优雅的方式关闭（默认情况下不启用）                                                                                      | No       |
| threaddump     | 执行一个线程dump                                                                                                                  | Yes      |

shutdown端点默认是关闭的，我们可以打开它

```
# 放开 shutdown 端点
management.endpoint.shutdown.enabled=true
```

`shutdown`只支持post方式提交，我们可以使用 `POSTMAN`来提交或者使用IDEA中提供的工具来提交。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/bf0b70b617af1106.png)

如果使用web应用(Spring MVC, Spring WebFlux, 或者 Jersey)，你还可以使用以下端点：

| ID         | 描述                                                                                                                            | 默认启用 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| heapdump   | 返回一个GZip压缩的 `hprof`堆dump文件                                                                                          | Yes      |
| jolokia    | 通过HTTP暴露 `JMX beans`（当Jolokia在类路径上时，WebFlux不可用）                                                              | Yes      |
| logfile    | 返回 `日志文件内容`（如果设置了logging.file或logging.path属性的话），支持使用HTTP **Range**头接收日志文件内容的部分信息 | Yes      |
| prometheus | 以可以被Prometheus服务器抓取的格式显示 `metrics`信息                                                                          | Yes      |

现在我们看的 `health`信息比较少，如果我们需要看更详细的信息，可以配置如下

```
# health 显示详情
management.endpoint.health.show-details=always
```

再访问测试

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a6c6237dffaba4d1.png)

这样一来 `health`不仅仅可以监控SpringBoot本身的状态，还可以监控其他组件的信息，比如我们开启Redis服务。

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

添加Redis的配置信息

```
# Redis的 host 信息
spring.redis.host=192.168.100.120
```

重启服务，查看 `http://localhost:8080/actuator/health`

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/00bd7a9f7e8ccb64.png)

---

## 3.监控类型

介绍几个监控中比较重要的类型

### 3.1 health

显示的系统的健康信息，这个在上面的案例中讲解的比较多，不再赘述。

### 3.2 metrics

metrics 端点用来返回当前应用的各类重要度量指标，比如内存信息，线程信息，垃圾回收信息等。如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7700e2dbdcbf4e65.png)

各个指标信息的详细描述：

| 序号             | 参数                                       | 参数说明                                                        | 是否监控 | 监控手段                                                                               | 重要度 |
| ---------------- | ------------------------------------------ | --------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- | ------ |
| **JVM**    |                                            |                                                                 |          |                                                                                        |        |
| 1                | **jvm.memory.max**                   | **JVM** 最大内存                                          |          |                                                                                        |        |
| 2                | **jvm.memory.committed**             | **JVM** 可用内存                                          | 是       | 展示并监控堆内存和**Metaspace**                                                  | 重要   |
| 3                | **jvm.memory.used**                  | **JVM** 已用内存                                          | 是       | 展示并监控堆内存和**Metaspace**                                                  | 重要   |
| 4                | **jvm.buffer.memory.used**           | **JVM** 缓冲区已用内存                                    |          |                                                                                        |        |
| 5                | **jvm.buffer.count**                 | 当前缓冲区数                                                    |          |                                                                                        |        |
| 6                | **jvm.threads.daemon**               | **JVM** 守护线程数                                        | 是       | 显示在监控页面                                                                         |        |
| 7                | **jvm.threads.live**                 | **JVM** 当前活跃线程数                                    | 是       | 显示在监控页面；监控达到阈值时报警                                                     | 重要   |
| 8                | **jvm.threads.peak**                 | **JVM** 峰值线程数                                        | 是       | 显示在监控页面                                                                         |        |
| 9                | **jvm.classes.loaded**               | 加载**classes** 数                                        |          |                                                                                        |        |
| 10               | **jvm.classes.unloaded**             | 未加载的**classes** 数                                    |          |                                                                                        |        |
| 11               | **jvm.gc.memory.allocated**          | **GC** 时，年轻代分配的内存空间                           |          |                                                                                        |        |
| 12               | **jvm.gc.memory.promoted**           | **GC** 时，老年代分配的内存空间                           |          |                                                                                        |        |
| 13               | **jvm.gc.max.data.size**             | **GC** 时，老年代的最大内存空间                           |          |                                                                                        |        |
| 14               | **jvm.gc.live.data.size**            | **FullGC** 时，老年代的内存空间                           |          |                                                                                        |        |
| 15               | **jvm.gc.pause**                     | **GC** 耗时                                               | 是       | 显示在监控页面                                                                         |        |
| **TOMCAT** |                                            |                                                                 |          |                                                                                        |        |
| 16               | **tomcat.sessions.created**          | **tomcat** 已创建 **session** 数                    |          |                                                                                        |        |
| 17               | **tomcat.sessions.expired**          | **tomcat** 已过期 **session** 数                    |          |                                                                                        |        |
| 18               | **tomcat.sessions.active.current**   | **tomcat** 活跃 **session** 数                      |          |                                                                                        |        |
| 19               | **tomcat.sessions.active.max**       | **tomcat** 最多活跃 **session** 数                  | 是       | 显示在监控页面，超过阈值可报警或者进行动态扩容                                         | 重要   |
| 20               | **tomcat.sessions.alive.max.second** | **tomcat** 最多活跃 **session** 数持续时间          |          |                                                                                        |        |
| 21               | **tomcat.sessions.rejected**         | 超过**session** 最大配置后，拒绝的 **session** 个数 | 是       | 显示在监控页面，方便分析问题                                                           |        |
| 22               | **tomcat.global.error**              | 错误总数                                                        | 是       | 显示在监控页面，方便分析问题                                                           |        |
| 23               | **tomcat.global.sent**               | 发送的字节数                                                    |          |                                                                                        |        |
| 24               | **tomcat.global.request.max**        | **request** 最长时间                                      |          |                                                                                        |        |
| 25               | **tomcat.global.request**            | 全局**request** 次数和时间                                |          |                                                                                        |        |
| 26               | **tomcat.global.received**           | 全局**received** 次数和时间                               |          |                                                                                        |        |
| 27               | **tomcat.servlet.request**           | **servlet** 的请求次数和时间                              |          |                                                                                        |        |
| 28               | **tomcat.servlet.error**             | **servlet** 发生错误总数                                  |          |                                                                                        |        |
| 29               | **tomcat.servlet.request.max**       | **servlet** 请求最长时间                                  |          |                                                                                        |        |
| 30               | **tomcat.threads.busy**              | **tomcat** 繁忙线程                                       | 是       | 显示在监控页面，据此检查是否有线程夯住                                                 |        |
| 31               | **tomcat.threads.current**           | **tomcat** 当前线程数（包括守护线程）                     | 是       | 显示在监控页面                                                                         | 重要   |
| 32               | **tomcat.threads.config.max**        | **tomcat** 配置的线程最大数                               | 是       | 显示在监控页面                                                                         | 重要   |
| 33               | **tomcat.cache.access**              | **tomcat** 读取缓存次数                                   |          |                                                                                        |        |
| 34               | **tomcat.cache.hit**                 | **tomcat** 缓存命中次数                                   |          |                                                                                        |        |
| **CPU**    |                                            |                                                                 |          |                                                                                        |        |
| 35               | **system.cpu.count**                 | **CPU** 数量                                              |          |                                                                                        |        |
| 36               | **system.load.average.1m**           | **load average**                                          | 是       | 超过阈值报警                                                                           | 重要   |
| 37               | **system.cpu.usage**                 | 系统**CPU** 使用率                                        |          |                                                                                        |        |
| 38               | **process.cpu.usage**                | 当前进程**CPU** 使用率                                    | 是       | 超过阈值报警                                                                           |        |
| 39               | **http.server.requests**             | **http** 请求调用情况                                     | 是       | 显示**10** 个请求量最大，耗时最长的 **URL**；统计非 **200** 的请求量 | 重要   |
| 40               | **process.uptime**                   | 应用已运行时间                                                  | 是       | 显示在监控页面                                                                         |        |
| 41               | **process.files.max**                | 允许最大句柄数                                                  | 是       | 配合当前打开句柄数使用                                                                 |        |
| 42               | **process.start.time**               | 应用启动时间点                                                  | 是       | 显示在监控页面                                                                         |        |
| 43               | **process.files.open**               | 当前打开句柄数                                                  | 是       | 监控文件句柄使用率，超过阈值后报警                                                     | 重要   |

如果要查看具体的度量信息的话，直接在访问地址后面加上度量信息即可：

```
http://localhost:8080/actuator/metrics/jvm.buffer.memory.used
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/43da9cf0783ad1b5.png)

**添加自定义的统计指标**

```java
@RestController
public class UserController {

    static final Counter userCounter = Metrics.counter("user.counter.total","services","bobo");
    private Timer timer = Metrics.timer("user.test.timer","timer","timersample");
    private DistributionSummary summary = Metrics.summary("user.test.summary","summary","summarysample");

    @GetMapping("/hello")
    public String hello(){
        // Gauge
        Metrics.gauge("user.test.gauge",8);
        // Counter
        userCounter.increment(1);
        // timer
        timer.record(()->{
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });

        summary.record(2);
        summary.record(3);
        summary.record(4);
        return "Hello";
    }
}
```

访问 [http://localhost:8080/hello](http://localhost:8080/hello) 这个请求后在看 metrics 信息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ce222bd4a2200352.png)

多出了我们自定义的度量信息。

### 3.3 loggers

loggers是用来查看当前项目每个包的日志级别的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c2311c9f550a8c82.png)

默认的是info级别。

修改日志级别：

发送POST请求到 [http://localhost:8080/actuator/loggers/](http://localhost:8080/actuator/loggers/)[包路径]

请求参数为

```
{
    "configuredLevel":"DEBUG"
}
```

通过POSTMAN来发送消息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0b4c235e51fe05b0.png)

然后再查看日志级别发现已经变动了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/47eb76d5b7b71b90.png)

控制台也可以看到

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1bd60f02167866b2.png)

### 3.4 info

显示任意的应用信息。我们可以在 properties 中来定义

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a810c3cf9d1d1905.png)

访问：[http://localhost:8080/actuator/info](http://localhost:8080/actuator/info)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/097b8bf997aae04e.png)

---

## 4.定制端点

### 4.1 定制Health端点

一般主流的框架组件都会提供对应的健康状态的端点，比如MySQL，Redis，Nacos等，但有时候我们自己业务系统或者自己封装的组件需要被健康检查怎么办，这时我们也可以自己来定义。先来看看 diskSpace磁盘状态的

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7e83646bfcca81fd.png)

对应的端点是 DiskSpaceHealthIndicator

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d799ae9deb19fc2a.png)

有了上面的案例我们就可以自定义一个监控的健康状态的端点了。

```java
/**
 * 自定义的health端点
 */
@Component
public class DpbHealthIndicator extends AbstractHealthIndicator {
    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        boolean check = doCheck();
        if(check){
            builder.up();
        }else {
            builder.down();
        }
        builder.withDetail("total",666).withDetail("msg","自定义的HealthIndicator");

    }

    private boolean doCheck() {
        return true;
    }
}

```


启动服务

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a8ce3d61527b7841.png)

在admin中也可以监控到

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/047b7820957e98a0.png)


### 4.2 定制info端点

info节点默认情况下就是空的

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8cae97ed89fd2134.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/de2b7ece1f90c432.png)

这时我们可以通过info自定义来添加我们需要展示的信息，实现方式有两种

#### 1.编写配置文件

在属性文件中配置

```properties
info.author=bobo
info.serverName=ActuatorDemo1
info.versin=6.6.6
info.mavneProjectName=@project.artifactId@
```

重启服务

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/18110a099c0f3a8b.png)

admin中也一样

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/603660ffc392a3f0.png)


#### 2.编写InfoContributor

上面的方式是直接写在配置文件中的，不够灵活，这时我们可以在自定义的Java类中类实现

```java
/**
 * 自定义info 信息
 */
@Component
public class DpbInfo implements InfoContributor {
    @Override
    public void contribute(Info.Builder builder) {
        builder.withDetail("msg","hello")
                .withDetail("时间",new Date())
                .withDetail("地址","湖南长沙");
    }
}
```

然后启动测试

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0122e5bec7bcc820.png)




### 4.3 定制Metrics端点

除了使用metrics端点默认的这些统计指标外，我们还可以实现自定义统计指标，metrics提供了4中基本的度量类型：

* gauge 计量器，最简单的度量类型，只有一个简单的返回值，他用来记录一些对象或者事物的瞬时值。
* Counter 计数器 简单理解就是一种只增不减的计数器，它通常用于记录服务的请求数量，完成的任务数量，错误的发生数量
* Timer 计时器 可以同时测量一个特定的代码逻辑块的调用（执行）速度和它的时间分布。简单来说，就是在调用结束的时间点记录整个调用块执行的总时间，适用于测量短时间执行的事件的耗时分布，例如消息队列消息的消费速率。
* Summary 摘要 用于跟踪事件的分布。它类似于一个计时器，但更一般的情况是，它的大小并不一定是一段时间的测量值。在**micrometer** 中，对应的类是**DistributionSummary**，它的用法有点像**Timer**，但是记录的值是需要直接指定，而不是通过测量一个任务的执行时间。

测试：

```java
    @GetMapping("/hello")
    public String hello(String username){
        // 记录单个值，比如统计 MQ的消费者的数量
        Metrics.gauge("dpb.gauge",100);
        // 统计次数
        Metrics.counter("dpb.counter","username",username).increment();
        // Timer 统计代码执行的时间
         Metrics.timer("dpb.Timer").record(()->{
             // 统计业务代码执行的时间
             try {
                 Thread.sleep(new Random().nextInt(999));
             } catch (InterruptedException e) {
                 e.printStackTrace();
             }
         });

         Metrics.summary("dpb.summary").record(2.5);
       
        return "hello";
    }
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/aa28a1562c07031c.png)

查看具体的指标信息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b08dbe378966ba40.png)

查看对应的tag信息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/dccf693cb2da354e.png)



### 4.4自定义Endpoint

如果我们需要扩展Endpoint，这时我们可以自定义实现，我们可以在类的头部定义如下的注解

> - @Endpoint
> - @WebEndpoint
> - @ControllerEndpoint
> - @RestControllerEndpoint
> - @ServletEndpoint

再给方法添加@ReadOperation，@ WritOperation或@DeleteOperation注释后，该方法将通过JMX自动公开，并且在Web应用程序中也通过HTTP公开。

于方法的注解有以下三种，分别对应get post delete 请求

| Operation        | HTTP method |
| ---------------- | ----------- |
| @ReadOperation   | GET         |
| @WriteOperation  | POST        |
| @DeleteOperation | DELETE      |

案例：

```java
@Component
@Endpoint(id = "dpb.sessions")
public class DpbEndpoint {
    Map<String,Object> map = new HashMap<>();
    /**
     * 读取操作
     * @return
     */
    @ReadOperation
    public Map<String,Object> query(){

        map.put("username","dpb");
        map.put("age",18);
        return map;
    }

    @WriteOperation
    public void save( String address){
        map.put("address",address);
    }
}
```



![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c49b38d435547ac6.png)

写入操作：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/cd79ce55b274ebe5.png)


![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/948f9a5f8941cc5e.png)

---

## 5.Actuator的两种监控形态

* http
* jmx  [Java Management Extensions] Java管理扩展

放开jmx

```
# 放开 jmx 的 endpoint
management.endpoints.jmx.exposure.include=*
spring.jmx.enabled=true
```

通过jdk中提供的jconsole来查看

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a8a5be8cc1d2125d.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7834f96bfc1981b5.png)

---

## 6.监控系统

SpringBoot可以收集监控数据，但是查看不是很方便，这时我们可以选择开源的监控系统来解决，比如Prometheus

* 数据采集
* 数据存储
* 可视化

Prometheus在可视化方面效果不是很好，可以使用grafana来实现

### 6.1 Prometheus

先来安装Prometheus：官网：[https://prometheus.io/download/](https://prometheus.io/download/) 然后通过wget命令来直接下载

```
wget https://github.com/prometheus/prometheus/releases/download/v2.28.1/prometheus-2.28.1.linux-amd64.tar.gz
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6e9b1e2ae6ad6e25.png)

然后配置Prometheus。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/3c85a9c89182039d.png)

```
  - job_name: 'Prometheus'
    static_configs:
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s
    - targets: ['192.168.127.1:8080']
      labels:
        instance: Prometheus
```

* job_name：任务名称
* metrics_path： 指标路径
* targets：实例地址/项目地址，可配置多个
* scrape_interval： 多久采集一次
* scrape_timeout： 采集超时时间

执行脚本启动应用 boge_java

```
./prometheus --config.file=prometheus.yml
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/838e1ef31ba7f08b.png)

访问应用： [http://ip:9090](http://ip:9090)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/fc34f6f660a1b0cd.png)

然后在我们的SpringBoot服务中添加 Prometheus的端点,先添加必要的依赖

```
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
        </dependency>
```

然后就会有该端点信息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/47a5a2d97f60a735.png)

Prometheus服务器可以周期性的爬取这个endpoint来获取metrics数据,然后可以看到

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/76f3c93d45879cc3.png)

### 6.2 Grafana

可视化工具：[https://grafana.com/grafana/download](https://grafana.com/grafana/download)

通过wget命令下载

```
wget https://dl.grafana.com/oss/release/grafana-8.0.6-1.x86_64.rpm
sudo yum install grafana-8.0.6-1.x86_64.rpm
```

启动命令

```
sudo service grafana-server start
sudo service grafana-server status
```

访问的地址是 [http://ip:3000](http://ip:3000)  默认的帐号密码 admin/admin

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1e8655d803c2b27a.png)

登录进来后的页面

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/670438dd4f2a3bd6.png)

添加数据源：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/05e6c2f686681fa7.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ec964206ab60b2b0.png)

添加Dashboards  [https://grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards)  搜索SpringBoot的 Dashboards

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f0d2f4a0bff8fbdb.png)

找到Dashboards的ID

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a373ab2d27f4f408.png)

然后导入即可

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/79eace48732c065a.png)

点击Load出现如下界面

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b12c11acdafc35d9.png)

然后就可以看到对应的监控数据了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4847aa7e99c7f881.png)

### 6.3 SpringBoot Admin

基于SpringBootAdmin的开源产品很多，我们选择这个:https://github.com/codecentric/spring-boot-admin

#### 6.3.1 搭建Admin服务器

创建建对应的SpringBoot项目，添加相关依赖

```xml
        <dependency>
            <groupId>de.codecentric</groupId>
            <artifactId>spring-boot-admin-starter-server</artifactId>
            <version>2.5.1</version>
        </dependency>
```

然后放开Admin服务即可

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7d6d3376edd19c40.png)

然后启动服务，即可访问

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8e900bfd34a5ff73.png)

这个时候没有服务注册，所以是空的，这时我们可以创建对应的客户端来监控

#### 6.3.2 客户端配置

创建一个SpringBoot项目整合Actuator后添加Admin的客户端依赖

```xml
        <dependency>
            <groupId>de.codecentric</groupId>
            <artifactId>spring-boot-admin-starter-client</artifactId>
            <version>2.5.1</version>
        </dependency>
```

然后在属性文件中添加服务端的配置和Actuator的基本配置

```properties
server.port=8081
# 配置 SpringBoot Admin 服务端的地址
spring.boot.admin.client.url=http://localhost:8080
# Actuator的基本配置
management.endpoints.web.exposure.include=*
```

然后我们再刷新Admin的服务端页面

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/564760e85bd39110.png)

那么我们就可以在这个可视化的界面来处理操作了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/102e78ef83a19155.png)

#### 6.3.3 服务状态

我们可以监控下MySQL的状态，先添加对应的依赖

```xml
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
```

然后添加对应的jdbc配置

```properties
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/mysql-base?serverTimezone=UTC&useUnicode=true&characterEncoding=utf-8&useSSL=true
spring.datasource.username=root
spring.datasource.password=123456
```

然后我们在Admin中的health中就可以看到对应的数据库连接信息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c801062a651556b9.png)

注意当我把MySQL数据库关闭后，我们来看看

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/db08ca459d685d96.png)

我们可以看到Admin中的应用墙变灰了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8af0d61d02896ced.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d33a28c8df654400.png)

启动服务后，发现又正常了，然后我们修改下数据库连接的超时时间

```properties
# 数据库连接超时时间
spring.datasource.hikari.connection-timeout=2000
```

关闭数据库后，我们发下应用变红了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0fdcc7409f865827.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/03927bf675d1f174.png)

设置数据库连接超时后即可在有效的时间内发下应用的状态。

* 绿色：正常状态
* 灰色：连接客户端健康信息超时
* 红色：可以看到具体的异常信息

#### 6.3.4 安全防护

其实我们可以发现在SpringBootAdmin的管理页面中我们是可以做很多的操作的，这时如果别人知道了对应的访问地址，想想是不是就觉得恐怖，所以必要的安全防护还是很有必要的，我们来看看具体应该怎么来处理呢？

由于在分布式 web 应用程序中有几种解决身份验证和授权的方法，Spring Boot Admin 没有提供默认的方法。默认情况下，spring-boot-admin-server-ui 提供了一个登录页面和一个注销按钮。

导入依赖：

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
```

然后添加对应的配置类

```java
package com.bobo.admin.config;

import de.codecentric.boot.admin.server.config.AdminServerProperties;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.util.UUID;

@Configuration(proxyBeanMethods = false)
public class SecuritySecureConfig extends WebSecurityConfigurerAdapter {
    private final AdminServerProperties adminServer;

    private final SecurityProperties security;

    public SecuritySecureConfig(AdminServerProperties adminServer, SecurityProperties security) {
        this.adminServer = adminServer;
        this.security = security;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        SavedRequestAwareAuthenticationSuccessHandler successHandler = new SavedRequestAwareAuthenticationSuccessHandler();
        successHandler.setTargetUrlParameter("redirectTo");
        successHandler.setDefaultTargetUrl(this.adminServer.path("/"));

        http.authorizeRequests(
                (authorizeRequests) -> authorizeRequests.antMatchers(this.adminServer.path("/assets/**")).permitAll()
                        .antMatchers(this.adminServer.path("/actuator/info")).permitAll()
                        .antMatchers(this.adminServer.path("/actuator/health")).permitAll()
                        .antMatchers(this.adminServer.path("/login")).permitAll().anyRequest().authenticated()
        ).formLogin(
                (formLogin) -> formLogin.loginPage(this.adminServer.path("/login")).successHandler(successHandler).and()
        ).logout((logout) -> logout.logoutUrl(this.adminServer.path("/logout"))).httpBasic(Customizer.withDefaults())
                .csrf((csrf) -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .ignoringRequestMatchers(
                                new AntPathRequestMatcher(this.adminServer.path("/instances"),
                                        HttpMethod.POST.toString()),
                                new AntPathRequestMatcher(this.adminServer.path("/instances/*"),
                                        HttpMethod.DELETE.toString()),
                                new AntPathRequestMatcher(this.adminServer.path("/actuator/**"))
                        ))
                .rememberMe((rememberMe) -> rememberMe.key(UUID.randomUUID().toString()).tokenValiditySeconds(1209600));
    }

    // Required to provide UserDetailsService for "remember functionality"
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication().withUser(security.getUser().getName())
                .password("{noop}" + security.getUser().getPassword()).roles("USER");
    }
}

```

然后对应的设置登录的账号密码

```properties
spring.security.user.name=user
spring.security.user.password=123456
```

然后访问Admin管理页面

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c9decf34b7ee0ae5.png)

输入账号密码后可以进入，但是没有监控的应用了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/fe1236d1ec6a9b9e.png)

原因是被监控的服务要连接到Admin服务端也是需要认证的

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/01e1f12d7ae94d88.png)

我们在客户端配置连接的账号密码即可

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6047863c8c90c813.png)

重启后访问Admin服务管理页面

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/635000fd837cfa51.png)

搞定!

#### 6.3.5 注册中心

实际开发的时候我们可以需要涉及到的应用非常多，我们也都会把服务注册到注册中心中，比如nacos，Eureka等，接下来我们看看如何通过注册中心来集成客户端。就不需要每个客户端来集成了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/eb3ef2c55fb391dd.png)

变为下面的场景

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1f05fb3e2bea5179.png)

那么我们需要先启动一个注册中心服务，我们以Nacos为例

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/546f08e360518726.png)

然后访问下Nacos服务

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/32319be7978ba732.png)

暂时还没有服务注册，这时我们可以注册几个服务，用我之前写过的案例来演示。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/09ee00642567dfa8.png)

每个服务处理需要添加Nacos的注册中心配置外，我们还需要添加Actuator的配置

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/449230d527e25790.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/309475877cf25cc2.png)

然后启动相关的服务，可以看到相关的服务

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2c2129631a3c6f07.png)

然后我们需要配置下Admin中的nacos

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.bobo</groupId>
        <artifactId>ActuatorDemo</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.bobo</groupId>
    <artifactId>AdminServer</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>AdminServer</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>2020.0.1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>de.codecentric</groupId>
            <artifactId>spring-boot-admin-starter-server</artifactId>
            <version>2.5.1</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
                <dependency>
                    <groupId>com.alibaba.cloud</groupId>
                    <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                    <version>2021.1</version>
                    <type>pom</type>
                    <scope>import</scope>
                </dependency>
        </dependencies>
    </dependencyManagement>

</project>

```

```properties
spring.application.name=spring-boot-admin-server
spring.cloud.nacos.discovery.server-addr=192.168.56.100:8848
spring.cloud.nacos.discovery.username=nacos
spring.cloud.nacos.discovery.password=nacos
```

启动服务，我们就可以看到对应的服务了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/947a0d11f4f32f39.png)

要查看服务的详细监控信息，我们需要配置对应的Actuator属性

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6cba31d193d7ca00.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/dcf074b3ef771e00.png)

好了注册中心处理这块就介绍到这里

#### 6.3.6 邮件通知

如果监控的服务出现了问题，下线了，我们希望通过邮箱通知的方式来告诉维护人员，

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
```

然后配置对应的邮箱信息

```properties
# 使用的邮箱服务  qq 163等
spring.mail.host=smtp.qq.com
# 发送者
spring.mail.username=279583842@qq.com
# 授权码
spring.mail.password=rhcqzhfslkwjcach
#收件人
spring.boot.admin.notify.mail.to=1226203418@qq.com
#发件人
spring.boot.admin.notify.mail.from=279583842@qq.com

```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7a7a3a4a84b14379.png)

发送短信开启

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a22781a97599a883.png)

然后启动服务

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/884117902e54ceb9.png)

然后我们关闭服务然后查看服务和邮箱信息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2d402742cc97ece4.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/875391e0fa585a53.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f8e23bb69919913a.png)

好了对应的邮箱通知就介绍到这里，其他的通知方式可以参考官方网站
