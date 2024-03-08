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

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/ee1043c3728c3290.png)

---

## Bean生命周期

setter循环依赖

通过别名缓存aliasMp获取实际beanName
