# MyBatis源码面试题

## 一、介绍下你对MyBatis源码的理解

ORM框架：CRUD操作

1. SQL解析： 映射文件、注解--》映射器解析 XMLMapperBuilder MapperAnnotationBuilder
2. SQL执行: SqlSession 接口--》Executor --》 SimpleExecutor ReuseExecutor 【Statement--JDBC】
3. 结果映射：ResultSetHandler
4. 插件机制：Interceptor
5. 缓存机制--》工作中 二级缓存 --》Redis做缓存

## 二、谈谈你对MyBatis中缓存的理解

缓存的作用：不加缓存 

- 查询的效率降低
- 增大了数据库的压力

一级缓存：会话级别的

二级缓存：进程级别的

1、项目中要使用缓存  全局配置文件中 settings 我们需要打开， 在对应的映射文件中 `<cache>`

2、一级缓存是默认使用的。二级缓存我们需要自己开启：源码中是如何设计的？

- 一级和二级缓存的执行的先后顺序：先查二级缓存。二级缓存没有再看一级缓存。
- 一级缓存如果还是没有那么走数据库查询

作用域：一级缓存的作用域是session级别的，命中率很低

数据同步：DML操作的时候会清空缓存的数据

---

## 三、现在都是分布式环境，MyBatis如何实现三级缓存？

我们工作用到了三级缓存。通过Redis。怎么实现呢？ `<cache type = ''>`

三级缓存的自定义实现。重写Cache接口的读写方法

---

## 四、谈谈你对日志模块的理解

定位你对MyBatis框架的理解：

日志模块使用到了适配器模式，对于MyBatis中的数据库的相关操作通过代理模式实现了日志的监控

---

## 五、谈谈你对SqlSessionFactory的理解

SqlSessionFactory：工厂模式：负责SqlSession对象的管理

全局的。我们应该对SqlSessionFactory做单例处理；

完成全局配置文件和映射文件的加载解析--》Configuration对象

---

## 六、谈谈你对SqlSession的理解

SqlSession具体处理每个CRUD操作

1、生命周期：需要做数据库操作的时候会创建。不需要操作数据库就关闭

2、作用：完成数据库的操作

3、线程安全：SqlSession是线程不安全的 --》 单纯的MyBatis的应用。我们就不能把SqlSession作用成员变量来使用 在Spring环境中怎么处理的  SqlSessionTemplate

---

## 七、谈谈你对MyBatis中的Executor的源码理解

Executor：执行器。具体执行SQL操作

Executor：Simple Reuse Batch

CachingExecutor：缓存的装饰

## 八、MyBatis中是如何对占位符进行赋值的？

SQL解析：# $ ==> ParameterHandler

---

## 九、Spring中是如何解决MySQL的SqlSession的线程安全问题的？

在SqlSession中介绍了

---

## 十、聊聊你对MyBatis中的Configuration的源码的理解

Configuration：全局配置。映射文件解析的内容都保存在Configuration中

---

## 十一、谈谈MyBatis中的插件原理

1、插件的作用： 分页  SQL检查

2、插件的原理
