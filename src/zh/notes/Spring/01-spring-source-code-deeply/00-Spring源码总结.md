---
title: 00_Spring源码总结
category:
  - Spring源码
star: true
date: 2024-03-09
---

<!-- more -->

下文是我在看源码过程中的个人总结，列举了每个过程中最重要的操作。存在误差的地方会不断修正。

## Spring容器初始化图示

代码入口：最重要的refresh()方法

```java
    public ClassPathXmlApplicationContext(String[] configLocations, boolean refresh, @Nullable ApplicationContext parent) throws BeansException {
        super(parent);
        this.setConfigLocations(configLocations);
        if (refresh) {
            this.refresh();
        }
    }
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/174d43bac8b16f10.png)

---

## Bean生命周期

代码入口就是我们获取bean的getBean()方法：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
		ApplicationContext context = new ClassPathXmlApplicationContext("applicationContext.xml");
		TestA testA = (TestA) context.getBean("testA");
		System.out.println(testA);
	}
}
```

![Bean](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/d2131b3d220cb49c.png)
