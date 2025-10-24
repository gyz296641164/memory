---
title: ✅60、授人以渔：BIO、NIO、AIO以及Netty之间的关系是什么
category:
  - RocketMQ
date: 2025-10-24
---


**授人以渔：BIO、NIO、AIO以及Netty之间的关系是什么？**

---

今天的授人以渔环节给大家布置的任务会有点多，如果有朋友是对BIO、NIO、AIO以及Netty，SocketChannel，Selector，TCP这些网络和IO相关的基础知识都有比较扎实的了解，那么相信大家其实对今天文章里讲解的网络通信架构的实现思路，应该自己都能猜出来了。

实际上RocketMQ的网络通信架构就是基于Netty扩展实现的，包括Reactor主线程和Reactor线程池，这两个本质都是Netty封装好的概念，Netty自己就是基于Reactor模型去实现的。

因此希望如果有朋友对这些概念比较熟悉的，可以在评论区里分享出来自己的见解，即如何基于Netty、线程池去实现今天讲解的网络通信架构。

如果有朋友对这些技术都不太了解，建议大家自己查阅一些资料，搞明白TCP、BIO、NIO、AIO以及Netty这些都是什么东西，然后把自己的心得分享到评论区里去。