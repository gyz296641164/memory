---
title: 02_常见的分布式事务有哪些？
category:
  - 分布式事务
date: 2024-04-04
---

<!-- more -->

## 常见的分布式事务有哪些？

分布式事务的目的是保证分布式系统中的多个参与方的数据能够保证一致性。即所有参与者，在一次写操作过程中要么都成功，要么都失败。

至于这个一致性到底是怎样的一致性，是**强一致性**、还是**最终一致性**，不同的分布式事务方案其实达到的效果并不相同。

> **强一致性**

如果想要实现强一致性，那么就一定要引入一个协调者，通过协调者来协调所有参与者来进行提交或者回滚。所以，这类方案包含基于**XA规范**的二阶段及三阶段提交、以及支持2阶段提交的第三方框架，如**Seata**，~~还有**TCC**也是一种强一致性的方案~~。

> **最终一致性**

如果想要实现最终一致性，那么方案上就比较简单，常见的基于可靠消息的最终一致性(**本地消息表**、**事务消息**)、**柔性事务-TCC 事务补偿型方案**、**最大努力通知**、以及借助**Seata**等分布式事务框架都能实现。

可靠消息实现最终一致性的方案其实就是借助支持事务消息的中间件，通过发送事务消息的方式来保证最终一致性。

---

## 如何选择分布式事务实现方案？

在选择一个分布式事务方案的时候，需要考虑很多因素，结合自己的业务来做考量选择。一般来说可以有以下几种选择方式：

1. **实现成本**：根据项目开发和维护的难度、成本等方面来选择合适的分布式事务方案。这几种方案中，TCC和2PC的实现成本最高，业务侵入性也比较大。

   另外，事务消息、本地消息表和最大努力通知都依赖消息中间件，所以如果已有业务已经接入了消息中间件的话,那么使用成本还算可控，否则就需要考虑消息中间件部署、维护和接入成本。而且同样是消息中间件，也不是所有的都支持事务消息，这个也是需要考量的一个重要因素。

2. **一致性要求**：在一致性方面，2PC和TCC属于是可以保证强一致性的，而其他的几种方案是最终一致性的方案

   根据业务情况，比如下单环节中，库存扣减和订单创建可以用强一致性来保证。而订单创建和积分扣减就可以用最终一致性即可。而对于一些非核心链路的操作，如核对等，可以用最大努力通知即可。

3. **可用性要求**：根据CAP理论，可用性和一致性是没办法同时保证的，所以对于需要保证高可用的业务，**建议使用最大努力通知等最终一致性方案**；对于可用性要求不高，但是需要保证高一致性的业务，可使用2PC等方案。