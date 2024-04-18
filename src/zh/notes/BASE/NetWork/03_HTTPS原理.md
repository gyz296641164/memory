---
title: HTTPS原理
category:
  - 计算机网络
date: 2024-03-29
---

<!-- more -->

## HTTP和HTTPS主要区别

### HTTPS概念

HTTPS （全称：Hypertext Transfer Protocol Secure [5]），是以安全为目标的 HTTP 通道，在HTTP的基础上通过传输加密和[身份认证](https://baike.baidu.com/item/身份认证/5294713?fromModule=lemma_inlink)保证了传输过程的安全性 [1]。HTTPS 在HTTP 的基础下加入[SSL](https://baike.baidu.com/item/SSL/320778?fromModule=lemma_inlink)，HTTPS 的安全基础是 SSL，因此加密的详细内容就需要 SSL。 HTTPS 存在不同于 HTTP 的默认端口及一个加密/身份验证层（在 HTTP与 [TCP](https://baike.baidu.com/item/TCP/33012?fromModule=lemma_inlink) 之间）。这个系统提供了身份验证与加密通讯方法。它被广泛用于[万维网](https://baike.baidu.com/item/万维网/215515?fromModule=lemma_inlink)上安全敏感的通讯，例如交易支付等方面。

### 区别

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/e860ae86edbc692c.png)

- **加密**：HTTPS在HTTP的基础上加入了SSL/TLS协议，提供了加密传输和身份认证的功能，使得数据在传输过程中更加安全，防止数据被窃取、修改或伪造。

- **端口号**：HTTP使用端口号80，而HTTPS使用端口号443。

- **证书认证**：当Web浏览器通过HTTPS连接到Web服务器时，服务器会向浏览器发送数字证书，该证书包含特定于服务器的信息，包括服务器的公钥。浏览器随后使用此证书与服务器建立安全连接。

- **费用**：HTTPS协议通常需要到CA（证书颁发机构）申请证书，而免费的证书很少，因此可能需要支付一定的费用。

- **连接方式**：HTTP的连接方式简单，是无状态的；而HTTPS的连接方式更为复杂，提供了身份验证和加密通讯。

### TCP三次握手

参考：[TCP三次握手、四次挥手](/zh/notes/BASE/NetWork/TCP.md)

---

## HTTPS工作流程

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/1fd0417c335f0bc6.png)

[HTTPS](https://m.baidu.com/s?word=HTTPS&sa=re_dqa_zy)的工作流程大致如下：

1. 客户端发起HTTPS请求。当用户在`浏览器`中输入一个HTTPS的URL并按下回车键时，浏览器会向服务器发起一个HTTPS连接的请求，这个请求包括了用户的`IP地址`、请求的页面等信息。
2. 服务器端配置证书。服务器在接收到请求后，会返回一个证书，这个证书包含了[公钥](https://m.baidu.com/s?word=公钥&sa=re_dqa_zy)以及由[CA](https://m.baidu.com/s?word=CA&sa=re_dqa_zy)(Certificate Authority,证书认证机构)对服务器身份的签名。
3. 客户端验证证书。客户端在接收到证书后，会首先检查证书是否过期，然后根据证书中的公钥信息，生成一个随机的[对称密钥](https://m.baidu.com/s?word=对称密钥&sa=re_dqa_zy)，并用证书中的公钥对这个对称密钥进行加密，然后将加密后的对称密钥发送给服务器。
4. 客户端生成随机密钥。客户端生成一个随机的会话密钥，密钥长度达到128位。
5. 客户端使用服务器的公钥加密会话密钥。客户端用服务器的公钥加密该会话密钥，产生加密会话密钥。
6. 服务器使用私钥解密会话密钥。服务器在接收到加密的对称密钥后，会用自己的私钥对其进行解密，得到对称密钥。
7. 客户端与服务器加密通信。服务器和浏览器之间的通信就会通过这个对称密钥进行加密和解密，这样，即使数据在传输过程中被截获，攻击者也无法获取到实际的数据内容。

一旦浏览器和服务器完成了上述的握手过程，两者就建立了一个安全的通信通道，可以进行数据的加密传输，在此之后的所有通信都会通过这个通道进行，直到用户关闭浏览器或者离开当前的网页。

## HTTPS混合加密流程

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/975414241023edf7.png)

1. Client发起请求（端口443）
2. Server返回公钥证书（Server中有公钥和私钥，只发送公钥给Client）
3. Client验证证书
4. Client生成对称密钥，用公钥加密后发给Server
5. Server使用私钥解密，得到对称密钥
6. C/S双方使用对称密钥：
7. 加密明文并发送
8. 解密密文得到明文

---

## HTTPS握手过程---TLS1.2

引自：[浅析 TLS1.2协议的握手流程](https://zhuanlan.zhihu.com/p/662069195)

### 主流程

理解了一些基本概念之后，下面我们将在浏览器访问某些 HTTPS 域名，抓包分析 TLS 的工作流程。

1. **TCP 三次握手**：TLS 是应用层协议，使用传输层的 TCP 进行通信，通信双方在进行 TLS 握手前，需要先进行 TCP 三次握手建立链接。
2. **TLS 握手**：通信双方通过 ECDHE 算法交换密钥，协商出一个共享的会话密钥，对传输的数据进行加密和解密。
3. **对称加密通信**：因为非对称协商加密性能损耗大，所以通信双方需要通过 TLS 握手协商出对称密钥，使用该密钥进行加密通信，既安全又高效。

### TLS 握手过程

TLS 握手原理是双方互换信息，协商出共享的 `会话密钥`。

```bash
客户端随机数 + 服务端随机数 + 预主密钥 = 主密钥 ==> 会话密钥
```

**TLS 握手协议（Wireshark 抓包）**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/214e4601a3fa1818.webp)

**握手阶段**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/bf782eda177cc00d.jpg)

1. 协议：Client Hello，客户端发送它支持的 TLS 版本，加密套件列表，`客户端随机数`给服务端。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/37a831acfc351101.webp)

2. 协议：Server Hello，服务端发送它选择的 TLS 版本，加密套件，`服务端随机数`给客户端。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/dcc64f02afe8f226.webp)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/51b3d348395265d4.webp)

3. 协议：Certificate，服务端发送 CA 证书（公钥 + 证书持有者等信息）给客户端。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/6f171b31f5589608.webp)

4. 协议：Server Key Exchange。

- 服务端生成`椭圆曲线私钥`==> 生成`椭圆曲线公钥`==> 服务端的 RSA 私钥实现`椭圆曲线公钥签名`。
- 服务端发送：椭圆曲线算法信息，`（服务端的）椭圆曲线公钥`，`（服务端的）椭圆曲线公钥签名`给客户端。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/2256406e7f31e9ef.webp)

5. 协议：Server Hello Done。服务端发送确认给客户端，已完成 Hello 阶段流程。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/26adc2b4718c1996.webp)

6. 协议：Client Key Exchange。客户端生成`椭圆曲线公钥`，并将其发送给服务端。
   - 客户端接收到证书后，通过本地系统的 证书链 验证该证书是否合法。
   - 客户端通过证书公钥解签`（服务端的）椭圆曲线公钥`，确认该数据的完整性和安全性。
   - 客户端生成`椭圆曲线私钥`==> 生成`椭圆曲线公钥`。
   - 客户端使用服务端的 RSA 公钥加密客户端的`椭圆曲线公钥`，并将其发送给服务端。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/17f10baa9c3a6ac8.webp)

7. 协议：Change Cipher Spec。客户端通知服务端，确认握手过程中的加密算法和密钥已经生效，表示之后的消息都将使用新的密钥。

   - `（客户端的）椭圆曲线私钥`和`（服务端的）椭圆曲线公钥`通过点运算计算出新的点 (x，y)，取 x 作为`预主密钥`。

   - 客户端随机数 + 服务端随机数 + 预主密钥 =[主密钥](https://link.zhihu.com/?target=https%3A//www.laoqingcai.com/tls1.2-premasterkey/)==>`会话密钥`。

   - 客户端的会话密钥已协商出来，客户端发送确认给服务端。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/766447429a6c2ec5.webp)

8. 协议：Encrypted Handshake Message。客户端将之前的握手数据（发送和接收）做一个摘要，再用会话密钥（对称密钥）加密摘要数据，将密文发送给服务端。作用：

   - 服务端解密密文以此验证双方协商出来的密钥是否一致。

   - 服务端还可以验证确认握手数据的安全性和完整性，保证不被中间人篡改。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/b13c6645ba04346a.webp)

9. 协议：New Session Ticket。服务器发送该消息给客户端，包含一个新的会话票据，用于快速恢复会话，避免重复握手。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/78efc190828687bc.webp)

10. 协议：Change Cipher Spec。服务端接收到客户端生成的`椭圆曲线公钥`，也协商出共享的`会话秘钥`，并通知客户端表示之后的消息都将使用新的密钥。

    - `（服务端的）椭圆曲线私钥`和`（客户端的）椭圆曲线公钥`通过点运算计算出新的点 (x，y)，取 x 作为`预主密钥`。

    - 客户端随机数 + 服务端随机数 + 预主密钥 = 主密钥 ==>`会话密钥`。

    - 服务端的会话密钥已协商出来，服务端发送确认给客户端。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/252208bc0b460f63.png)

11. 协议：Encrypted Handshake Message。服务端将之前的握手数据（发送和接收）做一个摘要，再用会话密钥（对称密钥）加密摘要数据，将密文发送给客户端，确认握手过程的完成。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/565f05e3ab023f12.png)