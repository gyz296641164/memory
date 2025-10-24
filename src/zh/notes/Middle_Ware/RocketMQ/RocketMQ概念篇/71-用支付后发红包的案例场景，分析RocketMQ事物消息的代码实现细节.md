---
title: ✅71、用支付后发红包的案例场景，分析RocketMQ事物消息的代码实现细节
category:
  - RocketMQ
date: 2025-10-24
---


**用支付后发红包的案例场景，分析RocketMQ事物消息的代码实现细节**

---

# 1、对RocketMQ的事务消息分析代码落地实现

今天我们来分析一下RocketMQ的事务消息的代码落地实现

既然已经对事务消息的流程、原理以及使用场景都进行了分析，那下一步就是真正看看如何基于RocketMQ提供的Java API进行编码实现了。

我们将会直接基于官方文档提供的事务消息API使用的例子来给大家进行分析，同时我们会把订单系统的业务场景放在里面，加入一些伪代码让大家来参考一下。

对代码的分析我们全部基于注释写在代码里了，大家通过看注释就完全可以理解代码的使用。

---

## 2、发送half事务消息出去

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141508607.png)

---

# 3、假如half消息发送失败，或者没收到half消息响应怎么办？

我们已经看到如何发送half消息了，但是假如发送half消息失败了怎么办呢？

此时我们其实会在执行“producer.sendMessageInTransaction(msg, null)”的时候，收到一个异常，发现消息发送失败了。

所以我们可以用下面的代码去关注half消息发送失败的问题：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141508085.png)

那如果一直没有收到half消息发送成功的通知呢？

针对这个问题，我们可以把发送出去的half消息放在内存里，或者写入本地磁盘文件，后台开启一个线程去检查，如果一个half消息超过比如10分钟都没有收到响应，那就自动触发回滚逻辑。

---

# 4、如果half消息成功了，如何执行订单本地事务？

刚才代码里有一个TransactionListener，这个类也是我们自己定义的，如下所示：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141508980.png)

---

# 5、如果没有返回commit或者rollback，如何进行回调？

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141508245.png)

---

# 6、给大家留下一个小作业

大家在看完今天对RocketMQ的事务消息代码的解释之后，建议大家可以去基于之前自己部署好的RocketMQ，去实验一下这个事务消息的代码

然后请大家自己反复思考一下，在这段代码运行的过程中，各个地方如果出现网络异常，或者是系统突然崩溃了，这套机制是如何确保消息投递稳定运行的。