---
title: Docker-compose & 可视化工具
category:
  - Docker
date: 2023-02-27
---

<!-- more -->

## Docker-compose容器编排

### 简介

#### 是什么

Compose 是 Docker 公司推出的一个工具软件，可以管理多个 Docker 容器组成一个应用。你需要定义一个 YAML 格式的配置文件`docker-compose.yml`，写好多个容器之间的调用关系。然后，只要一个命令，就能同时启动/关闭这些容器。

Docker-Compose是Docker官方的开源项目， 负责实现对Docker容器集群的快速编排。

---

#### 能干嘛

docker建议我们每一个容器中只运行一个服务，因为docker容器本身占用资源极少，所以最好是将每个服务单独的分割开来，但是这样我们又面临了一个问题？

如果我需要同时部署好多个服务，难道要每个服务单独写Dockerfile然后在构建镜像，构建容器，这样累都累死了，所以docker官方给我们提供了docker-compose多服务部署的工具。

例如要实现一个Web微服务项目，除了Web服务容器本身，往往还需要再加上后端的数据库mysql服务容器，redis服务器，注册中心eureka，甚至还包括负载均衡容器等等。

Compose允许用户通过一个单独的docker-compose.yml模板文件（YAML 格式）来定义**一组相关联的应用容器为一个项目（project）**。

可以很容易地用一个配置文件定义一个多容器的应用，然后使用一条指令安装这个应用的所有依赖，完成构建。Docker-Compose 解决了容器与容器之间如何管理编排的问题。

---

#### 去哪下

官网

- https://docs.docker.com/compose/compose-file/compose-file-v3/

官网下载

- https://docs.docker.com/compose/install/

安装步骤

```
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

docker-compose --version
```

卸载步骤

To uninstall Docker Compose if you installed using curl:

```
sudo rm /usr/local/bin/docker-compose
```

---

### Compose核心概念

#### 一文件

**docker-compose.yml**

#### 两要素

**服务（service）**

- 一个个应用容器实例，比如订单微服务、库存微服务、mysql容器、nginx容器或者redis容器

**工程（project）**

- 由一组关联的应用容器组成的一个完整业务单元，在 docker-compose.yml 文件中定义。

---

### Compose使用的三个步骤

- 编写Dockerfile定义各个微服务应用并构建出对应的镜像文件
- 使用 `docker-compose.yml` 定义一个完整业务单元，安排好整体应用中的各个容器服务。
- 最后，执行`docker-compose up`命令 来启动并运行整个应用程序，完成一键部署上线

---

### Compose常用命令

| docker-compose -h                                            | \# 查看帮助                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| **docker-compose up**                                        | **# 启动所有docker-compose服务**                           |
| **docker-compose up -d**                                     | **# 启动所有docker-compose服务并后台运行**                 |
| **docker-compose down**                                      | **# 停止并删除容器、网络、卷、镜像**                       |
| **docker-compose exec  yml里面的服务id**                     | **# 进入容器实例内部**                                     |
| docker-compose exec docker-compose.yml文件中写的服务id /bin/bash |                                                            |
| **docker-compose ps**                                        | **# 展示当前docker-compose编排过的运行的所有容器**         |
| **docker-compose top**                                       | **# 展示当前docker-compose编排过的容器进程**               |
| **docker-compose logs  yml里面的服务id**                     | **# 查看容器输出日志**                                     |
| **docker-compose config**                                    | **# 检查配置**                                             |
| **docker-compose config -q**                                 | **# 检查配置(docker-compose.yml语法格式)，有问题才有输出** |
| **docker-compose restart**                                   | **# 重启服务**                                             |
| **docker-compose start**                                     | **# 启动服务**                                             |
| **docker-compose stop**                                      | **# 停止服务**                                             |

---

### Compose编排微服务

#### 改造升级微服务工程docker_boot

- 改POM

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <project xmlns="http://maven.apache.org/POM/4.0.0"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  
      <modelVersion>4.0.0</modelVersion>
      <parent>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-parent</artifactId>
          <version>2.1.3.RELEASE</version>
          <relativePath/> <!-- lookup parent from repository -->
      </parent>
  
      <groupId>com.gyz.docker</groupId>
      <artifactId>docker_boot</artifactId>
      <version>0.0.1-SNAPSHOT</version>
  
      <properties>
          <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
          <maven.compiler.source>1.8</maven.compiler.source>
          <maven.compiler.target>1.8</maven.compiler.target>
          <junit.version>4.12</junit.version>
          <log4j.version>1.2.17</log4j.version>
          <lombok.version>1.16.18</lombok.version>
          <mysql.version>5.1.47</mysql.version>
          <druid.version>1.1.16</druid.version>
          <mapper.version>4.1.5</mapper.version>
          <mybatis.spring.boot.version>1.3.0</mybatis.spring.boot.version>
      </properties>
  
      <dependencies>
          <!--guava Google 开源的 Guava 中自带的布隆过滤器-->
          <dependency>
              <groupId>com.google.guava</groupId>
              <artifactId>guava</artifactId>
              <version>23.0</version>
          </dependency>
          <!-- redisson -->
          <dependency>
              <groupId>org.redisson</groupId>
              <artifactId>redisson</artifactId>
              <version>3.13.4</version>
          </dependency>
          <!--swagger2-->
          <dependency>
              <groupId>io.springfox</groupId>
              <artifactId>springfox-swagger2</artifactId>
              <version>2.9.2</version>
          </dependency>
          <dependency>
              <groupId>io.springfox</groupId>
              <artifactId>springfox-swagger-ui</artifactId>
              <version>2.9.2</version>
          </dependency>
          <!--SpringBoot与Redis整合依赖-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-data-redis</artifactId>
          </dependency>
          <!--springCache-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-cache</artifactId>
          </dependency>
          <!--springCache连接池依赖包-->
          <dependency>
              <groupId>org.apache.commons</groupId>
              <artifactId>commons-pool2</artifactId>
          </dependency>
          <!-- jedis -->
          <dependency>
              <groupId>redis.clients</groupId>
              <artifactId>jedis</artifactId>
              <version>3.1.0</version>
          </dependency>
          <!--Mysql数据库驱动-->
          <dependency>
              <groupId>mysql</groupId>
              <artifactId>mysql-connector-java</artifactId>
              <version>5.1.47</version>
          </dependency>
          <!--SpringBoot集成druid连接池-->
          <dependency>
              <groupId>com.alibaba</groupId>
              <artifactId>druid-spring-boot-starter</artifactId>
              <version>1.1.10</version>
          </dependency>
          <dependency>
              <groupId>com.alibaba</groupId>
              <artifactId>druid</artifactId>
              <version>${druid.version}</version>
          </dependency>
          <!--mybatis和springboot整合-->
          <dependency>
              <groupId>org.mybatis.spring.boot</groupId>
              <artifactId>mybatis-spring-boot-starter</artifactId>
              <version>${mybatis.spring.boot.version}</version>
          </dependency>
          <!-- 添加springboot对amqp的支持 -->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-amqp</artifactId>
          </dependency>
          <dependency>
              <groupId>commons-codec</groupId>
              <artifactId>commons-codec</artifactId>
              <version>1.10</version>
          </dependency>
          <!--通用基础配置junit/devtools/test/log4j/lombok/hutool-->
          <!--hutool-->
          <dependency>
              <groupId>cn.hutool</groupId>
              <artifactId>hutool-all</artifactId>
              <version>5.2.3</version>
          </dependency>
          <dependency>
              <groupId>junit</groupId>
              <artifactId>junit</artifactId>
              <version>${junit.version}</version>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-devtools</artifactId>
              <scope>runtime</scope>
              <optional>true</optional>
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
          <!--persistence-->
          <dependency>
              <groupId>javax.persistence</groupId>
              <artifactId>persistence-api</artifactId>
              <version>1.0.2</version>
          </dependency>
          <!--通用Mapper-->
          <dependency>
              <groupId>tk.mybatis</groupId>
              <artifactId>mapper</artifactId>
              <version>${mapper.version}</version>
          </dependency>
          <!--SpringBoot通用依赖模块-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-actuator</artifactId>
          </dependency>
          <!--test-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-test</artifactId>
              <scope>test</scope>
          </dependency>
      </dependencies>
  
      <build>
          <plugins>
              <plugin>
                  <groupId>org.springframework.boot</groupId>
                  <artifactId>spring-boot-maven-plugin</artifactId>
              </plugin>
              <plugin>
                  <groupId>org.apache.maven.plugins</groupId>
                  <artifactId>maven-resources-plugin</artifactId>
                  <version>3.1.0</version>
              </plugin>
          </plugins>
      </build>
  
  </project>
  ```

- 写YML

  ```properties
  server.port=10000
  # ========================alibaba.druid相关配置=====================
  spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
  spring.datasource.driver-class-name=com.mysql.jdbc.Driver
  spring.datasource.url=jdbc:mysql://192.168.129.129:3306/db2022?useUnicode=true&characterEncoding=utf-8&useSSL=false
  spring.datasource.username=root
  spring.datasource.password=123456
  spring.datasource.druid.test-while-idle=false
  # ========================redis相关配置=====================
  spring.redis.database=0
  spring.redis.host=192.168.129.129
  spring.redis.port=6379
  spring.redis.password=
  spring.redis.lettuce.pool.max-active=8
  spring.redis.lettuce.pool.max-wait=-1ms
  spring.redis.lettuce.pool.max-idle=8
  spring.redis.lettuce.pool.min-idle=0
  # ========================mybatis相关配置===================
  mybatis.mapper-locations=classpath:mapper/*.xml
  mybatis.type-aliases-package=com.gyz.docker.entities
  # ========================swagger=====================
  spring.swagger2.enabled=true
  ```

- 主启动

  ```java
  package com.gyz.docker;
  
  
  import org.springframework.boot.SpringApplication;
  import org.springframework.boot.autoconfigure.SpringBootApplication;
  import tk.mybatis.spring.annotation.MapperScan;
  
  /**
   * @Description:
   * @Author: gong_yuzhuo
   * @Date: 2022/4/13
   */
  @SpringBootApplication
  @MapperScan("com.gyz.docker.mapper")
  public class DockerBootApplication {
      public static void main(String[] args) {
          SpringApplication.run(DockerBootApplication.class, args);
      }
  }
  
  ```

- 业务类

  - RedisConfig配置类

    ```java
    package com.gyz.docker.config;
    
    import lombok.extern.slf4j.Slf4j;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
    import org.springframework.data.redis.core.RedisTemplate;
    import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
    import org.springframework.data.redis.serializer.StringRedisSerializer;
    
    import java.io.Serializable;
    
    /**
     * @Description:
     * @Author: gong_yuzhuo
     * @Date: 2022/4/15
     */
    @Configuration
    @Slf4j
    public class RedisConfig {
    
        /**
         * @param lettuceConnectionFactory
         * @return
         *
         * redis序列化的工具配置类，下面这个请一定开启配置
         * 127.0.0.1:6379> keys *
         * 1) "ord:102"  序列化过
         * 2) "\xac\xed\x00\x05t\x00\aord:102"   野生，没有序列化过
         */
        @Bean
        public RedisTemplate<String, Serializable> redisTemplate(LettuceConnectionFactory lettuceConnectionFactory) {
            RedisTemplate<String, Serializable> redisTemplate = new RedisTemplate<>();
    
            redisTemplate.setConnectionFactory(lettuceConnectionFactory);
            //设置key序列化方式string
            redisTemplate.setKeySerializer(new StringRedisSerializer());
            //设置value的序列化方式json
            redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
            redisTemplate.setHashKeySerializer(new StringRedisSerializer());
            redisTemplate.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
    
            redisTemplate.afterPropertiesSet();
    
            return redisTemplate;
        }
    
    }
    
    ```

  - SwaggerConfig

    ```java
    package com.gyz.docker.config;
    
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import springfox.documentation.builders.ApiInfoBuilder;
    import springfox.documentation.builders.PathSelectors;
    import springfox.documentation.builders.RequestHandlerSelectors;
    import springfox.documentation.service.ApiInfo;
    import springfox.documentation.spi.DocumentationType;
    import springfox.documentation.spring.web.plugins.Docket;
    import springfox.documentation.swagger2.annotations.EnableSwagger2;
    
    
    import java.text.SimpleDateFormat;
    import java.util.Date;
    
    /**
     * @Description:
     * @Author: gong_yuzhuo
     * @Date: 2022/4/15
     */
    @Configuration
    @EnableSwagger2
    public class SwaggerConfig {
    
        @Value("${spring.swagger2.enabled}")
        private Boolean enabled;
    
        @Bean
        public Docket createRestApi() {
            return new Docket(DocumentationType.SWAGGER_2)
                    .apiInfo(apiInfo())
                    .enable(enabled)
                    .select()
                    //你自己的package
                    .apis(RequestHandlerSelectors.basePackage("com.gyz.docker"))
                    .paths(PathSelectors.any())
                    .build();
        }
    
        public ApiInfo apiInfo() {
            return new ApiInfoBuilder()
                    .title("Docker学习" + "\t" + new SimpleDateFormat("yyyy-MM-dd").format(new Date()))
                    .description("docker-compose")
                    .version("1.0")
                    .termsOfServiceUrl("https://www.atguigu.com/")
                    .build();
        }
    
    }
    
    ```

  - 新建entity

    ```java
    //User.java
    
    package com.gyz.docker.entities;
    
    import javax.persistence.Column;
    import javax.persistence.GeneratedValue;
    import javax.persistence.Id;
    import javax.persistence.Table;
    import java.util.Date;
    
    /**
     * @Description:
     * @Author: gong_yuzhuo
     * @Date: 2022/4/15
     */
    @Table(name = "t_user")
    public class User {
        @Id
        @GeneratedValue(generator = "JDBC")
        private Integer id;
    
        /**
         * 用户名
         */
        private String username;
    
        /**
         * 密码
         */
        private String password;
    
        /**
         * 性别 0=女 1=男
         */
        private Byte sex;
    
        /**
         * 删除标志，默认0不删除，1删除
         */
        private Byte deleted;
    
        /**
         * 更新时间
         */
        @Column(name = "update_time")
        private Date updateTime;
    
        /**
         * 创建时间
         */
        @Column(name = "create_time")
        private Date createTime;
    
        /**
         * @return id
         */
        public Integer getId() {
            return id;
        }
    
        /**
         * @param id
         */
        public void setId(Integer id) {
            this.id = id;
        }
    
        /**
         * 获取用户名
         *
         * @return username - 用户名
         */
        public String getUsername() {
            return username;
        }
    
        /**
         * 设置用户名
         *
         * @param username 用户名
         */
        public void setUsername(String username) {
            this.username = username;
        }
    
        /**
         * 获取密码
         *
         * @return password - 密码
         */
        public String getPassword() {
            return password;
        }
    
        /**
         * 设置密码
         *
         * @param password 密码
         */
        public void setPassword(String password) {
            this.password = password;
        }
    
        /**
         * 获取性别 0=女 1=男
         *
         * @return sex - 性别 0=女 1=男
         */
        public Byte getSex() {
            return sex;
        }
    
        /**
         * 设置性别 0=女 1=男
         *
         * @param sex 性别 0=女 1=男
         */
        public void setSex(Byte sex) {
            this.sex = sex;
        }
    
        /**
         * 获取删除标志，默认0不删除，1删除
         *
         * @return deleted - 删除标志，默认0不删除，1删除
         */
        public Byte getDeleted() {
            return deleted;
        }
    
        /**
         * 设置删除标志，默认0不删除，1删除
         *
         * @param deleted 删除标志，默认0不删除，1删除
         */
        public void setDeleted(Byte deleted) {
            this.deleted = deleted;
        }
    
        /**
         * 获取更新时间
         *
         * @return update_time - 更新时间
         */
        public Date getUpdateTime() {
            return updateTime;
        }
    
        /**
         * 设置更新时间
         *
         * @param updateTime 更新时间
         */
        public void setUpdateTime(Date updateTime) {
            this.updateTime = updateTime;
        }
    
        /**
         * 获取创建时间
         *
         * @return create_time - 创建时间
         */
        public Date getCreateTime() {
            return createTime;
        }
    
        /**
         * 设置创建时间
         *
         * @param createTime 创建时间
         */
        public void setCreateTime(Date createTime) {
            this.createTime = createTime;
        }
    }
    
    ```

    ```java
    //UserDTO.java
    
    package com.gyz.docker.entities;
    
    import io.swagger.annotations.ApiModel;
    import io.swagger.annotations.ApiModelProperty;
    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;
    
    import java.util.Date;
    
    /**
     * @Description:
     * @Author: gong_yuzhuo
     * @Date: 2022/4/15
     */
    @NoArgsConstructor
    @AllArgsConstructor
    @Data
    @ApiModel(value = "用户信息")
    public class UserDTO {
        @ApiModelProperty(value = "用户ID")
        private Integer id;
    
        @ApiModelProperty(value = "用户名")
        private String username;
    
        @ApiModelProperty(value = "密码")
        private String password;
    
        @ApiModelProperty(value = "性别 0=女 1=男 ")
        private Byte sex;
    
        @ApiModelProperty(value = "删除标志，默认0不删除，1删除")
        private Byte deleted;
    
        @ApiModelProperty(value = "更新时间")
        private Date updateTime;
    
        @ApiModelProperty(value = "创建时间")
        private Date createTime;
    
        /**
         * @return id
         */
        public Integer getId() {
            return id;
        }
    
        /**
         * @param id
         */
        public void setId(Integer id) {
            this.id = id;
        }
    
        /**
         * 获取用户名
         *
         * @return username - 用户名
         */
        public String getUsername() {
            return username;
        }
    
        /**
         * 设置用户名
         *
         * @param username 用户名
         */
        public void setUsername(String username) {
            this.username = username;
        }
    
        /**
         * 获取密码
         *
         * @return password - 密码
         */
        public String getPassword() {
            return password;
        }
    
        /**
         * 设置密码
         *
         * @param password 密码
         */
        public void setPassword(String password) {
            this.password = password;
        }
    
        /**
         * 获取性别 0=女 1=男
         *
         * @return sex - 性别 0=女 1=男
         */
        public Byte getSex() {
            return sex;
        }
    
        /**
         * 设置性别 0=女 1=男
         *
         * @param sex 性别 0=女 1=男
         */
        public void setSex(Byte sex) {
            this.sex = sex;
        }
    
        /**
         * 获取删除标志，默认0不删除，1删除
         *
         * @return deleted - 删除标志，默认0不删除，1删除
         */
        public Byte getDeleted() {
            return deleted;
        }
    
        /**
         * 设置删除标志，默认0不删除，1删除
         *
         * @param deleted 删除标志，默认0不删除，1删除
         */
        public void setDeleted(Byte deleted) {
            this.deleted = deleted;
        }
    
        /**
         * 获取更新时间
         *
         * @return update_time - 更新时间
         */
        public Date getUpdateTime() {
            return updateTime;
        }
    
        /**
         * 设置更新时间
         *
         * @param updateTime 更新时间
         */
        public void setUpdateTime(Date updateTime) {
            this.updateTime = updateTime;
        }
    
        /**
         * 获取创建时间
         *
         * @return create_time - 创建时间
         */
        public Date getCreateTime() {
            return createTime;
        }
    
        /**
         * 设置创建时间
         *
         * @param createTime 创建时间
         */
        public void setCreateTime(Date createTime) {
            this.createTime = createTime;
        }
    
        @Override
        public String toString() {
            return "User{" +
                    "id=" + id +
                    ", username='" + username + '\'' +
                    ", password='" + password + '\'' +
                    ", sex=" + sex +
                    '}';
        }
    }
    
    ```

- 新建UserMapper

  ```java
  package com.gyz.docker.mapper;
  
  import com.gyz.docker.entities.User;
  import tk.mybatis.mapper.common.Mapper;
  
  /**
   * @Description:
   * @Author: gong_yuzhuo
   * @Date: 2022/4/15
   */
  public interface UserMapper extends Mapper<User> {
  }
  
  ```

- src\main\resources路径下新建mapper文件夹并新增UserMapper.xml

  ```java
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
  <mapper namespace="com.gyz.docker.mapper.UserMapper">
      <resultMap id="BaseResultMap" type="com.gyz.docker.entities.User">
          <!--
            WARNING - @mbg.generated
          -->
          <id column="id" jdbcType="INTEGER" property="id"/>
          <result column="username" jdbcType="VARCHAR" property="username"/>
          <result column="password" jdbcType="VARCHAR" property="password"/>
          <result column="sex" jdbcType="TINYINT" property="sex"/>
          <result column="deleted" jdbcType="TINYINT" property="deleted"/>
          <result column="update_time" jdbcType="TIMESTAMP" property="updateTime"/>
          <result column="create_time" jdbcType="TIMESTAMP" property="createTime"/>
      </resultMap>
  </mapper>
  ```

- 新建service

  ```java
  package com.gyz.docker.service;
  
  import com.gyz.docker.entities.User;
  import com.gyz.docker.mapper.UserMapper;
  import lombok.extern.slf4j.Slf4j;
  import org.springframework.data.redis.core.RedisTemplate;
  import org.springframework.stereotype.Service;
  
  import javax.annotation.Resource;
  
  /**
   * @Description:
   * @Author: gong_yuzhuo
   * @Date: 2022/4/15
   */
  @Service
  @Slf4j
  public class UserService {
      public static final String CACHE_KEY_USER = "user:";
  
      @Resource
      private UserMapper userMapper;
      @Resource
      private RedisTemplate redisTemplate;
  
      /**
       * addUser
       * @param user
       */
      public void addUser(User user) {
          //1 先插入mysql并成功
          int i = userMapper.insertSelective(user);
  
          if (i > 0) {
              //2 需要再次查询一下mysql将数据捞回来并ok
              user = userMapper.selectByPrimaryKey(user.getId());
              //3 将捞出来的user存进redis，完成新增功能的数据一致性。
              String key = CACHE_KEY_USER + user.getId();
              redisTemplate.opsForValue().set(key, user);
          }
      }
  
      /**
       * findUserById
       * @param id
       * @return
       */
      public User findUserById(Integer id) {
          User user = null;
          String key = CACHE_KEY_USER + id;
  
          //1 先从redis里面查询，如果有直接返回结果，如果没有再去查询mysql
          user = (User) redisTemplate.opsForValue().get(key);
  
          if (user == null) {
              //2 redis里面无，继续查询mysql
              user = userMapper.selectByPrimaryKey(id);
              if (user == null) {
                  //3.1 redis+mysql 都无数据
                  //你具体细化，防止多次穿透，我们规定，记录下导致穿透的这个key回写redis
                  return user;
              } else {
                  //3.2 mysql有，需要将数据写回redis，保证下一次的缓存命中率
                  redisTemplate.opsForValue().set(key, user);
              }
          }
          return user;
      }
  
  }
  
  ```

- 新建controller

  ```java
  package com.gyz.docker.controller;
  
  import cn.hutool.core.util.IdUtil;
  import com.gyz.docker.entities.User;
  import com.gyz.docker.service.UserService;
  import io.swagger.annotations.Api;
  import io.swagger.annotations.ApiOperation;
  import lombok.extern.slf4j.Slf4j;
  import org.springframework.web.bind.annotation.PathVariable;
  import org.springframework.web.bind.annotation.RequestMapping;
  import org.springframework.web.bind.annotation.RequestMethod;
  import org.springframework.web.bind.annotation.RestController;
  
  import javax.annotation.Resource;
  import java.util.Random;
  
  /**
   * @Description:
   * @Author: gong_yuzhuo
   * @Date: 2022/4/15
   */
  @Api(description = "用户User接口")
  @RestController
  @Slf4j
  public class UserController {
      @Resource
      private UserService userService;
  
      @ApiOperation("数据库新增3条记录")
      @RequestMapping(value = "/user/add", method = RequestMethod.POST)
      public void addUser() {
          for (int i = 1; i <= 3; i++) {
              User user = new User();
  
              user.setUsername("zzyy" + i);
              user.setPassword(IdUtil.simpleUUID().substring(0, 6));
              user.setSex((byte) new Random().nextInt(2));
  
              userService.addUser(user);
          }
      }
  
  /*    @ApiOperation("删除1条记录")
      @RequestMapping(value = "/user/delete/{id}", method = RequestMethod.POST)
      public void deleteUser(@PathVariable Integer id) {
          userService.deleteUser(id);
      }
  
      @ApiOperation("修改1条记录")
      @RequestMapping(value = "/user/update", method = RequestMethod.POST)
      public void updateUser(@RequestBody UserDTO userDTO) {
          User user = new User();
          BeanUtils.copyProperties(userDTO, user);
          userService.updateUser(user);
      }*/
  
      @ApiOperation("查询1条记录")
      @RequestMapping(value = "/user/find/{id}", method = RequestMethod.GET)
      public User findUserById(@PathVariable Integer id) {
          return userService.findUserById(id);
      }
  }
  
  ```

- mvn package命令将微服务形成新的jar包 并上传到Linux服务器/mydocker目录下

#### 编写Dockerfile

```
# 基础镜像使用java
FROM java:8
# 作者
MAINTAINER gongyuzhuo
# VOLUME 指定临时文件目录为/tmp，在主机/var/lib/docker目录下创建了一个临时文件并链接到容器的/tmp
VOLUME /tmp
# 将jar包添加到容器中并更名为gyz_docker.jar
ADD docker_boot-0.0.1-SNAPSHOT.jar gyz_docker.jar
# 运行jar包
RUN bash -c 'touch /gyz_docker.jar'
ENTRYPOINT ["java","-jar","/gyz_docker.jar"]
#暴露6001端口作为微服务
EXPOSE 6001
```

#### 构建镜像（不用Compose && 使用Compose）

```
docker build -t gyz_docker:1.6 .
```

> **不用Compose**

- 单独的mysql容器实例

- 新建mysql容器实例

  ```
  docker run -p 3306:3306 --name mysql57 --privileged=true -v /gyz/mysql/conf:/etc/mysql/conf.d -v /gyz/mysql/logs:/logs -v /gyz/mysql/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7
  ```

- 进入mysql容器实例并新建库db2022+新建表t_user

  ```
  docker exec -it mysql57 /bin/bash
  
  mysql -uroot -p
  
  create database db2022;
  
  use db2022;
  
  CREATE TABLE `t_user` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '用户名',
    `password` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '密码',
    `sex` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '性别 0=女 1=男 ',
    `deleted` TINYINT(4) UNSIGNED NOT NULL DEFAULT '0' COMMENT '删除标志，默认0不删除，1删除',
    `update_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`)
  ) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
  
  ```

- 单独的redis容器实例

  ```
  docker run  -p 6379:6379 --name redis608 --privileged=true -v /app/redis/redis.conf:/etc/redis/redis.conf -v /app/redis/data:/data -d redis:6.0.8 redis-server /etc/redis/redis.conf
  ```

- 微服务工程

  ```
  docker run -d -p 6001:6001 gyz_docker:1.6
  ```

- 查看上面三个容器实例是否启动成功

  ```
  docker ps 
  ```

- swagger测试

  ```
  http://localhost:你的微服务端口/swagger-ui.html#/
  ```

**上面成功了，有哪些问题?**

- 先后顺序要求固定，先mysql+redis才能微服务访问成功
- 多个run命令......
- 容器间的启停或宕机，有可能导致IP地址对应的容器实例变化，映射出错， 要么生产IP写死(可以但是不推荐)，要么通过服务调用

> **使用Compose**

重新编写docker-compose.yml文件

```
#docker-commpose版本
version: "3"

# 定义所有的 service 信息, services 下面的第一级别的 key（microService） 既是一个 service 的名称 
services:
  microService:
    image: gyz_docker:1.6
    container_name: ms01
    ports:
      - "6001:6001"
    volumes:
      - /app/microService:/data
    networks: 
      - gyz_net 
	# 定义容器启动顺序
    depends_on: 
      - redis
      - mysql
 
  redis:
    image: redis:6.0.8
    ports:
      - "6379:6379"
    volumes:
      - /app/redis/redis.conf:/etc/redis/redis.conf
      - /app/redis/data:/data
    networks: 
      - gyz_net
    command: redis-server /etc/redis/redis.conf
 
  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: '123456'
      MYSQL_ALLOW_EMPTY_PASSWORD: 'no'
      MYSQL_DATABASE: 'db2021'
      MYSQL_USER: 'gyz'
      MYSQL_PASSWORD: 'gyz123'
    ports:
       - "3306:3306"
    volumes:
       - /app/mysql/db:/var/lib/mysql
       - /app/mysql/conf/my.cnf:/etc/my.cnf
       - /app/mysql/init:/docker-entrypoint-initdb.d
    networks:
      - gyz_net
    command: --default-authentication-plugin=mysql_native_password #解决外部无法访问

# 创建网络 
networks: 
   gyz_net:
```

第二次修改微服务工程docker_boot。写YML

```properties
server.port=6001    
# ========================alibaba.druid????=====================
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
# spring.datasource.url=jdbc:mysql://192.168.129.129:3306/db2022?useUnicode=true&characterEncoding=utf-8&useSSL=false
spring.datasource.url=jdbc:mysql://mysql:3306/db2021?useUnicode=true&characterEncoding=utf-8&useSSL=false
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.druid.test-while-idle=false
# ========================redis相关配置=====================
spring.redis.database=0
# spring.redis.host=192.168.129.129
spring.redis.host=redis
spring.redis.port=6379
spring.redis.password=
spring.redis.lettuce.pool.max-active=8
spring.redis.lettuce.pool.max-wait=-1ms
spring.redis.lettuce.pool.max-idle=8
spring.redis.lettuce.pool.min-idle=0
# ========================mybatis相关配置===================
mybatis.mapper-locations=classpath:mapper/*.xml
mybatis.type-aliases-package=com.gyz.docker.entities
# ========================swagger=====================
spring.swagger2.enabled=true
```

mvn package命令将微服务形成新的jar包，也可以通过IDEA打包，并上传到Linux服务器/mydocker目录下。

![image-20220415201449633](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415201449633.png)

编写Dockerfile（用原来的即可）

```
# 基础镜像使用java
FROM java:8
# 作者
MAINTAINER gongyuzhuo
# VOLUME 指定临时文件目录为/tmp，在主机/var/lib/docker目录下创建了一个临时文件并链接到容器的/tmp
VOLUME /tmp
# 将jar包添加到容器中并更名为zzyy_docker.jar
ADD docker_boot-0.0.1-SNAPSHOT.jar gyz_docker.jar
# 运行jar包
RUN bash -c 'touch /gyz_docker.jar'
ENTRYPOINT ["java","-jar","/gyz_docker.jar"]
#暴露6001端口作为微服务
EXPOSE 6001
```

构建镜像

```
docker build -t gyz_docker:1.6
```

执行 docker-compose up 或者 执行 docker-compose up -d（后台运行）

![image-20220415201757343](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415201757343.png)

进入容器内部

```
docker-compose exec microService /bin/bash //microService：yml里面的服务id
```

进入mysql容器实例并新建库db2021+新建表t_user

```
docker exec -it 容器实例id /bin/bash

mysql -uroot -p  //密码123456

create database db2021; //以前构建过镜像运行实例，使用了数据卷， 发现db2021还是存在的
use db2021;

CREATE TABLE `t_user` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '用户名',
  `password` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '密码',
  `sex` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '性别 0=女 1=男 ',
  `deleted` TINYINT(4) UNSIGNED NOT NULL DEFAULT '0' COMMENT '删除标志，默认0不删除，1删除',
  `update_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

测试通过

![image-20220415202118114](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415202118114.png)

![image-20220415202152991](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415202152991.png)

关停

```
docker-compose stop
```

![image-20220415202304807](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415202304807.png)

---

## Docker轻量级可视化工具Portainer

### 是什么

Portainer 是一款轻量级的应用，它提供了图形化界面，用于方便地管理Docker环境，包括单机环境和集群环境。

---

### 安装

- 官网
  - https://www.portainer.io/

- Linux版安装

  - https://docs.portainer.io/v/ce-2.9/start/install/server/docker/linux

- 步骤

  - docker命令安装

    ```
    docker run -d -p 9000:9000 -p 9443:9443 --name portainer \
        --restart=always \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v portainer_data:/data \
        portainer/portainer
    ```

    ![image-20220415205057027](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415205057027.png)

  - 第一次登录需创建admin，访问地址：自己虚拟机ip:9000

    用户名，直接用默认admin

    密码记得8位，随便你写

  - 设置admin用户和密码后首次登陆

    ![image-20220415205201887](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415205201887.png)

  - 选择local选项卡后本地docker详细信息展示（对应命令：docker system df）

    ![image-20220415205253152](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220415205253152.png)

---

### 使用说明

> 参考：https://www.cnblogs.com/hellxz/p/install_portainer.html

---

## Docker容器监控之 CAdvisor+InfluxDB+Granfana

### 原生命令

**操作**

`docker stats`

![image-20220416122612210](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416122612210.png)

**问题**

通过 docker stats 命令可以很方便的看到当前宿主机上所有容器的CPU,内存以及网络流量等数据，一般小公司够用了。

但是，docker stats 统计结果只能是当前宿主机的全部容器，数据资料是实时的，没有地方存储、没有健康指标过线预警等功能。

---

### 容器监控3剑客

**CAdvisor监控收集+InfluxDB存储数据+Granfana展示图表**

![image-20220416123008890](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416123008890.png)

**CAdvisor**

![image-20220416123027821](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416123027821.png)

**InfluxDB**

![image-20220416123046422](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416123046422.png)

**Granfana**

![image-20220416123058841](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416123058841.png)

**总结**

![image-20220416123138703](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416123138703.png)

---

### compose容器编排，一套带走

**新建目录**

![image-20220416143122872](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143122872.png)

**新建3件套组合的 docker-compose.yml**

```yaml
version: '3.1'

volumes:
  grafana_data: {}

services:
  influxdb:
    image: tutum/influxdb:0.9
    restart: always
    environment:
      - PRE_CREATE_DB=cadvisor
    ports:
      - "8083:8083"
      - "8086:8086"
    volumes:
      - ./data/influxdb:/data

  cadvisor:
    image: google/cadvisor
    links:
      - influxdb:influxsrv
    command:
      - storage_driver=influxdb -storage_driver_db=cadvisor -storage_driver_host=influxsrv:8086
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro

  grafana:
    user: "104"
    image: grafana/grafana
    user: "104"
    restart: always
    links:
      - influxdb:influxsrv
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - HTTP_USER=admin
      - HTTP_PASS=admin
      - INFLUXDB_HOST=influxsrv
      - INFLUXDB_PORT=8086
      - INFLUXDB_NAME=cadvisor
      - INFLUXDB_USER=root
      - INFLUXDB_PASS=root
```

**启动docker-compose文件**

```
docker-compose up
```

![image-20220416143242812](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143242812.png)

**查看三个服务容器是否启动**

![image-20220416143330251](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143330251.png)

---

### 测试

> 浏览cAdvisor收集服务，http://ip:8080/

![image-20220416143408238](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143408238.png)

- 第一次访问慢，请稍等
- cadvisor也有基础的图形展现功能，这里主要用它来作数据采集

> 浏览influxdb存储服务，http://ip:8083/

![image-20220416143451478](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143451478.png)

> 浏览grafana展现服务，http://ip:3000，默认帐户密码（admin/admin）

- 重新设置密码：888888

![image-20220416143511893](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143511893.png)

- 配置数据源

  ![image-20220416143825266](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143825266.png)

- 选择influxdb数据源

  ![image-20220416143912360](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416143912360.png)

- 配置细节

  ![image-20220416144116780](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416144116780.png)

  ![image-20220416144219943](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416144219943.png)

  ![image-20220416144248584](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416144248584.png)

- 配置面板panel

  ![image-20220416144339553](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416144339553.png)

  ![image-20220416144553647](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416144553647.png)

​		![image-20220416145108170](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416145108170.png)

![image-20220416145148297](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220416145148297.png)

到这里cAdvisor+InfluxDB+Grafana容器监控系统就部署完成了！

---

## 进阶篇：K8S

TODO！
