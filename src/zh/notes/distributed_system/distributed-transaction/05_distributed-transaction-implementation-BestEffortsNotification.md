---
title: 05_柔性事务-最大努力通知型方案
category:
  - 分布式事务
date: 2024-04-04
---

<!-- more -->

## 柔性事务-最大努力通知型方案

按规律进行通知，**不保证数据一定能通知成功，但会提供可查询操作接口进行核对**。这种方案主要用在与第三方系统通讯时，比如：调用微信或支付宝支付后的支付结果通知。这种方案也是结合 MQ 进行实现，例如：通过 MQ 发送 http 请求，设置最大通知次数。达到通知次数后即不再通知。

案例：银行通知、商户通知等（各大交易业务平台间的商户通知：多次通知、查询校对、对账文件），支付宝的支付成功异步回调

下面是一个简单的例子来说明最人努力通知的过程。假设有一个在线商城系统，顾客可以下订单购买商品。当顾客成功下单后，通知顾客订单已经确认。这个通知就可以采用最大努力通知的方式。

- 顾客下单后，商城订单系统会生成订单并记录订单信息
- 商城订单系统通过最大努力通知机制，将订单确认通知发送给用户通知服务。
- 用户通知服务把下单消息通过电子邮件发送给用户。商城系统不会等待顾客的确认，而是将通知放入消息队列中，并尽力发送通知
- 如果通知发送成功，那就很好，顾客会尽快收到订单确认邮件。但如果由于网络问题、电子邮件服务器问题或其他原因导致通知发送失败，商城系统可能会做一些尝试，尽可能的通知，重试多次后还是不成功，则不再发送

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/cd35399eaa84f63d.png)

需要注意的是，在最大努力通知的过程中，可能会出现**消息重复发送**的情况，也可能会出现**消息丢失**的情况。因此，在设计最人努力通知系统时，需要根据实际业务需求和风险承受能力来确定最大努力通知的策略和重试次数，以及对消息进行去重等处理。

最大努力通知这种事务实现方案，一般用在消息通知这种场景中，因为这种场景中如果存在一些不一致影响也不大。