---
title: ✅54、授人以渔：采用Raft协议进行主从数据同步，会影响TPS吗
category:
  - RocketMQ
date: 2025-10-24
---


**授人以渔：采用Raft协议进行主从数据同步，会影响TPS吗？**

---

今天我们想让大家思考一个问题，基于DLedger技术管理CommitLog之后，可以自动在一组Broker中选举出来一个Leader

然后在Leader接收消息写入的时候，基于DLedger技术写入本地CommitLog中，这个其实跟之前让Broker自己直接写入CommitLog是没什么区别的。

但是有区别的一点在于，Leader Broker上的DLedger在收到一个消息，将uncommitted消息写入自己本地存储之后，还需要基于Raft协议的算法，去采用两阶段的方式把uncommitted消息同步给其他Follower Broker

必须要超过一半的Follower Broker的DLedger对uncommitted消息返回ack，此时Leader Broker才能返回ACK给生产者，说这次写入成功了。

当然很多人会有疑问，那么不需要等他们执行了commit操作之后再返回给生产者吗？

实际上在这里只要有超过半数的Follower Broker都写入uncommitted消息之后，就可以返回给生产者了。

因此哪怕此时Leader Broker宕机了，超过半数的Follower Broker上也是有这个消息的，只不过是uncommitted状态，但是新选举的Leader Broker可以根据剩余Follower Broker上这个消息的状态去进行数据恢复，比如把消息状态调整为committed。

也就是说，这样的一个架构对每次写入都平添了一个成本，每次写入都必须有超过半数的Follower Broker都写入消息才可以算做一次写入成功

那么大家思考一个问题，这样做是不是会对Leader Broker的写入性能产生影响？是不是会降低TPS？

那么大家思考一下，是不是必须要在所有的场景都这么做？为什么？