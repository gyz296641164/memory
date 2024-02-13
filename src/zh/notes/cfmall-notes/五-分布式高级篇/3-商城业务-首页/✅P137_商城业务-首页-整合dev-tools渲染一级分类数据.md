---
title: ✅P137_商城业务-首页-整合dev-tools渲染一级分类数据
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 首页跳转接口

实现：访问`localhost:8200/`或者`localhost:8200/index.html`来到首页的映射；

首页渲染：获取一级分类数据；

`IndexController.java`

```java
/**
 *
 * @Author GongYuZhuo
 * @Version 1.0.0
 */
@Controller
public class IndexController {

    @Resource
    CategoryService categoryService;
	
    /**
     * GetMapping中默认存放是一个数组，可以多路径映射
     */
    @GetMapping(value = {"/", "index.html"})
    public String indexPage(Model model) {
        List<CategoryEntity> categoryEntityList = categoryService.listCategory();
        model.addAttribute("categories", categoryEntityList);
        return "index";
    }

}
```

---

## 热部署

由于更新页面每次重启非常麻烦，因此，为了实现页面修改时，不重启服务而实时更新，引入热部署

导入dev-tools依赖

`cfmall-product/pom.xml`

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-devtools</artifactId>
  <optional>true</optional>
</dependency>
```

`Ctrl+F9` 或 `Ctrl+shift+F9` 重新编译页面内容，前提是：thymeleaf缓存关闭，否则无效；代码配置，推荐重启

---

## index.html

`cfmall-product/src/main/resources/templates/index.html`

Thymeleaf的使用请参考官方文档：[Thymeleaf](https://www.thymeleaf.org/)

**加入名称空间**

```xml
<html lang="en" xmlns:th="http://www.thymeleaf.org">
```

**遍历一级分类**

```html
<div class="header_main_left">
  <ul>
    <li th:each="category : ${categories}">
      <a href="#" class="header_main_left_a" th:attr="ctg-data=${category.catId}" ><b th:text="${category.name}">家用电器</b></a>
    </li>
  </ul>
</div>
```

- `ctg-data=${category.catId}`：自定义属性存放catId



**测试**

将一级分类手机修改为手机111，查看页面数据展现

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301455658.png#id=EUw5Y&originHeight=226&originWidth=1201&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301455959.png#id=iYAZi&originHeight=264&originWidth=1004&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

成功渲染一级分类！
