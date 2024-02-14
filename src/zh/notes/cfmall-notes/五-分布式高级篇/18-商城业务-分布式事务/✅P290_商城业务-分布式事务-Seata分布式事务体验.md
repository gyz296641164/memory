---
title: ✅P290_商城业务-分布式事务-Seata分布式事务体验
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 创建undo_log表

每个微服务的数据库都创建undo_log表，

```sql
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

---

## 导入Seata依赖

为需要回滚的服务导入Seata依赖，本项目中`cfmall-product`、`cfmall-ware`、`cfmall-order`服务导入此依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
    <version>2.1.0.RELEASE</version>
    <exclusions>
        <exclusion>
            <groupId>io.seata</groupId>
            <artifactId>seata-all</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>io.seata</groupId>
    <artifactId>seata-all</artifactId>
    <version>1.1.0</version>
</dependency>
```

---

## 安装seata-server-1.1.0

官方地址：[https://github.com/seata/seata/releases](https://github.com/seata/seata/releases)

下载完成后进行配置，`file.conf`内容如下：

```nginx
transport {
  # tcp udt unix-domain-socket
  type = "TCP"
  #NIO NATIVE
  server = "NIO"
  #enable heartbeat
  heartbeat = true
  # the client batch send request enable
  enableClientBatchSendRequest = false
  #thread factory for netty
  threadFactory {
    bossThreadPrefix = "NettyBoss"
    workerThreadPrefix = "NettyServerNIOWorker"
    serverExecutorThreadPrefix = "NettyServerBizHandler"
    shareBossWorker = false
    clientSelectorThreadPrefix = "NettyClientSelector"
    clientSelectorThreadSize = 1
    clientWorkerThreadPrefix = "NettyClientWorkerThread"
    # netty boss thread size,will not be used for UDT
    bossThreadSize = 1
    #auto default pin or 8
    workerThreadSize = "default"
  }
  shutdown {
    # when destroy server, wait seconds
    wait = 3
  }
  serialization = "seata"
  compressor = "none"
}
# service configuration, only used in client side
service {
  #transaction service group mapping
  vgroupMapping.my_test_tx_group = "default"
  #only support when registry.type=file, please don't set multiple addresses
  default.grouplist = "127.0.0.1:8091"
  #degrade, current not support
  enableDegrade = false
  #disable seata
  disableGlobalTransaction = false
}
#client transaction configuration, only used in client side
client {
  rm {
    asyncCommitBufferLimit = 10000
    lock {
      retryInterval = 10
      retryTimes = 30
      retryPolicyBranchRollbackOnConflict = true
    }
    reportRetryCount = 5
    tableMetaCheckEnable = false
    reportSuccessEnable = false
    sqlParserType = druid
  }
  tm {
    commitRetryCount = 5
    rollbackRetryCount = 5
  }
  undo {
    dataValidation = true
    logSerialization = "jackson"
    logTable = "undo_log"
  }
  log {
    exceptionRate = 100
  }
}
```

registry.conf 修改后内容如下：将type改为nacos，将nacos{...}中的serverAddr、username、password修改为适配自己环境的内容

```
registry {
  # file 、nacos 、eureka、redis、zk、consul、etcd3、sofa
  type = "nacos"

  nacos {
    serverAddr = "127.0.0.1:8848"
    namespace = ""
    cluster = "default"
	username = "nacos"
	password = "nacos"
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
    group = "SEATA_GROUP"
  }
  consul {
    serverAddr = "127.0.0.1:8500"
  }
  apollo {
    app.id = "seata-server"
    apollo.meta = "http://192.168.1.204:8801"
    namespace = "application"
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

启动seata-server，双击seata-server.bat

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/fcbd4a4cf34c47b7.png#id=S7u7Z&originHeight=184&originWidth=377&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

查看Nacos中的服务列表，seata-server服务已被注册

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/f1eef0cee2cd43a9.png#id=tl7XY&originHeight=509&originWidth=1617&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 服务配置

将file.conf、registry.conf复制到项目`cfmall-product`、`cfmall-ware`、`cfmall-order`服务中，如下图所示。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/164139dbcd121efc.png#id=JFeWF&originHeight=339&originWidth=531&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

cfmall-order-fescar-service-group与.yml中tx-service-group命名一致，**命名规则：服务名-fescar-service-group**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/c97903733148dabc.png#id=GLqZK&originHeight=525&originWidth=1805&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

```yaml
spring:
  cloud:
    alibaba:
      seata:
        tx-service-group: cfmall-order-fescar-service-group
```

如果其它服务用到seata-server，同样的配置。

分布式事务入口`com.gyz.cfmall.order.service.impl.OrderServiceImpl#submitOrder`方法添加全局事务注解：@GlobalTransactional，

每一个远程的小事务添加@Transactional注解；

---

## 数据源代理

所有想要用到分布式事务的微服务需使用seata-DataSourceProxy代理自己的数据源。

**注意：seata在1.0.0版本之后就不需要手动进行数据源代理，已经被自动代理**

```java
package com.gyz.cfmall.order.config;

import com.zaxxer.hikari.HikariDataSource;
import io.seata.rm.datasource.DataSourceProxy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;


/**
 * @author: gongyuzhuo
 * @since: 2024-02-05 18:07
 * @description:
 */
@Configuration
public class MySeataConfig {
    @Autowired
    private DataSourceProperties dataSourceProperties;

    @Bean
    public DataSource dataSource(DataSourceProperties dataSourceProperties) {
        HikariDataSource dataSource = dataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
        if (StringUtils.hasText(dataSourceProperties.getName())) {
            dataSource.setPoolName(dataSourceProperties.getName());
        }
        return new DataSourceProxy(dataSource);
    }
}
```

---

## 测试事务回滚

实现目标：

在`com.gyz.cfmall.order.service.impl.OrderServiceImpl#submitOrder`方法中，逻辑是订单回滚、库存不回滚

手动设置了异常代码int i = 10/0；

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/f86274c425d8c4c8.png#id=O6F9M&originHeight=407&originWidth=750&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

查看数据库库存表`wms_ware_sku`和订单表`oms_order`的变化是否是正常回滚效果。
