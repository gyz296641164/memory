---
title: 基于Vuepress+GithubPages+Vercel进行博客搭建部署
category:
  - 文章
date: 2024-04-27
---

<!-- more -->

## 开篇

搭建个人博客有很多方式，有Docsify、 VuePress、Docute 、Hexo等等这些完善的主题工具，我采用的是基于VuePress的[vuepress-theme-hope](https://theme-hope.vuejs.press/zh/)主题，结合[vercel](https://vercel.com) 进行部署，同时通过阿里云购买的域名进行配置，达到通过域名访问博客的目的。

本人在线博客浏览地址：https://www.yznotes.cn/

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/35da69652d5715ab.png)

具体搭建方式看下文。

---

## vuepress主题搭建

采用[vuepress-theme-hope](https://theme-hope.vuejs.press/zh/)主题，执行执行安装命令：

```
npm init vuepress-theme-hope [dir]
```

注意npm版本大于8。具体配置间主题官网即可。

安装后的文件目录如图所示：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241754708.png#id=qrXT6&originHeight=212&originWidth=280&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

`.git`和`.gitignore`、`node_moudles`是后来手动加的，其余文件都是默认下载下来的。

**运行项目**

在`my-docs`目录下执行：`npm install`安装node_modules，然后执行`npm run docs:dev`运行项目，默认路径：[http://localhost:8080/](http://localhost:8080/)

---

## 代码提交到Github

### 新建仓库

在演示之前已经新建了仓库，所以提示名字重复。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241750240.png#id=XcuCu&originHeight=870&originWidth=774&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 提交代码

首先注意：将src文件夹下的`config.ts`文件中的`base`值改为：`base: '/'`，否则后续部署完没有文章样式。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241758572.png#id=eRM7W&originHeight=442&originWidth=595&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

创建`.gitignore`文件，添加如下内容：

```
/node_modules
src/.vuepress/dist
**/.cache
**/.temp
/public
/.idea
```

执行代码提交相关命令：

```
git init ##初始化，该命令将创建一个名为 .git 的子目录，
git add .
git commit -m 'deploy'
git push -f git@github.com:xxx/memory.git master
```

### 配置Github Pages

如果Github Pages不配置，即使Vercel部署完也会找不到页面，像下面这样：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241810204.png#id=dSvYw&originHeight=398&originWidth=604&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

正式进入配置Github Pages环节。首先进入仓库的设置界面

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241805256.png#id=Yv5BO&originHeight=654&originWidth=1259&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

点击`Pages`

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241806813.png#id=z182H&originHeight=633&originWidth=1247&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

然后选择分支，部署目录，配置域名。（域名解析见最后章节）

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241808765.png#id=ZLuUg&originHeight=827&originWidth=1162&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

配置完Github Pages，仓库目录下面会自动生成一个叫`CNAME`的文件，里面的内容就是我们刚配置的域名：`yznotes.cn`

下一步就要进行Vercel部署工作。

---

## vercel部署
官网：https://vercel.com

> **注意：**
>
> - 在代码提交Github后，vercel会自动进行部署。一旦文章内容出现**缺少标签**等错误，就会导致部署失败。因此，在代码提交前，先用**`Visual Studio Code`**工具在本地进行编译一下，如果有错误及时改正，没问题了再提交代码。编译命令为：`vuepress build src`，在package.json文件中可见。
> - 再说下编译时的大坑，一定要用Node高版本，否则总是报错：
>    - SyntaxError: Unexpected token '?'at Loader.moduleStrategy (internal/modules/esm/translators.js:140:18)

### 介绍

vercel 是一个站点托管平台，提供CDN加速，同类的平台有Netlify 和 Github Pages，相比之下，vercel 国内的访问速度更快，并且提供Production环境和development环境，对于项目开发非常的有用的，并且支持持续集成，一次push或者一次PR会自动化构建发布，发布在development环境，都会生成不一样的链接可供预览。

但是`vercel`只是针对个人用户免费，`teams`是收费的。

首先`vercel`零配置部署，第二访问速度比`github-page`好很多，并且构建很快，还是免费使用的，对于部署个人[前端项目](https://so.csdn.net/so/search?q=%E5%89%8D%E7%AB%AF%E9%A1%B9%E7%9B%AE&spm=1001.2101.3001.7020)路、接口服务非常方便

- vercel类似于github page，但远比github page强大，速度也快得多得多，而且将Github授权给vercel后，可以达到最优雅的发布体验，只需将代码轻轻一推，项目就自动更新部署了。
- vercel还支持部署serverless接口。那代表着，其不仅仅可以部署静态网站，甚至可以部署动态网站，而这些功能，统统都是免费的
- vercel还支持自动配置https，不用自己去FreeSSL申请证书，更是省去了一大堆证书的配置
- vercel目前的部署模板有31种之多
- ![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241815956.png#id=soMGE&originHeight=1412&originWidth=1478&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 部署

打开`vercel`主页`https://vercel.com/signup`

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241816955.png#id=LUTL1&originHeight=1504&originWidth=2192&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

使用`GitHub`账号去关联`vercel`，后续代码提交到`vercel`可以自动触发部署

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241816866.png#id=bbx7s&originHeight=1544&originWidth=1416&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

出现授权页面，点击`Authorize Vercel`。

然后就可以选择要部署的项目

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241822388.png#id=va9PO&originHeight=324&originWidth=1885&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

因为我仅选择一个仓库被部署，所以没有选项了，正常会展示许多仓库可被选择

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241823673.png#id=uaBy6&originHeight=457&originWidth=754&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

选择完仓库后，点击右侧的**Import**按钮导入，如图所示：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241824268.png#id=JRtwd&originHeight=833&originWidth=1289&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

由于是vuepress搭建的项目，所以勾选它。下方的`Build and Output Settings`用默认即可。点击开始**Deploy**部署，差不多两分钟左右即可完成。如图所示：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241829880.png#id=hCqD1&originHeight=1464&originWidth=2878&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 域名添加
访问博客首页。由于Vercel 官方域名的 Dns 污染问题不能访问。所以要通过自定义域名的方式来解决。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241831632.png#id=cTCBd&originHeight=783&originWidth=1625&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

点击`View Domains` 绑定自定义域名，点击`Add`添加

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241834503.png#id=Wb8Rf&originHeight=747&originWidth=1329&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 域名解析

> 注：域名是在阿里云买的！

去阿里云域名解析处理解析`CNAME`到`cname.vercel-dns.com`

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241836055.png#id=V37gJ&originHeight=286&originWidth=1681&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

这两条记录都是在上一步vercel提供给我们的，由于我的域名解析完成了，所以没体现出来。

每次github更新完代码，Vercel都会自动更新部署，日志查看：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302241840122.png#id=sVk6h&originHeight=937&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

至此就完成部署操作了。访问：[https://www.yznotes.cn/](https://www.yznotes.cn/)
