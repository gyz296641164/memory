---
title: ✅P191_商城业务-检索服务-条件删除与URL编码问题
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 实现页面效果
TODO：待贴图

---

## 封装原生的查询条件

`cfmall-search/com.gyz.cfmall.search.vo.SearchParam`添加`_queryString`

```java
/**
 * 原生的所有查询条件
 */
private String _queryString;
```

`HttpServletRequest`的`getQueryString()`方法可以获取url的请求参数。

```java
/**
 * @author: gongyuzhuo
 * @description:
 */
@Controller
public class SearchController {
    @Autowired
    MallSearchService mallSearchService;

    /**
     * 自动将页面提交过来的所有请求查询参数封装成指定的对象
     *
     * @param param
     * @param model
     * @return
     */
    @GetMapping(value = "/list.html")
    public String listPage(SearchParam param, Model model,HttpServletRequest request) {
        param.set_queryString(request.getQueryString());
        SearchResult result = mallSearchService.search(param);
        model.addAttribute("result", result);
        return "list";
    }
}
```

---

## 封装链接

`com.gyz.cfmall.search.service.impl.MallSearchServiceImpl#buildSearchResult`

```java
//6、构建面包屑导航
if (param.getAttrs() != null && param.getAttrs().size() > 0) {
    List<SearchResult.NavVo> collect = param.getAttrs().stream().map(attr -> {
        //1、分析每一个attrs传过来的参数值
        SearchResult.NavVo navVo = new SearchResult.NavVo();
        String[] s = attr.split("_");
        navVo.setNavValue(s[1]);
        R r = productFeignService.attrInfo(Long.parseLong(s[0]));
        if (r.getCode() == 0) {
            AttrResponseVo data = r.getData("attr", new TypeReference<AttrResponseVo>() {
            });
            navVo.setNavName(data.getAttrName());
        } else {
            navVo.setNavName(s[0]);
        }
      	//封装链接
        String replace = param.get_queryString().replace("&attrs=" + attr, "");
        navVo.setLink("http://search.cfmall.com/list.html?" + replace);
        return navVo;
    }).collect(Collectors.toList());
    result.setNavs(collect);
}
```

### 问题：路径替换失败

原因：浏览器会将中文进行一个编码，而查询出来的属性值是中文

### 解决：将中文进行编码

添加代码：`encode = URLEncoder.encode(attr,"UTF-8");`

```java
//6、构建面包屑导航
if (param.getAttrs() != null && param.getAttrs().size() > 0) {
    List<SearchResult.NavVo> collect = param.getAttrs().stream().map(attr -> {
        //1、分析每一个attrs传过来的参数值
        SearchResult.NavVo navVo = new SearchResult.NavVo();
        String[] s = attr.split("_");
        navVo.setNavValue(s[1]);
        
        //封装属性名
        R r = productFeignService.attrInfo(Long.parseLong(s[0]));
        if (r.getCode() == 0) {
            AttrResponseVo data = r.getData("attr", new TypeReference<AttrResponseVo>() {
            });
            navVo.setNavName(data.getAttrName());
        } else {
            navVo.setNavName(s[0]);
        }

        String encode = null;
        try {
            encode = URLEncoder.encode(attr,"UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        String replace = param.get_queryString().replace("&attrs=" + encode, "");
        navVo.setLink("http://search.cfmall.com/list.html?" + replace);
        return navVo;
    }).collect(Collectors.toList());
    result.setNavs(collect);
}
```

有些符号，浏览器的编码与java编码不一致；

例如：

- `'('` 浏览器不进行编码，java会编码成 `%28`
- `')'` 浏览器不进行编码，java会编码成 `%29`
- `空格` 浏览器会编码成 `%20`，java会编码成 `'+'`

解决：添加`encode.replace("+","%20");`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/7282bd87bd8fb5692a638bd4702f3392.png#id=pzCCP&originHeight=293&originWidth=1334&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 构建面包屑导航完整代码

```java
//6、构建面包屑导航
if (param.getAttrs() != null && param.getAttrs().size() > 0) {
    List<SearchResult.NavVo> collect = param.getAttrs().stream().map(attr -> {
        //1、分析每一个attrs传过来的参数值
        SearchResult.NavVo navVo = new SearchResult.NavVo();
        String[] s = attr.split("_");
        navVo.setNavValue(s[1]);
        //封装属性名
        R r = productFeignService.attrInfo(Long.parseLong(s[0]));
        if (r.getCode() == 0) {
            AttrResponseVo data = r.getData("attr", new TypeReference<AttrResponseVo>() {
            });
            navVo.setNavName(data.getAttrName());
        } else {
            navVo.setNavName(s[0]);
        }
        //2、取消了这个面包屑以后，我们要跳转到哪个地方，将请求的地址url里面的当前置空
        //拿到所有的查询条件，去掉当前
        String encode = null;
        try {
            encode = URLEncoder.encode(attr,"UTF-8");
            //浏览器对空格的编码和Java不一样，差异化处理
            encode = encode.replace("%28","(").replace("%29",")").replace("+","%20");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        String replace = param.get_queryString().replace("&attrs=" + encode, "");
        navVo.setLink("http://search.cfmall.com/list.html?" + replace);
        return navVo;
    }).collect(Collectors.toList());
    result.setNavs(collect);
}
```

---

## 导航栏回显编写

### 定位元素

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202303/202303291438243.png#id=MkRcO&originHeight=534&originWidth=803&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=s2gRh&originHeight=534&originWidth=803&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 修改 list.html

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/7151391453ad479cdd17bf3500dad82f.png#id=rYhU1&originHeight=469&originWidth=1290&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

```html
<div class="JD_ipone_one c">
    <!-- 遍历面包屑功能 -->
    <a th:href="${nav.link}" th:each="nav:${result.navs}"><span th:text="${nav.navName+': '}"></span>
        <span th:text="${nav.navValue}"></span> x
    </a>
</div>
```

修改`replaceParamVal`函数。默认是对属性进行一个替换，forceAdd是否强制添加的标识。

```javascript
function replaceParamVal(url, paramName, replaceVal, forceAdd) {
    var oUrl = url.toString();
    var nUrl;
    if (oUrl.indexOf(paramName) != -1) {
        if( forceAdd ) {
            if (oUrl.indexOf("?") != -1) {
                nUrl = oUrl + "&" + paramName + "=" + replaceVal;
            } else {
                nUrl = oUrl + "?" + paramName + "=" + replaceVal;
            }
        } else {
            var re = eval('/(' + paramName + '=)([^&]*)/gi');
            nUrl = oUrl.replace(re, paramName + '=' + replaceVal);
        }
    } else {
        if (oUrl.indexOf("?") != -1) {
            nUrl = oUrl + "&" + paramName + "=" + replaceVal;
        } else {
            nUrl = oUrl + "?" + paramName + "=" + replaceVal;
        }
    }
    return nUrl;
};
```

---

## TODO

- [ ] BUG：点击屏幕尺寸筛选后，面包屑正常显示，点击 X 进行条件删除，发现删除不掉，而颜色条件可以
