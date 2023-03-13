---
title: 第21章_BigDecimal
category:
  - JAVA
tag: 
  - JAVASE
date: 2023-03-13
---

<!-- more -->

## 1、什么是BigDecimal

### 1.1 介绍

以整数为例，如果我们想要表示一个非常大的整数，比如这个整数超过64位，那么能表示最大数字的long类型也无法存取这样的数字，这时该怎么办呢？以前的做法是把数字存储在字符串中，大数之间的四则运算及其其他运算都是通过数组完成的。

JDK也有类似实现，那就是 BigInteger和BigDecimal，BigInteger表示任意大小的整数，BigDecimal用来表示一个任意大小且精度完全准确的浮点数。

由于计算机中保存的小数其实是十进制的小数的近似值，并不是准确值，所以，千万不要在代码中使用浮点数来表示金额等重要的指标。 

### 1.2 BigDecimal如何精确计数

实际上BigDecimal是通过一个“无标度值”和“标度”来表示一个数的。

涉及的字段如以下代码所示：

```java
public class BigDecimal extends Number implements Comparable<BigDecimal> {
       private final BigInteger intVal;
       private final int scale;
       private final transient long intCompact;
}
```

### 1.3 什么是标度

除了scale字段，在BigDecimal中还提供了scale()方法，用来返回这个BigDecimal的标度。

```java
/**
 * Returns the <i>scale</i> of this {@code BigDecimal}.  If zero
 * or positive, the scale is the number of digits to the right of
 * the decimal point.  If negative, the unscaled value of the
 * number is multiplied by ten to the power of the negation of the
 * scale.  For example, a scale of {@code -3} means the unscaled
 * value is multiplied by 1000.
 *
 * @return the scale of this {@code BigDecimal}.
 */
public int scale() {
    return scale;
}
```

scale到底表示的是什么呢？其实上面的注释已经说明了：

- 如果scale为零或正值，则该值表示这个数字小数点右侧的位数
  - 比如123.123，如果用BigDecimal表示，那么它的无标度值为123123，标度为3
  - 而二进制无法表示的0.1，使用BigDecimal表示就可以了，即通过无标度值1和标度1来表示
- 如果scale为负数，则该数字的真实值需要乘以10的该负数的绝对值的幂
  - 例如，scale为-3,则这个数需要乘以1000，即在末尾有3个0

在BigDecimal中一共有以下4个构造方法：

```
BigDecimal(int）
BigDecimal(double)
BigDecimal(long)
BigDecimal(String)
```

以上四个方法创建出来的BigDecimal的标度(scale)是不同的。

- 其中BigDecimal(int）和BigDecimal(long)比较简单，因为都是整数，所以他们的标度都是0.
- BigDecimal(double)和BigDecimal(long)稍微复杂些，以下章节会详细介绍。

---

## 2、为什么不能直接使用double创建一个BigDecimal

### 2.1 阐述

很多人都知道，在进行金额表示、金额计算等场景，不能使用double、float等类型，而是要使用对精度支持的更好的BigDecimal。

所以，很多支付、电商、金融等业务中，BigDecimal的使用非常频繁。但是，如果误以为只要使用BigDecimal表示数字，结果就一定精确，那就大错特错了！

BigDecimal的使用的第一步就是创建一个BigDecimal对象，如果这一步都有问题，那么后面怎么算都是错的！

### 2.2 BigDecimal(double)有什么问题

BigDecimal中提供了一个通过double创建BigDecimal的方法——BigDecimal(double) ，但是，同时也给我们留了一个坑！

因为我们知道，double表示的小数是不精确的，如0.1这个数字，double只能表示他的近似值。

所以，当我们使用new BigDecimal(0.1)创建一个BigDecimal 的时候，其实创建出来的值并不是正好等于0.1的。

而是0.1000000000000000055511151231257827021181583404541015625。这是因为doule自身表示的只是一个近似值。

所以，如果我们在代码中，使用BigDecimal(double) 来创建一个BigDecimal的话，那么是损失了精度的，这是极其严重的。

### 2.3 使用BigDecimal(String)创建BigDecimal

对于BigDecimal(String) ，当我们使用new BigDecimal("0.1")创建一个BigDecimal 的时候，其实创建出来的值正好就是等于0.1的。那么他的标度也就是1。

但是需要注意的是，new BigDecimal("0.10000")和new BigDecimal("0.1")这两个数的标度分别是5和1，如果使用BigDecimal的equals方法比较，得到的结果是false。

那么，想要创建一个能精确的表示0.1的BigDecimal，请使用以下两种方式：

```
BigDecimal recommend1 = new BigDecimal("0.1");
BigDecimal recommend2 = BigDecimal.valueOf(0.1);
```

---

## 3、为什么不能使用BigDecimal的equals比较大小

### 3.1 《阿里巴巴Java开发手册》说明

![image-20230313182841186](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/Base/202303131828253.png)

我在之前的CodeReview中，看到过以下这样的低级错误：

```
if(bigDecimal == bigDecimal1){
    // 两个数相等
}
```

这种错误，相信聪明的读者一眼就可以看出问题，因为BigDecimal是对象，所以不能用==来判断两个数字的值是否相等。

以上这种写法，可能得到的结果和你预想的不一样！

先来做个实验，运行以下代码：

```java
BigDecimal bigDecimal = new BigDecimal(1);
BigDecimal bigDecimal1 = new BigDecimal(1);
System.out.println(bigDecimal.equals(bigDecimal1));
 
 
BigDecimal bigDecimal2 = new BigDecimal(1);
BigDecimal bigDecimal3 = new BigDecimal(1.0);
System.out.println(bigDecimal2.equals(bigDecimal3));
 
 
BigDecimal bigDecimal4 = new BigDecimal("1");
BigDecimal bigDecimal5 = new BigDecimal("1.0");
System.out.println(bigDecimal4.equals(bigDecimal5));
```

以上代码，输出结果为：

true
true
false 

### 3.2 BigDecimal的equals原理

通过以上代码示例，我们发现，在使用BigDecimal的equals方法对1和1.0进行比较的时候，有的时候是true（当使用int、double定义BigDecimal时），有的时候是false（当使用String定义BigDecimal时）。

那么，为什么会出现这样的情况呢，我们先来看下BigDecimal的equals方法。

在BigDecimal的JavaDoc中其实已经解释了其中原因：

> Compares this  BigDecimal with the specified Object for equality.  Unlike compareTo, this method considers two BigDecimal objects equal only if they are equal in value and scale (thus 2.0 is not equal to 2.00 when compared by  this method)

大概意思就是，equals方法和compareTo并不一样，equals方法会比较两部分内容，分别是值（value）和标度（scale）。

对应的代码如下：

![image-20230313183003527](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/Base/202303131830614.png)


所以，我们以上代码定义出来的两个BigDecimal对象（bigDecimal4和bigDecimal5）的标度是不一样的，所以使用equals比较的结果就是false了。

尝试着对代码进行debug，在debug的过程中我们也可以看到bigDecimal4的标度时0，而bigDecimal5的标度是1。

![image-20230313183012727](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/Base/202303131830867.png)

之所以equals比较bigDecimal4和bigDecimal5的结果是false，是因为标度不同。

那么，为什么标度不同呢？为什么bigDecimal2和bigDecimal3的标度是一样的（当使用int、double定义BigDecimal时），而bigDecimal4和bigDecimal5却不一样（当使用String定义BigDecimal时）呢？

### 3.3 为什么标度不同

这个就涉及到BigDecimal的标度问题了。

> **BigDecimal(long) 和BigDecimal(int)**

BigDecimal(long) 和BigDecimal(int)，因为是整数，所以标度就是0 ：

```java
public BigDecimal(int val) {
    this.intCompact = val;
    this.scale = 0;
    this.intVal = null;
}
 
public BigDecimal(long val) {
    this.intCompact = val;
    this.intVal = (val == INFLATED) ? INFLATED_BIGINT : null;
    this.scale = 0;
}
```

> **BigDecimal(double)**

而对于BigDecimal(double) ，当我们使用new BigDecimal(0.1)创建一个BigDecimal 的时候，其实创建出来的值并不是整好等于0.1的，而是0.1000000000000000055511151231257827021181583404541015625 。这是因为doule自身表示的只是一个近似值。

那么，无论我们使用new BigDecimal(0.1)还是new BigDecimal(0.10)定义，他的近似值都是0.1000000000000000055511151231257827021181583404541015625这个，那么他的标度就是这个数字的位数，即55。

其他的浮点数也同样的道理。对于new BigDecimal(1.0)这样的形式来说，因为他本质上也是个整数，所以他创建出来的数字的标度就是0。

所以，因为BigDecimal(1.0)和BigDecimal(1.00)的标度是一样的，所以在使用equals方法比较的时候，得到的结果就是true。

> **BigDecimal(string**)

而对于BigDecimal(double) ，当我们使用new BigDecimal("0.1")创建一个BigDecimal 的时候，其实创建出来的值正好就是等于0.1的。那么他的标度也就是1。

如果使用new BigDecimal("0.10000")，那么创建出来的数就是0.10000，标度也就是5。

所以，因为BigDecimal("1.0")和BigDecimal("1.00")的标度不一样，所以在使用equals方法比较的时候，得到的结果就是false。

### 3.4 如何比较BigDecimal

如果我们只想判断两个BigDecimal的值是否相等，那么该如何判断呢？

BigDecimal中提供了compareTo方法，这个方法就可以只比较两个数字的值，如果两个数相等，则返回0。

```java
    BigDecimal bigDecimal4 = new BigDecimal("1");
    BigDecimal bigDecimal5 = new BigDecimal("1.0000");
    System.out.println(bigDecimal4.compareTo(bigDecimal5));
```

以上代码，输出结果：0

其源码如下：

![image-20230313183142894](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/Base/202303131831041.png)

---

## 4、总结

BigDecimal是一个非常好用的表示高精度数字的类，其中提供了很多丰富的方法。

但是，他的equals方法使用的时候需要谨慎，因为他在比较的时候，不仅比较两个数字的值，还会比较他们的标度，只要这两个因素有一个是不相等的，那么结果也是false。

如果**想要对两个BigDecimal的数值进行比较的话，可以使用compareTo方法**。