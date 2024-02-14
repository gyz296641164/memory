---
title: ✅P289_商城业务-分布式事务-Seata-环境准备
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 1、简介

官网：[https://seata.io/zh-cn/](https://seata.io/zh-cn/)

Seata 是一款开源的分布式事务解决方案，致力于在微服务架构下提供高性能和简单易用的分布式事务服务。

---

## 2、核心概念

### TC - 事务协调者

维护全局和分支事务的状态，驱动全局事务提交或回滚。

### TM - 事务管理器

定义全局事务的范围：开始全局事务、提交或回滚全局事务。

### RM - 资源管理器

管理分支事务处理的资源，与 TC 交谈以注册分支事务和报告分支事务的状态，并驱动分支事务提交或回滚。

---

## 3、工作原理

Seata的工作模式： 首先，TM会告诉TC全局事务开始了，由各个事务分支向TC汇报事务的状态，是成功还是回滚。如果有一个事务分支汇报回滚，则之前提交的事务都会回滚，回滚的依赖于Seata中的Magic表，用于记录提交之前的版本和数据。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/8dba4bf186a6b74f55aab1ec877c46ae.png#id=KBfgZ&originHeight=505&originWidth=911&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
