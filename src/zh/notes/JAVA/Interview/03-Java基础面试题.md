---
title: 03-Java基础面试题
category:
  - JAVA
tag: 
  - JAVA基础面试题
date: 2024-02-15
---

<!-- more -->


# 一、JavaWeb专题

## 1.HTTP响应码有哪些

1、1xx（临时响应）
2、2xx（成功）
3、3xx（重定向）：表示要完成请求需要进一步操作
4、4xx（错误）：表示请求可能出错，妨碍了服务器的处理
5、5xx（服务器错误）：表示服务器在尝试处理请求时发生内部错误

举例：

- 200：成功，Web服务器成功处理了客户端的请求。
- 301：永久重定向，当客户端请求一个网址的时候，Web服务器会将当前请求重定向到另一个网址，搜索引擎会抓取重定向后网页的内容并且将旧的网址替换为重定向后的网址。
- 302：临时重定向，搜索引擎会抓取重定向后网页的内容而保留旧的网址，因为搜索引擎认为重定向后的网址是暂时的。
- 400：客户端请求错误，多为参数不合法导致Web服务器验参失败。
- 404：未找到，Web服务器找不到资源。
- 500：Web服务器错误，服务器处理客户端请求的时候发生错误。
- 503：服务不可用，服务器停机。
- 504：网关超时

## 2.Forward和Redirect的区别？

1. 浏览器URL地址：
   - Forward是服务器内部的重定向，服务器内部请求某个servlet，然后获取响应的内容，浏览器的URL地址是不会变化的；
   - Redirect是客户端请求服务器，然后服务器给客户端返回了一个302状态码和新的location，客户端重新发起HTTP请求，服务器给客户端响应location对应的URL地址，浏览器的URL地址发生了变化。
2. 数据的共享：
   - Forward是服务器内部的重定向，request在整个重定向过程中是不变的，request中的信息在servlet间是共享的。
   - Redirect发起了两次HTTP请求分别使用不同的request。
3. 请求的次数：
   - Forward只有一次请求；
   - Redirect有两次请求。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/f3fff334c18a4ce5.png)

## 3.Get和Post请求的区别

用途：

* get请求用来从服务器获取资源
* post请求用来向服务器提交数据

表单的提交方式：

* get请求直接将表单数据以name1=value1&name2=value2的形式拼接到URL上（http://www.baidu.com/action?name1=value1&name2=value2），多个参数参数值需要用&连接起来并且用?拼接到action后面；
* post请求将表单数据放到请求头或者请求的消息体中。

传输数据的大小限制：

* get请求传输的数据受到URL长度的限制，而URL长度是由浏览器决定的；
* post请求传输数据的大小理论上来说是没有限制的。

参数的编码：

* get请求的参数会在地址栏明文显示，使用URL编码的文本格式传递参数；
* post请求使用二进制数据多重编码传递参数。

缓存处理：

* get请求可以被浏览器缓存被收藏为标签；
* post请求不会被缓存也不能被收藏为标签

## 4.介绍下OSI七层和TCP/IP四层的关系

为了更好地促进互联网的研究和发展，国际标准化组织ISO在1985 年指定了网络互联模型。OSI 参考模型（Open System Interconnect Reference Model），具有 7 层结构

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/38e391267d6644d0.png)

**应用层**：各种应用程序协议，比如HTTP、HTTPS、FTP、SOCKS安全套接字协议、DNS域名系统、GDP网关发现协议等等。
**表示层**：加密解密、转换翻译、压缩解压缩，比如LPP轻量级表示协议。
**会话层**：不同机器上的用户建立和管理会话，比如SSL安全套接字层协议、TLS传输层安全协议、RPC远程过程调用协议等等。

**传输层**：接受上一层的数据，在必要的时候对数据进行分割，并将这些数据交给网络层，保证这些数据段有效到达对端，比如TCP传输控制协议、UDP数据报协议。
**网络层**：控制子网的运行：逻辑编址、分组传输、路由选择，比如IP、IPV6、SLIP等等。
**数据链路层**：物理寻址，同时将原始比特流转变为逻辑传输路线，比如XTP压缩传输协议、PPTP点对点隧道协议等等。
**物理层**：机械、电子、定时接口通信信道上的原始比特流传输，比如IEEE802.2等等。

而且在消息通信的过程中具体的执行流程为：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/98f6ab56a9d358c3.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/7b221b831cdc9a9d.png)

网络传输的数据其实会通过这七层协议来进行数据的封装和拆解

## 5.说说TCP和UDP的区别

1、TCP面向连接（如打电话要先拨号建立连接）：UDP是无连接的，即发送数据之前不需要建立连接。

2、TCP提供可靠的服务。也就是说，通过TCP连接传送的数据，无差错，不丢失，不重复，且按序到达；UDP尽最大努力交付，即不保证可靠交付。tcp通过校验和，重传控制，序号标识，滑动窗口、确认应答实现可靠传输。如丢包时的重发控制，还可以对次序乱掉的分包进行顺序控制。

3、UDP具有较好的实时性，工作效率比TCP高，适用于对高速传输和实时性有较高的通信或广播通信。

4、每一条TCP连接只能是点到点的；UDP支持一对一，一对多，多对一和多对多的交互通信

5、TCP对系统资源要求较多，UDP对系统资源要求较少。

## 6. 说下HTTP和HTTPS的区别

端口不同：HTTP和HTTPS的连接方式不同没用的端口也不一样，HTTP是80，HTTPS用的是443

消耗资源：和HTTP相比，HTTPS通信会因为加解密的处理消耗更多的CPU和内存资源。

开销：HTTPS通信需要证书，这类证书通常需要向认证机构申请或者付费购买。

## 7.说下HTTP、TCP、Socket的关系是什么？

* TCP/IP代表传输控制协议/网际协议，指的是一系列协议族。
* HTTP本身就是一个协议，是从Web服务器传输超文本到本地浏览器的传送协议。
* Socket是TCP/IP网络的API，其实就是一个门面模式，它把复杂的TCP/IP协议族隐藏在Socket接口后面。对用户来说，一组简单的接口就是全部，让Socket去组织数据，以符合指定的协议。

综上所述：

* 需要IP协议来连接网络
* TCP是一种允许我们安全传输数据的机制，使用TCP协议来传输数据的HTTP是Web服务器和客户端使用的特殊协议。
* **HTTP基于TCP协议**，所以可以使用Socket去建立一个TCP连接。

## 8. 说下HTTP的长链接和短连接的区别

HTTP协议的长连接和短连接，实质上是TCP协议的长连接和短连接。

**短连接**

在HTTP/1.0中默认使用短链接,也就是说，浏览器和服务器每进行一次HTTP操作，就建立一次连接，但任务结束就中断连接。如果客户端访问的某个HTML或其他类型的Web资源，如JavaScript文件、图像文件、CSS文件等。当浏览器每遇到这样一个Web资源，就会建立一个HTTP会话.

**长连接**

从HTTP/1.1起，默认使用长连接，用以保持连接特性。在使用长连接的情况下，当一个网页打开完成后，客户端和服务器之间用于传输HTTP数据的TCP连接不会关闭。如果客户端再次访问这个服务器上的网页，会继续使用这一条已经建立的连接。Keep-Alive不会永久保持连接，它有一个保持时间，可以在不同的服务器软件（如Apache）中设定这个时间。

## 9.TCP原理

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/f628368bdcbfd79c.png)

三次握手：

1. 第一次握手：客户端将标志位syn重置为1，随机产生seq=a，并将数据包发送给服务端
2. 第二次握手：服务端收到syn=1知道客户端请求连接，服务端将syn和ACK都重置为1，ack=a+1，随机产一个值seq=b，并将数据包发送给客户端，服务端进入syn_RCVD状态。
3. 第三次握手：客户端收到确认后，检查ack是否为a+1，ACK是否为1，若正确将ACK重置为1，将ack改为b+1，然后将数据包发送给服务端服务端检查ack与ACK,若都正确，就建立连接，进入ESTABLISHEN.

四次挥手：

1. 开始双方都处于连接状态
2. 客户端进程发出FIN报文，并停止发送数据，在报文中FIN结束标志为1，seq为a连接状态下发送给服务器的最后一个字节的序号+1，报文发送结束后，客户端进入FIN-WIT1状态。
3. 服务端收到报文，向客户端发送确认报文，ACK=1,seq为b服务端给客户端发送的最后字节的序号+1，ack=a+1，发送后客户端进入close-wait状态，不再发送数据，但服务端发送数据客户端一九可以收到（城为半关闭状态）。
4. 客户端收到服务器的确认报文后，客户端进入fin-wait2状态进行等待服务器发送第三次的挥手报文。
5. 服务端向fin报文FIN=1ACK=1，seq=c（服务器向客户端发送最后一个字节序号+1），ack=b+1，发送结束后服务器进入last-ack状态等待最后的确认。
6. 客户端收到是释放报文后，向服务器发送确认报文进入time-wait状态，后进入close
7. 服务端收到确认报文进入close状态。

## 10. Cookie和Session的区别

cookie是由Web服务器保存在用户浏览器上的文件（key-value格式），可以包含用户相关的信息。客户端向服务器发起请求，就提取浏览器中的用户信息由http发送给服务器

session是浏览器和服务器会话过程中，服务器会分配的一块储存空间给session。服务器默认为客户浏览器的cookie中设置sessionid，这个sessionid就和cookie对应，浏览器在向服务器请求过程中传输的cookie包含sessionid，服务器根据传输cookie中的sessionid获取出会话中存储的信息，然后确定会话的身份信息。

1、Cookie数据存放在客户端上，安全性较差，Session数据放在服务器上，安全性相对更高
2、单个cookie保存的数据不能超过4K，session无此限制
3、session一定时间内保存在服务器上，当访问增多，占用服务器性能，考虑到服务器性能方面，应当使用cookie。

## 11.Tomcat是什么？

Tomcat服务器Apache软件基金会项目中的一个核心项目，是一个免费的开放源代码的Web应用服务器（Servlet容器），属于轻量级应用服务器，在中小型系统和并发访问用户不是很多的场合下被普遍使用，是开发和调试JSP程序的首选。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/682f48b602d91286.png)

## 12.Tomcat有几种部署方式

1. 利用Tomcat的自动部署：把web应用拷贝到webapps目录（生产环境不建议放在该目录中）。Tomcat在启动时会加载目录下的应用，并将编译后的结果放入work目录下。
2. 使用Manager App控制台部署：在tomcat主页点击“Manager App”进入应用管理控制台，可以指定一个web应用的路径或war文件。
3. 修改conf/server.xml文件部署：在server.xml文件中，增加Context节点可以部署应用。
4. 增加自定义的Web部署文件：在conf/Catalina/localhost/路径下增加xyz.xml文件，内容是Context节点，可以部署应用。

## 13.什么是Servlet

Servlet是JavaEE规范的一种，主要是为了扩展Java作为Web服务的功能，统一接口。由其他内部厂商如tomcat，jetty内部实现web的功能。如一个http请求到来：容器将请求封装为servlet中的HttpServletRequest对象，调用init()，service()等方法输出response,由容器包装为httpresponse返回给客户端的过程。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/6e9ddd1f4fd48594.png)

## 14. 什么是Servlet规范?

* 从Jar包上来说，Servlet规范就是两个Jar文件。servlet-api.jar和jsp-api.jar，Jsp也是一种Servlet。
* 从package上来说，就是javax.servlet和javax.servlet.http两个包。
* 从接口来说，就是规范了Servlet接口、Filter接口、Listener接口、ServletRequest接口、ServletResponse接口等。类图如下：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/e34d420663c5921b.png)

## 15.为什么我们将tomcat称为Web容器或者Servlet容器？

我们用一张图来表示他们之间的关系:

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/996e90735fa99779.png)

简单的理解：启动一个ServerSocket，监听8080端口。Servlet容器用来装我们开发的Servlet。

## 16.Servlet的生命周期

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/56a72a68d3734a97.png)

## 17. jsp和Servlet的区别

* 本质都是servlet
* servlet侧重于逻辑处理
* jsp侧重于视图显示

## 18. 九大内置对象

1. page页面对象
2. config配置对象
3. request请求对象
4. response响应对象
5. session会话对象
6. application全局对象
7. out输出对象
8. pageContext页面上下文对象
9. exception异常对象

## 19. JSP的四大作用域

page：

```
只在当前页面有效
```

request：

```
它在当前请求中有效
```

session：

```
它在当前会话中有效
```

application：

```
他在所有的应用程序中都有效
```

注意：当4个作用域对象都有相同的name属性时,默认按照最小的顺序查找

## 20. **GenericServlet和HttpServlet有什么区别？**

GenericServlet 为抽象类，定义了一个通用的、独立于底层协议的servlet，实现了Servlet 和 ServletConfig接口，ServletConfig接口定义了在Servlet初始化的过程中由Servlet容器传递给Servlet得配置信息对象。OK，这个类可能我们不是那么熟悉，但是他的子类相信大家都知道，也就是HttpServlet，HttpServlet 继承自抽象类GenericServlet 具有其所有的特性并拓展了一些其他的方法，如doGet、doPost等

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/6407b8fb3851c76a.png)
