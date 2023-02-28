---
title: 第1章-为什么要关心Java8
category:
  - JAVA
tag: 
  - JAVA8
date: 2023-02-28
---

<!-- more -->

## Java 中的函数

编程语言中的**函数**一词通常是**指方法**，尤其是**静态方法**；这是在数学函数，也就是没有副作用的函数之外的新含义。幸运的是，你将会看到，在Java 8谈到函数时，这两种用法几乎是一致的。

Java 8中新增了**函数——值**的一种新形式。它有助于使用**流**，有了它，Java 8可以进行多核处理器上的并行编程。我们首先来展示一下作为值的函数本身的有用之处。

首先有原始值，比如42（int类型）和3.14（double类型）。其次，值可以是对象（更严格地说是对象的引用）。获得对象的唯一途径是利用new，也许是通过工厂方法或库函数实现的；对象引用指向类的一个实例。例子包括"abc"（String类型），new Integer(1111)（Integer类型），以及new HashMap<Integer,String>(100)的结果——它显然调用了HashMap的构造函数。甚至数组也是对象。那么有什么问题呢？

我们要注意到，编程语言的整个目的就在于操作值，要是按照历史上编程语言的传统，这些值因此被称为**一等值**。

编程语言中的其他结构也许有助于我们表示值的结构，但在程序执行期间不能传递，因而是**二等公民**。如方法和类等是二等公民。

用方法来定义类很不错，类还可以实例化来产生值，但方法和类本身都不是值。然而**在运行时传递方法能将方法变成一等公民**。这在编程中非常有用，因此Java 8的设计者把这个功能加入到了Java中。

### 方法和 Lambda 作为一等公民

Scala和Groovy等语言的实践已经证明，让方法等概念作为一等值可以扩充程序员的工具库，从而让编程变得更容易。Java 8的设计者决定允许方法作为值，让编程更轻松。此外，让方法作为值也构成了其他若干Java 8功能（如Stream）的基础。

#### 方法引用

比方说，你想要筛选一个目录中的所有隐藏文件。你需要编写一个方法，然后给它一个File，它就会告诉你文件是不是隐藏的。幸好，File类里面有一个叫

isHidden的方法。我们可以把它看作一个函数，接受一个File，返回一个布尔值。但要用它做筛选，你需要把它包在一个FileFilter对象里，然后传递给File.listFiles方法，如下所示：

```java
File[] hiddenFiles = new File(".").listFiles(new FileFilter() { 
 	public boolean accept(File file) { 
 		return file.isHidden();  //筛选隐藏文件
 	} 
});
```

虽然只有三行，但这三行可真够绕的。我们第一次碰到的时候肯定都说过：“非得这样不可吗？”我们已经有一个方法isHidden可以使用，为什么非得把它包在一个啰嗦的FileFilter类里面再实例化呢？因为在Java 8之前你必须这么做！

如今在Java 8里，你可以把代码重写成这个样子：

```java
File[] hiddenFiles = new File(".").listFiles(File::isHidden);
```

你已经有了函数isHidden，因此只需用Java 8的方法引用**::**语法（即“把这个方法作为值”）将其传给listFiles方法；请注意，我们也开始用函数代表方法了。

方法不再是二等值了。与用对象引用传递对象类似（对象引用是用new创建的），在Java 8里写下`File::isHidden`的时候，你就创建了一个方法引用，你同样可以传递它。

只要方法中有代码（方法中的可执行部分），那么用方法引用就可以传递代码，如图1-3所示。图1-4说明了这一概念。

<p align="center">图1-3</p>

![image-20220324193100591](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220324193100591.png)

<p align="center">图1-4</p>

![image-20220324193303910](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220324193303910.png)

#### Lambda——匿名函数

除了允许（命名）函数成为一等值外，Java 8还体现了更广义的将函数作为值的思想，包括Lambda①（或匿名函数）。比如，你现在可以写`(int x) -> x + 1`，表示“调用时给定参数x，就返回x + 1值的函数”。你可能会想这有什么必要呢？因为你可以在MyMathsUtils类里面定义一个add1方法，然后写`MyMathsUtils::add1`嘛！确实是可以，但要是你没有方便的方法和类可用，新的Lambda语法更简洁。后续会详细讨论Lambda。我们说使用这些概念的程序为函数式编程风格，这句话的意思是“**编写把函数作为一等值来传递的程序**”。

---

### 传递代码：一个例子

#### 例子

假设你有一个Apple类，它有一个getColor方法，还有一个变量inventory保存着一个Apples的列表。你可能想要选出所有的绿苹果，并返回一个列表。通常我们用筛选（filter）一词来表达这个概念。在Java 8之前，你可能会写这样一个方法filterGreenApples：

```java
public static List<Apple> filterGreenApples(List<Apple> inventory){ 
 	List<Apple> result = new ArrayList<>(); 
 	for (Apple apple: inventory){ 
 		if ("green".equals(apple.getColor())) {
 			result.add(apple); 
 		} 
 	} 
	 return result; 
}
```

但是接下来，有人可能想要选出重的苹果，比如超过150克，于是你心情沉重地写了下面这个方法，甚至用了复制粘贴：

```java
public static List<Apple> filterHeavyApples(List<Apple> inventory){ 
 	List<Apple> result = new ArrayList<>(); 
 	for (Apple apple: inventory){ 
 		if (apple.getWeight() > 150) { 
 			result.add(apple); 
 		} 
 	} 
 	return result; 
}
```

我们都知道软件工程中复制粘贴的危险——给一个做了更新和修正，却忘了另一个。嘿，这两个方法只有一行不同：if里面高亮的那行条件。如果这两个高亮的方法之间的差异仅仅是接受的重量范围不同，那么你只要把接受的重量上下限作为参数传递给filter就行了，比如指定(150, 1000)来选出重的苹果（超过150克），或者指定(0, 80)来选出轻的苹果（低于80克）。

但是，我们前面提过了，Java 8会把条件代码作为参数传递进去，这样可以避免filter方法出现重复的代码。现在你可以写：

```java
public static boolean isGreenApple(Apple apple) { 
 	return "green".equals(apple.getColor());
} 
public static boolean isHeavyApple(Apple apple) { 
 	return apple.getWeight() > 150;
} 
public interface Predicate<T>{
	boolean test(T t); 
} 

static List<Apple> filterApples(List<Apple> inventory, Predicate<Apple> p) {
 	List<Apple> result = new ArrayList<>(); 
 	for (Apple apple: inventory){ 
 		if (p.test(apple)) { 
 			result.add(apple); 
 		} 
 	} 
 	return result; 
}
```

要用它的话，你可以写：

```java
filterApples(inventory, Apple::isGreenApple);
```

或者

```java
filterApples(inventory, Apple::isHeavyApple);
```

#### 什么是谓词？

前面的代码传递了方法 Apple::isGreenApple （它接受参数 Apple 并返回一个boolean）给filterApples，后者则希望接受一个Predicate 标签Apple参数。

**谓词**（predicate）

在数学上常常用来代表一个类似函数的东西，它接受一个参数值，并返回true或false。你在后面会看到，Java 8也会允许你写`Function<Apple,Boolean>`，但用Predicate 标签Apple是更标准的方式，效率也会更高一点儿，这避免了把boolean封装在Boolean里面。

---

### 从传递方法到 Lambda 

把方法作为值来传递显然很有用，但要是为类似于isHeavyApple和isGreenApple这种可能只用一两次的短方法写一堆定义有点儿烦人。不过Java 8也解决了这个问题，它引入了一套新记法（**匿名函数或Lambda**），让你可以写

```java
filterApples(inventory, (Apple a) -> "green".equals(a.getColor()) );
```

或者

```java
filterApples(inventory, (Apple a) -> a.getWeight() > 150 );
```

甚至

```java
filterApples(inventory, (Apple a) -> a.getWeight() < 80 || 
 								  "brown".equals(a.getColor()) );
```

所以，你甚至都不需要为只用一次的方法写定义；代码更干净、更清晰，因为你用不着去找自己到底传递了什么代码。但要是Lambda的长度多于几行（它的行为也不是一目了然）的话，那你还是应该用方法引用来指向一个有描述性名称的方法，而不是使用匿名的Lambda。你应该以代码的清晰度为准绳。

们迄今为止谈到的函数式编程竟然如此强大，在后面你更会体会到这一点。本来，Java加上filter和几个相关的东西作为通用库方法就足以让人满意了，比如

```java
static <T> Collection<T> filter(Collection<T> c, Predicate<T> p);
```

这样你甚至都不需要写filterApples了，因为比如先前的调用

```java
filterApples(inventory, (Apple a) -> a.getWeight() > 150 );
```

就可以直接调用库方法filter：

```java
filter(inventory, (Apple a) -> a.getWeight() > 150 );
```

但是，为了更好地利用并行，Java的设计师没有这么做。Java 8中有一整套新的类集合API——Stream，它有一套函数式程序员熟悉的、类似于filter的操作，比如map、reduce，还有我们接下来要讨论的在Collections和Streams之间做转换的方法。

---

## 流

几乎每个Java应用都会制造和处理集合。但集合用起来并不总是那么理想。比方说，你需要从一个列表中筛选金额较高的交易，然后按货币分组。你需要写一大堆套路化的代码来实现这个数据处理命令，如下所示：

```java
//建立累积交易分组的Map 
Map<Currency, List<Transaction>> transactionsByCurrencies = new HashMap<>();  
        for (Transaction transaction : transactions) {
          //筛选金额较高的交易
          if(transaction.getPrice() > 1000){
            Currency currency = transaction.getCurrency();
            List<Transaction> transactionsForCurrency = transactionsByCurrencies.get(currency);
            //如果这个货币的分组Map是空的，那就建立一个
            if (transactionsForCurrency == null) {
                transactionsForCurrency = new ArrayList<>();
                transactionsByCurrencies.put(currency, transactionsForCurrency);
            }
            //将当前遍历的交易添加到具有同一货币的交易List中
            transactionsForCurrency.add(transaction);
        }
    }
```

此外，我们很难一眼看出来这些代码是做什么的，因为有好几个嵌套的控制流指令。有了Stream API，你现在可以这样解决这个问题了：

```java
import static java.util.stream.Collectors.toList; 
Map<Currency, List<Transaction>> transactionsByCurrencies = 
 	transactions.stream() 
 		.filter((Transaction t) -> t.getPrice() > 1000) 
 		.collect(groupingBy(Transaction::getCurrency));
```

现在值得注意的是，和Collection API相比，Stream API处理数据的方式非常不同。用集合的话，你得自己去做迭代的过程。你得用for-each循环一个个去迭代元素，然后再处理元素。我们把这种数据迭代的方法称为**外部迭代**。相反，有了Stream API，你根本用不着操心循环的事情。数据处理完全是在库内部进行的。我们把这种思想叫作**内部迭代**。

使用集合的另一个头疼的地方是，想想看，要是你的交易量非常庞大，你要怎么处理这个巨大的列表呢？单个CPU根本搞不定这么大量的数据，但你很可能已经有了一台多核电脑。理想的情况下，你可能想让这些CPU内核共同分担处理工作，以缩短处理时间。理论上来说，要是你有八个核，那并行起来，处理数据的速度应该是单核的八倍。

> **多核**

- 所有新的台式和笔记本电脑都是多核的。它们不是仅有一个CPU，而是有四个、八个，甚至更多CPU，通常称为**内核**。问题是，经典的Java程序只能利用其中一个核，其他核的处理能力都浪费了。类似地，很多公司利用**计算集群**（用高速网络连接起来的多台计算机）来高效处理海量数据。Java 8提供了新的编程风格，可更好地利用这样的计算机。

- Google的搜索引擎就是一个无法在单台计算机上运行的代码的例子。它要读取互联网上的每个页面并建立索引，将每个互联网网页上出现的每个词都映射到包含该词的网址上。然后，如果你用多个单词进行搜索，软件就可以快速利用索引，给你一个包含这些词的网页集合。想想看，你会如何在Java中实现这个算法，哪怕是比Google小的引擎也需要你利用计算机上所有的核。

### 并行处理

通过多线程代码来利用并行（使用先前Java版本中的Thread API）并非易事。Java 8也用Stream API（java.util.stream）解决了这两个问题：集合处理时的套路和晦涩，以及难以利用多核。

- 这样设计的第一个原因是：有许多反复出现的数据处理模式，类似于前一节所说的filterApples或SQL等数据库查询语言里熟悉的操作，如果在库中有这些就会很方便：根据标准筛选数据（比如较重的苹果），提取数据（例如抽取列表中每个苹果的重量字段），或给数据分组（例如，将一个数字列表分组，奇数和偶数分别列表）等。
- 第二个原因是：这类操作常常可以并行化。例如，如图1-6所示，在两个CPU上筛选列表，可以让一个CPU处理列表的前一半，第二个CPU处理后一半，这称为分支步骤(1)。CPU随后对各自的半个列表做筛选(2)。最后(3)，一个CPU会把两个结果合并起来（Google搜索这么快就与此紧密相关，当然他们用的CPU远远不止两个了）。
- 

![image-20220324202136610](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220324202136610.png)

<p align="center">图1-6</p>

到这里，我们只是说新的Stream API和Java现有的集合API的行为差不多：它们都能够访问数据项目的序列。不过，现在最好记得，Collection主要是为了存储和访问数据，而Stream则主要用于描述对数据的计算。这里的关键点在于，Stream允许并提倡并行处理一个Stream中的元素。虽然可能乍看上去有点儿怪，但**筛选一个Collection**（将上一节的filterApples应用在一个List上）**的最快方法常常是将其转换为Stream，进行并行处理，然后再转换回List**，下面举的串行和并行的例子都是如此。我们这里还只是说“几乎免费的并行”，让你稍微体验一下，如何利用Stream和Lambda表达式顺序或并行地从一个列表里筛选比较重的苹果。

顺序处理：

```java
import static java.util.stream.Collectors.toList; 
List<Apple> heavyApples = 
 	inventory.stream().filter((Apple a) -> a.getWeight() > 150) 
 					 .collect(toList());
```

并行处理：

```java
import static java.util.stream.Collectors.toList; 
List<Apple> heavyApples = 
 	inventory.parallelStream().filter((Apple a) -> a.getWeight() > 150) 
 							.collect(toList());
```



### Java中的并行与无共享可变状态

大家都说Java里面并行很难，而且和synchronized相关的玩意儿都容易出问题。那Java 8里面有什么“灵丹妙药”呢？事实上有两个。

- 首先，库会负责分块，即把大的流分成几个小的流，以便并行处理。
- 其次，流提供的这个几乎免费的并行，只有在传递给filter之类的库方法的方法不会互动（比方说有可变的共享对象）时才能工作。但是其实这个限制对于程序员来说挺自然的，举个例子，我们的`Apple::isGreenApple`就是这样。确实，虽然**函数式编程**中 的**函数**的主要意思是“把函数作为一等值”，不过它也常常隐含着第二层意思，即“执行时在元素之间无互动”。

---

## 默认方法

Java 8中加入默认方法主要是为了支持库设计师，让他们能够写出更容易改进的接口。这一方法很重要，因为你会在接口中遇到越来越多的默认方法，但由于真正需要编写默认方法的程序员相对较少，而且它们只是有助于程序改进，而不是用于编写任何具体的程序，我们这里还是不要啰嗦了，举个例子吧。

```java
List<Apple> heavyApples1 = 
 	inventory.stream().filter((Apple a) -> a.getWeight() > 150) 
 					.collect(toList()); 
List<Apple> heavyApples2 = 
 	inventory.parallelStream().filter((Apple a) -> a.getWeight() > 150) 
 							.collect(toList());
```

但这里有个问题：在Java 8之前，`List<T>`并没有**stream**或**parallelStream**方法，它实现的`Collection<T>`接口也没有，因为当初还没有想到这些方法嘛！可没有这些方法，这些代码就不能编译。换作你自己的接口的话，最简单的解决方案就是让Java 8的设计者把stream方法加入Collection接口，并加入ArrayList类的实现。

可要是这样做，对用户来说就是噩梦了。有很多的替代集合框架都用Collection API实现了接口。但给接口加入一个新方法，意味着所有的实体类都必须为其提供一个实现。语言设计者没法控制Collections所有现有的实现，这下你就进退两难了：你如何改变已发布的接口而不破坏已有的实现呢？

Java 8的解决方法就是打破最后一环——接口如今可以包含实现类没有提供实现的方法签名了！那谁来实现它呢？**缺失的方法主体随接口提供了（因此就有了默认实现），而不是由实现类提供**。

这就给接口设计者提供了一个**扩充接口**的方式，而不会破坏现有的代码。Java 8在接口声明中使用新的**default关键字**来表示这一点。

例如，在Java 8里，你现在可以直接对List调用sort方法。它是用Java 8 List接口中如下所示的默认方法实现的，它会调用Collections.sort静态方法：

```java
default void sort(Comparator<? super E> c) { 
 	Collections.sort(this, c); 
}
```

这意味着List的任何实体类都不需要显式实现sort，而在以前的Java版本中，除非提供了sort的实现，否则这些实体类在重新编译时都会失败。

不过慢着，一个类可以实现多个接口，不是吗？那么，如果在好几个接口里有多个默认实现，是否意味着Java中有了**某种形式的多重继承**？是的，在某种程度上是这样。

后续中会谈到，Java 8用一些限制来避免出现类似于C++中臭名昭著的菱形继承问题。

---

## 来自函数式编程的其他好思想

前几节介绍了Java中从函数式编程中引入的两个核心思想：

- 将方法和Lambda作为一等值，
- 以及在没有可变共享状态时，函数或方法可以有效、安全地并行执行。前面说到的新的Stream API把这两种思想都用到了。

> 处理null

在Java 8里有一个`Optional<T>`类，如果你能一致地使用它的话，就可以帮助你避免出现NullPointer异常。它是一个容器对象，可以包含，也可以不包含一个值。`Optional<T>`中有方法来明确处理值不存在的情况，这样就可以避免NullPointer异常了。换句话说，它使用类型系统，允许你表明我们知道一个变量可能会没有值。

> **（结构）模式匹配**

这个术语有两个意思，这里我们指的是数学和函数式编程上所用的，即函数是分情况定义的，而不是使用if-then-else。它的另一个意思类似于“在给定目录中找到所有类似于IMG*.JPG形式的文件”，和所谓的正则表达式有关。

其在数学中也有使用，例如：

```
f(0) = 1 
f(n) = n*f(n-1) otherwise
```

在Java中，你可以在这里写一个if-then-else语句或一个switch语句。其他语言表明，对于更复杂的数据类型，模式匹配可以比if-then-else更简明地表达编程思想。

对于这种数据类型，你也可以使用多态和方法重载来替代if-then-else，但对于哪种方式更合适，就语言设计而言仍有一些争论。我们认为两者都是有用的工具，你都应该掌握。不幸的是，Java 8对模式匹配的支持并不完全。

为什么Java中的switch语句应该限于原始类型值和Strings呢？函数式语言倾向于允许switch用在更多的数据类型上，包括允许模式匹配。在面向对象设计中，常用的访客模式可以用来遍历一组类（如汽车的不同组件：车轮、发动机、底盘等），并对每个访问的对象执行操作。模式匹配的一个优点是编译器可以报告常见错误，如：“Brakes类属于用来表示Car类的组件的一族类。你忘记了要显式处理它。

---

## 小结

以下是你应从本章中学到的关键概念。

- Java 8中新增的核心内容提供了令人激动的新概念和功能，方便我们编写既有效又简洁的程序。
- 现有的Java编程实践并不能很好地利用多核处理器。
- 函数是一等值；记得方法如何作为函数式值来传递，还有Lambda是怎样写的。
- Java 8中Streams的概念使得Collections的许多方面得以推广，让代码更为易读，并允许并行处理流元素。
- 你可以在接口中使用默认方法，在实现类没有实现方法时提供方法内容。
- 其他来自函数式编程的有趣思想，包括处理null和使用模式匹配。
