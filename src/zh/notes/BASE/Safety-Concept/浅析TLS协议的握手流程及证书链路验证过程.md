---
title: HTTPS_TLS1.2握手流程-及证书链
category:
  - 安全相关
date: 2024-03-29
---

<!-- more -->

## 前言

通过 wireshark 抓取 HTTPS 包，理解 TLS 1.2 安全通信协议的握手流程。

重点理解几个点：

1. TLS 握手流程：通过 wireshark 抓取 HTTPS 包理解。
2. 协商加密：双方通过 ECDHE 椭圆曲线的密钥交换算法，协商出共享的 `会话密钥` 进行内容对称加密通信，避免传输会话密钥被中间人窃取。
3. CA 证书：证书用来验证服务端的合法性。证书类似于身份证，可以证明某人是某人，当然身份证可以伪造，一般人可能识别不出来，但是国家相关部门可以验证你的身份合法性。同理，服务端可以通过 CA 证书识别自身身份，客户端接收服务端发送的证书，并通过 `证书链` 验证该证书，以此确认服务端身份。

文章来源：[浅析 TLS（ECDHE）协议的握手流程（图解）](https://link.zhihu.com/?target=https%3A//wenfh2020.com/2023/10/08/https/)

对原文做部分补充，特别是证书链路校验部分。

---

## 1. 概念

### 1.1. HTTPS

HTTPS 协议是一种基于 HTTP 协议的安全通信协议。

它通过使用 TLS/SSL 协议对通信进行加密，确保数据在传输过程中的安全性和完整性。

HTTPS 协议使用了公钥加密和对称加密的组合，可以防止第三方窃听、篡改或伪造数据。通过使用 HTTPS 协议，网站可以保护用户的隐私和敏感信息，提供更安全的网络通信环境。

> 文字来源：ChatGPT

### 1.2. SSL/TLS

SSL（Secure Sockets Layer）和 TLS（Transport Layer Security）都是为网络通信提供安全和数据完整性的加密协议。

SSL 是由网景公司在1990年代早期开发。TLS是其后续版本，由互联网工程任务组（IETF）开发。虽然两者在技术上有所不同，但它们的目标和功能基本相同，因此通常一起讨论，并且术语 “SSL/TLS” 常常被用来表示两者。

SSL/TLS 协议主要有两个目的：一是确保数据在传输过程中的隐私，二是确保数据在传输过程中的完整性。这是通过在数据传输开始时进行一次“握手”来实现的，以便服务器和客户端可以就如何加密数据进行协商，并可选地验证对方的身份。

在握手过程中，服务器和客户端会协商一个密钥，然后使用这个密钥对传输的数据进行加密和解密。这样，即使数据在传输过程中被拦截，也无法读取其内容，除非拦截者知道密钥。

此外，SSL/TLS 还可以使用数字证书来验证服务器（或在某些情况下，客户端）的身份。这是通过将服务器的公钥和一些身份信息打包到一个由受信任的第三方（称为证书颁发机构）签名的证书中来实现的。客户端可以验证证书的签名，以确保它是与服务器通信，而不是与冒充服务器的攻击者通信。

总的来说，SSL/TLS是一种重要的安全协议，用于保护网络通信不被窃听或篡改。

> 文字来源：ChatGPT

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/1247dabba3fe9520.webp)

> 图片来源：《图解 TCP_IP》

### 1.3. ECDHE 算法

#### 1.3.1. 概念

TLS 的 ECDHE 算法是一种基于椭圆曲线的密钥交换算法，全称为 Elliptic Curve Diffie-Hellman Ephemeral。

它的工作流程如下：

1. 客户端和服务器各自选择一个 `椭圆曲线私钥`（随机数），并使用椭圆曲线算法生成对应的 `椭圆曲线公钥`。
2. 在握手阶段，客户端和服务器互相交换 `椭圆曲线公钥`。
3. 客户端和服务器各自使用 `对方的椭圆曲线公钥` 和 `自己的椭圆曲线私钥`，通过椭圆曲线的点运算生成一个 `共享密钥`。由于椭圆曲线的数学性质，这个共享密钥在双方都知道，但是不能被第三方计算出来。(共享密钥并非通过传输手段获得，避免中间人截取。)
4. 客户端和服务器使用这个共享密钥进行 `对称加密通信`。

ECDHE 算法的优点是每次握手都会生成一个新的密钥，即使有人能够破解一个会话的密钥，也无法用这个密钥破解其他会话的通信，这就是所谓的前向保密性。

> 部分文字来源：ChatGPT

#### 1.3.2. 简单数学原理

##### 1.3.2.1. 点运算

椭圆曲线上有两个点：Q，P，以及整数 k；点 P 经过 k 次点运算得到点 Q。

`【注意】` 给定 k 和 P 很容易获得 Q；但是给定 Q 和 P，却很难得到 k（因为计算量非常大），这就是难以破解的关键。

```bash
Q = kP
```

> 详细算法请参考：[宸极实验室—『CTF』深入浅出 ECC](https://zhuanlan.zhihu.com/p/529733453)

##### 1.3.2.2. 协商密钥原理

参考下图，client 和 server 通过椭圆曲线算法协商出来一个共享密钥。

1. 椭圆曲线 **G 点** 等一些算法信息是公开的。
2. server 生成一个随机数 **b 作为私钥**，通过原理 `Q = kP` 进行椭圆曲线点运算 `B = bG`，G 点经过 b 次点运算，获得 B 点，**B 点作为 server 的公钥**。
3. server 将椭圆曲线公钥 B 发送给 client。
4. client 生成一个随机数 **a 作为私钥**，通过原理 `Q = kP` 进行椭圆曲线点运算 `A = aG`，G 点经过 a 次点运算，获得 A 点，**A 点作为 client 的公钥**。
5. client 将 A 点发送给 server。
6. client 将 自己的私钥 a 和 server 发送的公钥 B 点，进行点运算获得新密钥：新密钥（点）= aB = a(bG)。
7. server 将自己的私钥 b 和 client 发送的公钥 A 点，进行点运算获得新密钥：新密钥（点）= bA = b(aG)。
8. 此时双方都生成了会话密钥，根据乘法交换律 a(bG) = b(aG) 推出 aB = bA = 新密钥（点），也就是说双方的新密钥是相同的，这就是协商出来的 `共享密钥`。

在双方协商加密过程中，因为双方发送的是自己的公钥，还有 G 点等公开信息。

回顾上文 `Q = kP`，知道 Q 点和 P 点，计算出 `k` 是十分困难的。

换句话说，知道了公钥和椭圆曲线基点等公开信息，要破解出私钥 `k` 是非常困难的。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/8b4a3e9cc184a64e.webp)

---

## 2. 工作流程

引自：[浅析 TLS1.2协议的握手流程](https://zhuanlan.zhihu.com/p/662069195)

### 2.1 主流程

理解了一些基本概念之后，下面我们将在浏览器访问某些 HTTPS 域名，抓包分析 TLS 的工作流程。

1. **TCP 三次握手**：TLS 是应用层协议，使用传输层的 TCP 进行通信，通信双方在进行 TLS 握手前，需要先进行 TCP 三次握手建立链接。
2. **TLS 握手**：通信双方通过 ECDHE 算法交换密钥，协商出一个共享的会话密钥，对传输的数据进行加密和解密。
3. **对称加密通信**：因为非对称协商加密性能损耗大，所以通信双方需要通过 TLS 握手协商出对称密钥，使用该密钥进行加密通信，既安全又高效。

### 2.2 TLS 握手过程

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

---

## 3. CA 证书

### 3.1. 概念

CA证书 是由权威的证书颁发机构（Certificate Authority）签发的数字证书。

### 3.2. 证书作用

1. 验证网站的身份：CA证书 包含了网站的公钥和其他相关信息，由权威的证书颁发机构签发。当用户访问一个网站时，浏览器会检查网站的证书是否由可信的 CA机构 签发，以验证网站的身份是否可信。
2. 加密通信数据：CA证书 使用了公钥加密和对称加密的组合，可以加密传输的数据。这样可以防止第三方窃听、篡改或伪造数据，确保通信的安全性和完整性。
3. 建立信任关系：由于 CA证书 是由可信的证书颁发机构签发的，浏览器会预先内置一些受信任的CA机构的根证书。当浏览器检查到网站的证书由受信任的 CA机构 签发时，会建立起对该网站的信任关系，显示安全的锁标志。

> 文字来源：ChatGPT

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/51cd99666d4ed5e1.webp)

### 3.3. 证书来源

CA 证书由权威的证书颁发机构 CA（Certificate Authority）签发，个人或公司要申请证书，可以通过相关平台付费购买或者免费申请获得。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/de122565df6933aa.webp)

### 3.4. 证书工作原理

#### 3.4.1. 证书链路

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/0395027b7f8adaeb.jpg)

> [根证书、中间证书、服务器证书生成过程讲解](https://blog.csdn.net/ARV000/article/details/134694724)
>
> **说一下根证书、中间证书、服务器证书生成的过程：**
>
> 根证书、中间证书、服务器证书都是有各自的公私钥；
>
> 根证书流程：
>
> - 申请者要提供自己的公钥和身份信息，然后由这些CA机构验证申请者身份属实之后，用机构自己的私钥签名并生成数字证书，再颁发给申请者。
>
> 中间证书生成流程：
>
> - 根证书利用自己的私钥对中间证书进行签名，生成中间证书，证书包含以下信息：
>   - **申请者公钥**
>   - 申请者的组织信息和个人信息、签发机构 CA的信息、有效时间、证书序列号等信息的明文**（明文信息）**
>   - 同时包含一个签名；签名的产生算法：首先，使用散列函数计算公开的明文信息的信息摘要，然后，采用`CA私钥`对信息摘要进行加密，密文即签名；**（签名）**
>
> 服务器证书生成流程：
>
> - 使用中间证书私钥对服务器证书请求进行签名，生成服务器证书，证书包含以下信息：
>   - 服务器证书公钥
>   - 如组织名、组织单位、国家、证书有效时间等明文信息（明文信息）
>   - 签名

1. 首先证书颁发机构（CA）会颁发 根证书。
2. 用户的计算机系统或浏览器会从 CA 获取根证书，并预装根证书。
3. 根证书机构创建 中间证书 授权给 中间证书颁发机构 颁发 SSL证书。
4. 个人或公司向 中间证书颁发机构 申请一个 服务器证书，中间颁发证书机构 接受申请，创建证书文件：包含 RSA公钥 的服务器证书文件和 RSA私钥 文件；有些 .PEM 证书文件会将 中间证书 和 服务器证书 打包在一起。
5. 中间颁发证书机构 创建对应的证书文件后，个人或公司可以从证书签发平台下载下来。
6. 服务器启动服程序，并加载：服务器证书文件 和 RSA私钥。
7. 用户通过 HTTPS 访问服务程序，进入 TLS 握手环节。
8. 服务程序会给客户端发送 服务器证书。
9. 客户端获得服务器证书后，通过 证书链 对该服务器证书进行校验。因为之前用户的计算机系统或浏览器已经预装了根证书，那么证书链验证：根证书验证中间证书合法，中间证书验证服务器证书合法。
10. 客户端获得的服务器证书里包含了 RSA 的公钥，这个是公开的。RSA 私钥仍然在服务端，那么 RSA 私钥加密的数据（签名数据），公钥可以解密；反过来，RSA 公钥加密的密文，只有私钥可以解密。
11. TLS 的握手的其它环节请参考上文。

#### 3.4.2. 证书验证

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/577c500bef1a43f2.png)

1. 首先，客户端会从服务器获取证书链。证书链通常包括服务器证书、一个或多个中间证书。
2. 客户端首先会检查服务器证书的有效性，包括证书的有效期、证书的颁发机构等。
3. 然后，客户端会使用 **中间证书的公钥** 来验证服务器证书的签名（如上图：证书签名验证）。
4. 接着，客户端会检查中间证书的有效性，并使用根证书的公钥来验证中间证书的签名。
5. 最后，客户端会检查根证书的有效性。由于根证书是自我签名的，所以客户端会使用根证书的公钥来验证根证书的签名。
6. 如果所有的证书都通过了验证，那么证书链就被认为是有效的。如果任何一个证书没有通过验证，那么证书链就被认为是无效的。

> 部分文字来源：ChatGPT

### 3.5. HTTPS 服务配置

- 例如 nginx 服务端 https 通信配置。

```bash
# /etc/nginx/vhost/blog.conf
server {
    listen       443 ssl; # 监听 HTTPS 443 端口。
    server_name  xxx.com www.xxx.com;
    ssl_certificate /usr/local/nginx/ssl/blog/3513736_xxx.com.pem;
    ssl_certificate_key /usr/local/nginx/ssl/blog/3513736_xxx.com.key;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers AESGCM:ALL:!DH:!EXPORT:!RC4:+HIGH:!MEDIUM:!LOW:!aNULL:!eNULL;
    ssl_prefer_server_ciphers on;
}
```

| 配置项                    | 描述                                                         |
| ------------------------- | ------------------------------------------------------------ |
| ssl_certificate           | 指定服务器证书的路径。服务器证书是由 CA 机构签发的，用于 验证服务器的身份。它包含了服务器的公钥和其他相关信息。 |
| ssl_certificate_key       | 指定服务器证书的私钥的路径。私钥用于对传输的数据进行加密和解密。 |
| ssl_session_timeout       | 指定 SSL 会话的超时时间。SSL 会话是在客户端和服务器之间建立的安全连接，超过超时时间后会自动关闭。 |
| ssl_protocols             | 指定支持的 SSL/TLS 协议版本。常见的协议版本包括 SSLv2、SSLv3、TLSv1.0、TLSv1.1 和 TLSv1.2。 |
| ssl_ciphers               | 指定支持的加密算法和密钥长度。常见的加密算法包括 AES、DES 和 RC4，密钥长度包括 128 位和 256 位。 |
| ssl_prefer_server_ciphers | 指定是否优先使用服务器端的加密算法和密钥长度。如果设置为 “on”，则服务器端的加密算法和密钥长度优先级高于客户端。 |

> 文字来源：ChatGPT

- 使用 openssl 客户端测试某宝域名。有兴趣的朋友可以结合上文去理解下面客户端与服务端交互的详细信息。

```bash
# 源码编译 openssl 配置：
# ./config enable-ssl-trace --prefix=/Users/xxx/openssl -openssldir=/Users/xxx/openssl/build
# 客户端执行命令：
# openssl s_client -connect taobao.com:443 -state -showcerts
# 客户端打印内容：
CONNECTED(00000006)
# 握手流程
SSL_connect:before SSL initialization
SSL_connect:SSLv3/TLS write client hello
SSL_connect:SSLv3/TLS write client hello
SSL_connect:SSLv3/TLS read server hello
depth=2 C = BE, O = GlobalSign nv-sa, OU = Root CA, CN = GlobalSign Root CA
verify return:1
depth=1 C = BE, O = GlobalSign nv-sa, CN = GlobalSign Organization Validation CA - SHA256 - G3
verify return:1
depth=0 C = CN, ST = ZheJiang, L = HangZhou, O = "Alibaba (China) Technology Co., Ltd.", CN = taobao.com
verify return:1
SSL_connect:SSLv3/TLS read server certificate
SSL_connect:SSLv3/TLS read server key exchange
SSL_connect:SSLv3/TLS read server done
SSL_connect:SSLv3/TLS write client key exchange
SSL_connect:SSLv3/TLS write change cipher spec
SSL_connect:SSLv3/TLS write finished # Encrypted Handshake Message
SSL_connect:SSLv3/TLS write finished # Encrypted Handshake Message
SSL_connect:SSLv3/TLS read server session ticket
SSL_connect:SSLv3/TLS read change cipher spec
SSL_connect:SSLv3/TLS read finished # Encrypted Handshake Message
---
# 证书链
Certificate chain
 0 s:C = CN, ST = ZheJiang, L = HangZhou, O = "Alibaba (China) Technology Co., Ltd.", CN = taobao.com
   i:C = BE, O = GlobalSign nv-sa, CN = GlobalSign Organization Validation CA - SHA256 - G3
   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
   v:NotBefore: Mar 20 04:06:03 2023 GMT; NotAfter: Apr 20 04:06:02 2024 GMT
-----BEGIN CERTIFICATE-----
MIIG3j... # 删减
-----END CERTIFICATE-----
 1 s:C = BE, O = GlobalSign nv-sa, CN = GlobalSign Organization Validation CA - SHA256 - G3
   i:C = BE, O = GlobalSign nv-sa, OU = Root CA, CN = GlobalSign Root CA
   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
   v:NotBefore: Sep  4 00:00:00 2015 GMT; NotAfter: Sep  4 00:00:00 2025 GMT
-----BEGIN CERTIFICATE-----
MIIEiz... # 删减
-----END CERTIFICATE-----
---
Server certificate
subject=C = CN, ST = ZheJiang, L = HangZhou, O = "Alibaba (China) Technology Co., Ltd.", CN = taobao.com
issuer=C = BE, O = GlobalSign nv-sa, CN = GlobalSign Organization Validation CA - SHA256 - G3
---
No client certificate CA names sent
Peer signing digest: SHA256
Peer signature type: RSA-PSS
Server Temp Key: X25519, 253 bits
---
SSL handshake has read 3577 bytes and written 405 bytes
Verification: OK
---
New, TLSv1.2, Cipher is ECDHE-RSA-AES128-GCM-SHA256
Server public key is 2048 bit
Secure Renegotiation IS supported
Compression: NONE
Expansion: NONE
No ALPN negotiated
SSL-Session:
    Protocol  : TLSv1.2
    Cipher    : ECDHE-RSA-AES128-GCM-SHA256
    Session-ID: D416F803F9E5E1BA04E98CA7A23014A8B5A6459C47FA2C1E30B144B8BA756F51
    Session-ID-ctx: 
    Master-Key: 095368226B46D96CAABCF5F311C398279B89E1D10A896BC34F49FDC4CC64C30BAE2310412284BE2D913D53ED1571FD9A
    PSK identity: None
    PSK identity hint: None
    SRP username: None
    TLS session ticket lifetime hint: 7200 (seconds)
    TLS session ticket:
    0000 - 60 82 b6 11 a6 b3 fb 36-5e cc a5 be b7 4a 09 db   `......6^....J..
    0010 - 11 2d d9 b7 46 84 21 59-95 16 a3 7a 07 3f 20 ed   .-..F.!Y...z.? .
    ***

    Start Time: 1697593108
    Timeout   : 7200 (sec)
    Verify return code: 0 (ok)
    Extended master secret: yes
---
```