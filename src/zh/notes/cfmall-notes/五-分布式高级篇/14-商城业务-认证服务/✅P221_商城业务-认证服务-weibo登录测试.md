## 一、开篇

[新浪微博开放平台-首页](https://open.weibo.com/)创建应用时需要进行邮箱验证与身份认证，由于身份认证时间过长，通常需要2-3个工作日。

而采用Gitee进行第三方登录测试，优点就是不需要身份认证就可创建应用测试。

下面会介绍微博第三方登录测试和Gitee登录实操。

---

## 二、微博登陆

### 2.1 进入微博开放平台

地址：[https://open.weibo.com/](https://open.weibo.com/)

先进行登录，然后选择 ”微连接“ -> “网站接入”

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/aeac807db19d5988868147243f18e98b.png#id=gEuTt&originHeight=169&originWidth=1006&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.2 选择立即接入

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409165839540.png#id=zrZ5F&originHeight=256&originWidth=980&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=gELfA&originHeight=256&originWidth=980&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.3 创建自己的应用

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/995dda37bcb6b9aacbdf405917f2cf91.png#id=NdBQi&originHeight=320&originWidth=586&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.4 我们可以在开发阶段进行测试了

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/a40ea30d4dd8e39edef19a2c88a32f6a.png#id=YUqyP&originHeight=479&originWidth=697&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

App Key 和 App Secret 是获取 Access token 必填的参数！

### 2.5 授权回调页地址

点击高级信息，填写“授权回调页”和“取消授权回调页”地址

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/013143af12a91c1ad54318f2f53b65d1.png#id=CKj9S&originHeight=284&originWidth=943&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.6 添加测试账号（选做）

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/2322af1a6c8b136a78fa3b2a0e33c1e5.png#id=kUDQW&originHeight=283&originWidth=940&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.7 授权机制文档

按照 [授权机制说明](https://open.weibo.com/wiki/%E6%8E%88%E6%9D%83%E6%9C%BA%E5%88%B6) 文档，进行下面的微博授权登录测试。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/eb6cd0b0ce505cb23451609bc99978d0.png#id=r5N97&originHeight=510&originWidth=790&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

点击对应的接口，会有参数说明
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/bec8c1bfdc3f4b86fb8ab4b12d28327e.png#id=vWNam&originHeight=436&originWidth=732&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/7705210893f762f951a1837ad13d5b28.png#id=Zvags&originHeight=532&originWidth=728&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 三、微博登陆测试

### 3.1 Web网站的授权流程

Web网站的授权流程均参考[官方文档](https://open.weibo.com/wiki/%E6%8E%88%E6%9D%83%E6%9C%BA%E5%88%B6%E8%AF%B4%E6%98%8E)，涉及到的接口如下所示：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/66b71f904688a3284dbbfc67dbab8a44.png#id=WjjaZ&originHeight=570&originWidth=642&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

1、引导需要授权的用户到如下地址：

```
https://api.weibo.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REGISTERED_REDIRECT_URI
```

2、如果用户同意授权，页面跳转至 YOUR_REGISTERED_REDIRECT_URI/?code=CODE

3、换取Access Token

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/67ec6154153dbe87f425bebdc8e6e2c9.png#id=KWSci&originHeight=202&originWidth=720&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

```
https://api.weibo.com/oauth2/access_token?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=authorization_code&redirect_uri=YOUR_REGISTERED_REDIRECT_URI&code=CODE
```

其中client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET可以使用basic方式加入header中，返回值

```json
{
    "access_token": "SlAV32hkKG",
    "remind_in": 3600,
    "expires_in": 3600
}
```

4、使用获得的Access Token调用API

具体实际操作如下文步骤所示；

### 3.2 获取CODE值

修改登录界面图标以及新增“引导需要授权的用户到如下地址”，

`cfmall-auth-server/src/main/resources/templates/login.html`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/569aa16595b464e119936c368c971e8c.png#id=W4BCv&originHeight=225&originWidth=1454&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

首先点击商城首页右上角：”您好，请登录“，

点击微博进行授权

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/d7642f3786d0f3100e05d4051cbeca27.png#id=fpLrT&originHeight=580&originWidth=1095&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

观察地址栏，会生成一个code值，即用来获取AccessToken的一个请求参数，页面跳转至如下图所示，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/ba56c0ff7093464f9f7bed0eb7f1f054.png#id=idQcu&originHeight=50&originWidth=570&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 3.3 获取AccessToken

[https://api.weibo.com/oauth2/access_token?client_id=318019123&client_secret=3ac160febeab7e1bc959b4820b04512d&grant_type=authorization_code&redirect_uri=http://www.cfmall.com/success&code=c9e416c24d6abbb32f58bda05f119dc4](https://api.weibo.com/oauth2/access_token?client_id=318019123&client_secret=3ac160febeab7e1bc959b4820b04512d&grant_type=authorization_code&redirect_uri=http://www.cfmall.com/success&code=c9e416c24d6abbb32f58bda05f119dc4)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/9ad50676b7179b6a4c842eb949dd52da.png#id=ofe9S&originHeight=570&originWidth=1475&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**注意，上面这个是 post 请求**

```json
{
    "access_token": "2.008QHRUG0hS4W2aca619f9092s1doD",
    "remind_in": "157679999",
    "expires_in": 157679999,
    "uid": "5944166575",
    "isRealName": "true"
}
```

### 3.4 使用 AccessToken 调用开发 API 获取用户信息

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409170552706.png#id=BGOyr&originHeight=502&originWidth=900&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=hu4PC&originHeight=502&originWidth=900&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

至此微博登陆调试完成。

Oauth2.0；授权通过后，使用 code 换取 access_token，然后去访问任何开放 API

1. code 用后即毁；
2. access_token 在几天内是一样的；
3. uid 永久固定；

---

## 四、Gitee登录

### 4.1 官方文档

点击首页下方的`OpenAPI`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409170913810.png#id=ik2uz&originHeight=987&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=I9siD&originHeight=987&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

点击`OAuth`文档，创建应用

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409171142731.png#id=FCGrh&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=vVrUY&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 4.2 创建应用

1、在 修改资料 -> 第三方应用，创建要接入码云的应用

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/create-app-1.png#id=GDk1x&originHeight=871&originWidth=1212&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=tz5mV&originHeight=871&originWidth=1212&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

2、填写应用相关信息，勾选应用所需要的权限。其中: **回调地址**是用户授权后，码云回调到应用，并且回传授权码的地址

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409171346144.png#id=cdh6B&originHeight=833&originWidth=1341&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=Wad9n&originHeight=833&originWidth=1341&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

3、创建成功后，会生成 **Cliend ID** 和 **Client Secret**。他们将会在上述OAuth2 认证基本流程用到，对应`client_id`和`client_secret`请求参数

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/create-app-3.png#id=rOYbT&originHeight=394&originWidth=1252&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=eLL05&originHeight=394&originWidth=1252&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 4.3 登录流程测试

**选择Gitee进行登录**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409171715922.png#id=FB2pA&originHeight=815&originWidth=1703&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=kGWAq&originHeight=815&originWidth=1703&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**OAuth 授权请求**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409171820731.png#id=FB2hg&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=U5Yl1&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

点击`同意授权`后，会返回code值

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409171549817.png#id=ljyfJ&originHeight=332&originWidth=1263&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=R5mJG&originHeight=332&originWidth=1263&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

获取 `access_token` 测试

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409165144091.png#id=iJdVi&originHeight=689&originWidth=1591&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=jhFiU&originHeight=689&originWidth=1591&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

说明：code只能使用一次，access_token只能一段时间有效

下面会继续进行社交登录回调的编写与测试工作。
