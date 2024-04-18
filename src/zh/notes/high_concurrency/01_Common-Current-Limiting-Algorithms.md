---
title: 什么是限流？常见的限流算法？
category:
  - 高可用
date: 2024-04-04
---

<!-- more -->

## 什么是限流？常见的限流算法？

限流是一种控制流量的技术，用于保护系统免受突发流量或恶意流量的影响。其基本原理是通过控制请求的速率或数量，确保系统在可承受的范围内运行。

常见的限流算法有:

1. **漏桶算法(常用)**：系统请求先进入漏桶，再从漏中逐一取出请求执行，控制漏桶的流霾。
2. **令牌桶算法(常用)**：系统请求会得到一个令牌，从令牌桶中取出一个令牌执行，控制令牌桶中令牌的数量。
3. 计数器算法(简单)：系统请求被计数，通过比较当前请求数与限流阈值来判断是否限流可以阻塞算法:当系统达到限流阈值时，不再接受新请求，等到限流阈值降下来再接受请求。
4. 令牌环算法：与令牌桶算法类似，但是在多个令牌桶之间形成环形结构，以便在不同的请求处理速率之间进行平衡。
5. 最小延迟算法：基于预测每个请求的处理时间，并在处理完请求后进行延迟，以控制请求的速率。
6. **滑动窗口(常用)**：基于一个固定大小的时间窗口，允许在该时间窗口内的请求数不超过设定的阈值。这个时间窗口随着时间的推移不断滑动，以适应不同时间段内的请求流量。