---
title: 第3章-Lambda表达式
category:
  - JAVA
tag: 
  - JAVA8
date: 2023-02-28
---

<!-- more -->

# Lambda表达式

Lambda表达式。它可以让你很简洁地表示一个行为或传递代码。现在你可以把Lambda表达式看作匿名功能，它基本上就是没有声明名称的方法，但和匿名类一样，它也可以作为参数传递给一个方法。

我们会展示如何构建Lambda，它的使用场合，以及如何利用它使代码更简洁。我们还会介绍一些新的东西，如类型推断和Java 8 API中重要的新接口。最后，我们将介绍方法引用（method reference），这是一个常常和Lambda表达式联用的有用的新功能。

本章的行文思想就是教你如何一步一步地写出更简洁、更灵活的代码。在本章结束时，我们会把所有教过的概念融合在一个具体的例子里：我们会用Lambda表达式和方法引用逐步改进第2章中的排序例子，使之更加简明易读。这一章很重要，而且你将在本书中大量使用Lambda。

## Lambda 管中窥豹

可以把Lambda表达式理解为简洁地表示可传递的匿名函数的一种方式：它没有名称，但它有`参数列表`、`函数主体`、`返回类型`，可能还有一个可以抛出的`异常列表`。这个定义够大的，让我们慢慢道来。

- 匿名——我们说匿名，是因为它不像普通的方法那样有一个明确的名称：写得少而想得多！
- 函数——我们说它是函数，是因为Lambda函数不像方法那样属于某个特定的类。但和方法一样，Lambda有参数列表、函数主体、返回类型，还可能有可以抛出的异常列表。
- 传递——Lambda表达式可以作为参数传递给方法或存储在变量中。
- 简洁——无需像匿名类那样写很多模板代码。

你是不是好奇Lambda这个词是从哪儿来的？其实它来自于学术界开发出来的一套用来描述计算的**λ演算法**。

理论上来说，你在Java 8之前做不了的事情，Lambda也做不了。但是，现在你用不着再用匿名类写一堆笨重的代码，来体验行为参数化的好处了！Lambda表达式鼓励你采用我们上一章中提到的行为参数化风格。最终结果就是你的代码变得更清晰、更灵活。比如，利用Lambda表达式，你可以更为简洁地自定义一个Comparator对象。

![image-20220328172503223](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220328172503223.png)

先前：

```java
Comparator<Apple> byWeight = new Comparator<Apple>() { 
 	public int compare(Apple a1, Apple a2){ 
 		return a1.getWeight().compareTo(a2.getWeight()); 
 	} 
};
```

之后（用了Lambda表达式）：

```java
Comparator<Apple> byWeight = 
 (Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight());
```

不得不承认，代码看起来更清晰了！现在，请注意你基本上只传递了比较两个苹果重量所真正需要的代码。看起来就像是只传递了compare方法的主体。你很快就会学到，你甚至还可以进一步简化代码。我们将在下一节解释在哪里以及如何使用Lambda表达式。

我们刚刚展示给你的Lambda表达式有三个部分，如图3-1所示。

- 参数列表——这里它采用了Comparator中compare方法的参数，两个Apple。
- 箭头——箭头->把参数列表与Lambda主体分隔开。
- Lambda主体——比较两个Apple的重量。表达式就是Lambda的返回值了。

为了进一步说明，下面给出了Java 8中五个有效的Lambda表达式的例子。

1. 第一个Lambda表达式具有一个String类型的参数并返回一个int。Lambda没有return语句，因为已经隐含了return

   ```java
   (String s) -> s.length()
   ```

2. 第二个Lambda表达式有一个Apple 类型的参数并返回一个boolean（苹果的重量是否超过150克）

   ```
   (Apple a) -> a.getWeight() > 150
   ```

3. 第三个Lambda表达式具有两个int类型的参数而没有返回值（void返回）。注意Lambda表达式可以包含多行语句，这里是两行

   ```java
   (int x, int y) -> { 
    	System.out.println("Result:"); 
    	System.out.println(x+y); 
   }
   ```

4. 第四个Lambda表达式没有参数，返回一个**int**

   ```
   () -> 42
   ```

5. 第五个Lambda表达式具有两个Apple类型的参数，返回一个int：比较两个Apple的重量

   ```
   (Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight())
   ```

Lambda的基本语法是

```
(parameters) -> expression
```

或（请注意语句的花括号）

```
(parameters) -> { statements; }
```

你可以看到，Lambda表达式的语法很简单。做一下测验3.1，看看自己是不是理解了这个模式。

> **测验3.1：Lambda语法**

根据上述语法规则，以下哪个不是有效的Lambda表达式？

1. () -> {}
2. () -> "Raoul"
3. () -> {return "Mario";}
4. (Integer i) -> return "Alan" + i;
5. (String s) -> {"IronMan";}

答案：只有4和5是无效的Lambda。

1. 这个Lambda没有参数，并返回void。它类似于主体为空的方法：public void run() {}。

2. 这个Lambda没有参数，并返回String作为表达式。

3. 这个Lambda没有参数，并返回String（利用显式返回语句）

4. return是一个控制流语句。要使此Lambda有效，需要使花括号，如下所示：`(Integer i) -> {return "Alan" + i;}`。

5. “Iron Man”是一个表达式，不是一个语句。要使此Lambda有效，你可以去除花括号和分号，如下所示：`(String s) -> "Iron Man"`。或者如果你喜欢，可以使用显式返回语句，如下所示：`(String s)->{return "IronMan";}`。

表3-1提供了一些Lambda的例子和使用案例。

![image-20220328174506466](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220328174506466.png)

---

## 在哪里以及如何使用 Lambda

现在你可能在想，在哪里可以使用Lambda表达式。在上一个例子中，你把Lambda赋给了一个`Comparator<Apple>`类型的变量。你也可以在上一章中实现的filter方法中使用Lambda：

```java
List<Apple> greenApples = 
 	filter(inventory, (Apple a) -> "green".equals(a.getColor()));
```

那到底在哪里可以使用Lambda呢？你可以在**函数式接口**上使用Lambda表达式。在上面的代码中，你可以把 Lambda 表达式作为第二个参数传给 filter 方法，因为它这里需要`Predicate<T>`，而这是一个函数式接口。如果这听起来太抽象，不要担心，现在我们就来详细解释这是什么意思，以及函数式接口是什么。

### 函数式接口

还记得你在第2章里，为了参数化filter方法的行为而创建的`Predicate<T>`接口吗？它就是一个函数式接口！为什么呢？因为Predicate仅仅定义了一个抽象方法：

```java
public interface Predicate<T>{
 	boolean test (T t); 
}
```

一言以蔽之，**函数式接口就是只定义一个抽象方法的接口**。你已经知道了Java API中的一些其他函数式接口，如我们在第2章中谈到的Comparator和Runnable。

```java
public interface Comparator<T> {  //java.util.Comparator
 int compare(T o1, T o2); 
}

public interface Runnable{ 		//java.lang.Runnable
 void run(); 
}

public interface ActionListener extends EventListener{ 	//java.awt.event.ActionListener
 void actionPerformed(ActionEvent e); 
}

public interface Callable<V>{ 		//java.util.concurrent.Callable
 V call(); 
}

public interface PrivilegedAction<V>{	//java.security.PrivilegedAction
 V run(); 
}
```

**注意**

接口还可以拥有**默认方法**（即在类没有对方法进行实现时，其主体为方法提供默认实现的方法）。哪怕有很多默认方法，只要接口只定义了一个抽象方法，它就仍然是一个函数式接口。

为了检查你的理解程度，测验3.2将帮助你测试自己是否掌握了函数式接口的概念。

> **测验3.2：函数式接口**

下面哪些接口是函数式接口？

```java
public interface Adder{ 
 int add(int a, int b); 
} 
public interface SmartAdder extends Adder{ 
 int add(double a, double b); 
} 
public interface Nothing{ 
}
```

答案：只有Adder是函数式接口。

- SmartAdder不是函数式接口，因为它定义了两个叫作add的抽象方法（其中一个是从Adder那里继承来的）。
- Nothing也不是函数式接口，因为它没有声明抽象方法。

用函数式接口可以干什么呢？Lambda表达式允许你直接以内联的形式为函数式接口的抽象方法提供实现，并把整个表达式作为函数式接口的实例（具体说来，是函数式接口一个具体实现的实例）。你用匿名内部类也可以完成同样的事情，只不过比较笨拙：需要提供一个实现，然后再直接内联将它实例化。下面的代码是有效的，因为Runnable是一个只定义了一个抽象方法run的函数式接口：

```java
Runnable r1 = () -> System.out.println("Hello World 1");	//使用Lambda

Runnable r2 = new Runnable(){ 		//使用匿名类
 public void run(){ 
 System.out.println("Hello World 2"); 
 } 
}; 

public static void process(Runnable r){ 
 r.run(); 
} 
process(r1); 
process(r2); 
process(() -> System.out.println("Hello World 3"));	//利用直接传递的Lambda打印“Hello World 3”
```

### 函数描述符

函数式接口的抽象方法的签名基本上就是Lambda表达式的签名。我们将这种抽象方法叫作**函数描述符**。

例如，Runnable接口可以看作一个什么也不接受什么也不返回（void）的函数的签名，因为它只有一个叫作run的抽象方法，这个方法什么也不接受，什么也不返回（void）。

我们在本章中使用了一个特殊表示法来描述Lambda和函数式接口的签名。`() -> void`代表了参数列表为空，且返回void的函数。这正是Runnable接口所代表的。

举另一个例子，`(Apple, Apple) -> int`代表接受两个Apple作为参数且返回int的函数。

你可能已经在想，Lambda表达式是怎么做类型检查的。我们会在3.5节中详细介绍，编译器是如何检查Lambda在给定上下文中是否有效的。现在，只要知道Lambda表达式可以被赋给一个变量，或传递给一个接受函数式接口作为参数的方法就好了，当然这个Lambda表达式的签名要和函数式接口的抽象方法一样。比如，在我们之前的例子里，你可以像下面这样直接把一个Lambda传给process方法：

```java
public void process(Runnable r){ 
 r.run(); 
}

process(() -> System.out.println("This is awesome!!"));
```

此代码执行时将打印“This is awesome!!”。Lambda表达式()-> System.out.println("This is awesome!!")不接受参数且返回void。 这恰恰是Runnable接口中run方法的签名。

你可能会想：“为什么只有在需要函数式接口的时候才可以传递Lambda呢？”语言的设计者也考虑过其他办法，例如给Java添加函数类型（有点儿像我们介绍的描述Lambda表达式签名的特殊表示法，但是他们选择了现在这种方式，因为这种方式自然且能避免语言变得更复杂。此外，大多数Java程序员都已经熟悉了具有一个抽象方法的接口的理念（例如事件处理）。试试看测验3.3，测试一下你对哪里可以使用Lambda这个知识点的掌握情况。

> **测验3.3：在哪里可以使用Lambda？**

以下哪些是使用Lambda表达式的有效方式？

```java
(1) execute(() -> {});
 public void execute(Runnable r){ 
 r.run(); 
 } 
 
(2) public Callable<String> fetch() {
 return () -> "Tricky example ;-)"; 
 } 
 
(3) Predicate<Apple> p = (Apple a) -> a.getWeight();
```

答案：只有1和2是有效的。

- 第一个例子有效，是因为Lambda() -> {}具有签名() -> void，这和Runnable中的抽象方法run的签名相匹配。请注意，此代码运行后什么都不会做，因为Lambda是空的！
- 第二个例子也是有效的。事实上，fetch方法的返回类型是`Callable<String>`。`Callable<String>`基本上就定义了一个方法，签名是() -> String，其中T被String代替了。因为Lambda() -> "Trickyexample;-)"的签名是() -> String，所以在这个上下文中可以使用Lambda。

第三个例子无效，因为Lambda表达式(Apple a) -> a.getWeight()的签名是(Apple) -> Integer，这和`Predicate<Apple>:(Apple) -> boolean`中定义的test方法的签名不同。

> **@FunctionalInterface**又是怎么回事？

如果你去看看新的Java API，会发现函数式接口带有@FunctionalInterface的标注。这个标注用于表示该接口会设计成一个函数式接口。如果你用@FunctionalInterface定义了一个接口，而它却不是函数式接口的话，编译器将返回一个提示原因的错误。例如，错误消息可能是“Multiple non-overriding abstract methods found in interface Foo”，表明存在多个抽象方法。请注意，@FunctionalInterface不是必需的，但对于为此设计的接口而言，使用它是比较好的做法。它就像是@Override标注表示方法被重写了。

---

## 把 Lambda 付诸实践：环绕执行模式

资源处理（例如处理文件或数据库）时一个常见的模式就是打开一个资源，做一些处理，然后关闭资源。这个设置和清理阶段总是很类似，并且会围绕着执行处理的那些重要代码。这就是所谓的**环绕执行（execute around）模式**。如图3-2所示。例如，在以下代码中，高亮显示的就是从一个文件中读取一行所需的模板代码（注意你使用了Java 7中的带资源的try语句，它已经简化了代码，因为你不需要显式地关闭资源了）：

![image-20220329193225530](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220329193225530.png)

### 第 1 步：记得行为参数化

现在这段代码是有局限的。你只能读文件的第一行。如果你想要返回头两行，甚至是返回使用最频繁的词，该怎么办呢？在理想的情况下，你要重用执行设置和清理的代码，并告诉processFile方法对文件执行不同的操作。这听起来是不是很耳熟？是的，你需要把processFile的行为参数化。你需要一种方法把行为传递给processFile，以便它可以利用BufferedReader执行不同的行为。

传递行为正是Lambda的拿手好戏。那要是想一次读两行，这个新的processFile方法看起来又该是什么样的呢？基本上，你需要一个接收BufferedReader并返回String的Lambda。例如，下面就是从BufferedReader中打印两行的写法：

```java
String result = processFile((BufferedReader br) -> 
 							br.readLine() + br.readLine());
```

### 第 2 步：使用函数式接口来传递行为

我们前面解释过了，Lambda仅可用于上下文是函数式接口的情况。你需要创建一个能匹配BufferedReader -> String，还可以抛出IOException异常的接口。让我们把这一接口叫作BufferedReaderProcessor吧。

```java
@FunctionalInterface 
public interface BufferedReaderProcessor { 
	 String process(BufferedReader b) throws IOException; 
}
```

现在你就可以把这个接口作为新的processFile方法的参数了：

```java
public static String processFile(BufferedReaderProcessor p) throws IOException { 
 	… 
}
```

### 第 3 步：执行一个行为

任何BufferedReader -> String形式的Lambda都可以作为参数来传递，因为它们符合BufferedReaderProcessor接口中定义的process方法的签名。现在你只需要一种方法在processFile主体内执行Lambda所代表的代码。请记住，Lambda表达式允许你直接内联，为函数式接口的抽象方法提供实现，并且将整个表达式作为函数式接口的一个实例。因此，你可以在processFile主体内，对得到的BufferedReaderProcessor对象调用process方法执行处理：

```java
public static String processFile(BufferedReaderProcessor p) throws IOException { 
 	try (BufferedReader br = 
 			new BufferedReader(new FileReader("data.txt"))) { 
 		return p.process(br);
	} 
}
```

###  第 4 步：传递 Lambda

现在你就可以通过传递不同的Lambda重用processFile方法，并以不同的方式处理文件了。处理一行：

```java
String oneLine = processFile((BufferedReader br) -> br.readLine());
```

处理两行：

```java
String twoLines = 
 	processFile((BufferedReader br) -> br.readLine() + br.readLine());
```

图3-3总结了所采取的使pocessFile方法更灵活的四个步骤。

![image-20220329194635007](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220329194635007.png)

我们已经展示了如何利用函数式接口来传递Lambda，但你还是得定义你自己的接口。在下一节中，我们会探讨Java 8中加入的新接口，你可以重用它来传递多个不同的Lambda。

---

## 使用函数式接口

函数式接口定义且只定义了一个抽象方法。函数式接口很有用，因为抽象方法的签名可以描述Lambda表达式的签名。函数式接口的抽象方法的签名称为函数描
述符。所以为了应用不同的Lambda表达式，你需要一套能够描述常见函数描述符的函数式接口。Java API中已经有了几个函数式接口，比如：Comparable、Runnable和Callable。

Java 8的库设计师帮你在java.util.function包中引入了几个新的函数式接口。我们接下来会介绍Predicate、Consumer和Function，

### Predicate

`java.util.function.Predicate<T>`接口定义了一个名叫test的抽象方法，它接受泛型T对象，并返回一个boolean。这恰恰和你先前创建的一样，现在就可以直接使用了。在你需要表示一个涉及类型T的布尔表达式时，就可以使用这个接口。比如，你可以定义一个接受String对象的Lambda表达式，如下所示。

```java
@FunctionalInterface 
public interface Predicate<T>{ 
 	boolean test(T t); 
} 

public static <T> List<T> filter(List<T> list, Predicate<T> p) { 
 	List<T> results = new ArrayList<>(); 
 	for(T s: list){ 
 		if(p.test(s)){ 
 			results.add(s); 
 		} 
 	} 
 	return results; 
} 

Predicate<String> nonEmptyStringPredicate = (String s) -> !s.isEmpty(); 
List<String> nonEmpty = filter(listOfStrings, nonEmptyStringPredicate);
```

如果你去查Predicate接口的Javadoc说明，可能会注意到诸如and和or等其他方法。

### Consumer

`java.util.function.Consumer<T>`定义了一个名叫accept的抽象方法，它接受泛型T的对象，没有返回（void）。你如果需要访问类型T的对象，并对其执行某些操作，就可以使用这个接口。比如，你可以用它来创建一个forEach方法，接受一个Integers的列表，并对其中每个元素执行操作。在下面的代码中，你就可以使用这个forEach方法，并配合Lambda来打印列表中的所有元素。

```java
@FunctionalInterface 
public interface Consumer<T>{ 
 	void accept(T t); 
} 

public static <T> void forEach(List<T> list, Consumer<T> c){
	for(T i: list){ 
 		c.accept(i); 
 	} 
} 

forEach( 
 Arrays.asList(1,2,3,4,5), 
 (Integer i) -> System.out.println(i)
);
```

### Function

`java.util.function.Function<T, R>`接口定义了一个叫作apply的方法，它接受一个泛型T的对象，并返回一个泛型R的对象。如果你需要定义一个Lambda，将输入对象的信息映射到输出，就可以使用这个接口（比如提取苹果的重量，或把字符串映射为它的长度）。在下面的代码中，我们向你展示如何利用它来创建一个map方法，以将一个String列表映射到包含每个String长度的Integer列表。

```java
@FunctionalInterface 
public interface Function<T, R>{ 
 R apply(T t); 
} 

public static <T, R> List<R> map(List<T> list, Function<T, R> f) { 
 	List<R> result = new ArrayList<>(); 
 	for(T s: list){ 
 		result.add(f.apply(s)); 
 	} 
 	return result; 
} 

// [7, 2, 6] 
List<Integer> l = map( 
 					Arrays.asList("lambdas","in","action"), 
 					(String s) -> s.length() 
);
```

> **原始类型特化**

我们介绍了三个泛型函数式接口：`Predicate<T>`、`Consumer<T>`和`Function<T,R>`。还有些函数式接口专为某些类型而设计。

回顾一下：Java类型要么是引用类型（比如Byte、Integer、Object、List），要么是原始类型（比如int、double、byte、char）。但是泛型（比如`Consumer<T>`中的T）只能绑定到引用类型。这是由泛型内部的实现方式造成的。①因此，在Java里有一个将原始类型转换为对应的引用类型的机制。这个机制叫作装箱（boxing）。相反的操作，也就是将引用类型转换为对应的原始类型，叫作拆箱（unboxing）。Java还有一个自动装箱机制来帮助程序员执行这一任务：装箱和拆箱操作是自动完成的。比如，这就是为什么下面的代码是有效的（一个int被装箱成为Integer）：

```java
List<Integer> list = new ArrayList<>(); 
for (int i = 300; i < 400; i++){ 
 	list.add(i); 
}
```

但这在性能方面是要付出代价的。装箱后的值本质上就是把原始类型包裹起来，并保存在堆里。因此，装箱后的值需要更多的内存，并需要额外的内存搜索来获取被包裹的原始值。

Java 8为我们前面所说的函数式接口带来了一个专门的版本，以便在输入和输出都是原始类型时避免自动装箱的操作。比如，在下面的代码中，使用**IntPredicate**就避免了对值1000进行装箱操作，但要是用`Predicate<Integer>`就会把参数1000装箱到一个Integer对象中：

```java
public interface IntPredicate{
 	boolean test(int t); 
} 

IntPredicate evenNumbers = (int i) -> i % 2 == 0; 
evenNumbers.test(1000); 	//true（无装箱）

Predicate<Integer> oddNumbers = (Integer i) -> i % 2 == 1;
oddNumbers.test(1000);		//false（装箱）
```

一般来说，针对专门的输入参数类型的函数式接口的名称都要加上对应的原始类型前缀，比如DoublePredicate、IntConsumer、LongBinaryOperator、IntFunction等。Function接口还有针对输出参数类型的变种：`ToIntFunction<T>`、IntToDoubleFunction等。

表3-2总结了Java API中提供的最常用的函数式接口及其函数描述符。请记得这只是一个起点。如果有需要，你可以自己设计一个。请记住，(T,U) -> R的表达方式展示了应当如何思考一个函数描述符。表的左侧代表了参数类型。这里它代表一个函数，具有两个参数，分别为泛型T和U，返回类型为R。

![image-20220329201943151](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220329201943151.png)

![image-20220329201955650](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220329201955650.png)

你现在已经看到了很多函数式接口，可以用于描述各种Lambda表达式的签名。为了检验你的理解程度，试试测验3.4。

> **测验3.4：函数式接口**

对于下列函数描述符（即Lambda表达式的签名），你会使用哪些函数式接口？在表3-2中可以找到大部分答案。作为进一步练习，请构造一个可以利用这些函数式接口的有效Lambda表达式：

1. T->R
2. (int, int)->int
3. T->void
4. ()->T
5. (T, U)->R

答案如下。

1. `Function<T,R>`不错。它一般用于将类型T的对象转换为类型R的对象（比如`Function<Apple, Integer>`用来提取苹果的重量）。
2. IntBinaryOperator具有唯一一个抽象方法，叫作applyAsInt，它代表的函数描述符是(int, int) -> int。
3. `Consumer<T>`具有唯一一个抽象方法叫作accept，代表的函数描述符是T -> void。
4. `Supplier<T>`具有唯一一个抽象方法叫作get，代表的函数描述符是()-> T。或者，`Callable<T>`具有唯一一个抽象方法叫作call，代表的函数描述符是() -> T。
5. `BiFunction<T, U, R>`具有唯一一个抽象方法叫作apply，代表的函数描述符是(T,U) -> R。

为了总结关于函数式接口和Lambda的讨论，表3-3总结了一些使用案例、Lambda的例子，以及可以使用的函数式接口。

![image-20220330164707738](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220330164707738.png)

> **异常、Lambda，还有函数式接口又是怎么回事呢？**

请注意，任何函数式接口都不允许抛出**受检异常（checked exception）**。如果你需要Lambda表达式来抛出异常，有两种办法：定义一个自己的函数式接口，并声明受检异常，或者把Lambda包在一个try/catch块中。

比如，先前我们介绍了一个新的函数式接口BufferedReaderProcessor，它显式声明了一个IOException：

```java
@FunctionalInterface 
public interface BufferedReaderProcessor { 
 	String process(BufferedReader b) throws IOException; 
} 
BufferedReaderProcessor p = (BufferedReader br) -> br.readLine();
```

但是你可能是在使用一个接受函数式接口的API，比如`Function<T, R>`，没有办法自己创建一个（你会在下一章看到，Stream API中大量使用表3-2中的函数式接口）。这种情况下，你可以显式捕捉受检异常：

```java
Function<BufferedReader, String> f = (BufferedReader b) -> { 
 try { 
 	return b.readLine(); 
 } 
 catch(IOException e) { 
 	throw new RuntimeException(e); 
 } 
};
```

现在你知道如何创建Lambda，在哪里以及如何使用它们了。接下来我们会介绍一些更高级的细节：编译器如何对Lambda做类型检查，以及你应当了解的规则，诸如Lambda在自身内部引用局部变量，还有和void兼容的Lambda等。你无需立即就充分理解下一节的内容，可以留待日后再看。

---

## 类型检查、类型推断以及限制

