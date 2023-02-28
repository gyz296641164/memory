---
title: 第10章-用Optional取代null
category:
  - JAVA
tag: 
  - JAVA8
date: 2023-02-28
---

<!-- more -->

# 用Optional取代null

本章内容

- null引用引发的问题，以及为什么要避免null引用
- 从null到Optional：以null安全的方式重写你的域模型
- 让Optional发光发热： 去除代码中对null的检查
- 读取Optional中可能值的几种方法
- 对可能缺失值的再思考

[参考文章：JAVA8之妙用Optional解决判断Null为空问题](https://mp.weixin.qq.com/s/xym7J33x3tiY5ipSM9WvIA)

---

# 如何为缺失的值建模

假设你需要处理下面这样的嵌套对象，这是一个拥有汽车及汽车保险的客户。

> 代码清单10-1 Person/Car/Insurance的数据模型

```java
public class Person { 
 private Car car; 
 public Car getCar() { return car; } 
} 
public class Car { 
 private Insurance insurance; 
 public Insurance getInsurance() { return insurance; } 
} 
public class Insurance { 
 private String name; 
 public String getName() { return name; } 
}
```

那么，下面这段代码存在怎样的问题呢？

```java
public String getCarInsuranceName(Person person) { 
  return person.getCar().getInsurance().getName(); 
}
```

这段代码看起来相当正常，但是现实生活中很多人没有车。所以调用getCar方法的结果会怎样呢？在实践中，一种比较常见的做法是返回一个null引用，表示该值的缺失，即用户没有车。而接下来，对getInsurance的调用会返回null引用的insurance，这会导致运行时出现一个NullPointerException，终止程序的运行。但这还不是全部。如果返回的person值为null会怎样？如果getInsurance的返回值也是null，结果又会怎样？

## 采用防御式检查减少 NullPointerException

怎样做才能避免这种不期而至的NullPointerException呢？通常，你可以在需要的地方添加null的检查（过于激进的防御式检查甚至会在不太需要的地方添加检测代码），并且添加的方式往往各有不同。下面这个例子是我们试图在方法中避免NullPointerException的第一次尝试。

> 代码清单10-2 null-安全的第一种尝试：深层质疑

```java
    public String getCarInsuranceName(Person person) {
        if (person != null) {				
            Car car = person.getCar();
            if (car != null) {			//每个null检查都会增加调用链上剩余代码的嵌套层数
                Insurance insurance = car.getInsurance();
                if (insurance != null) {
                    return insurance.getName();
                }
            }
        }
        return "Unknown";
    }
```

这个方法每次引用一个变量都会做一次null检查，如果引用链上的任何一个遍历的解变量值为null，它就返回一个值为“Unknown”的字符串。唯一的例外是保险公司的名字，你不需要对它进行检查，原因很简单，因为任何一家公司必定有个名字。注意到了吗，由于你掌握业务领域的知识，避免了最后这个检查，但这并不会直接反映在你建模数据的Java类之中。

我们将代码清单10-2标记为“深层质疑”，原因是它不断重复着一种模式：每次你不确定一个变量是否为null时，都需要添加一个进一步嵌套的if块，也增加了代码缩进的层数。

下面的代码清单中，我们试图通过一种不同的方式避免这种问题。

> 代码清单10-3 null-安全的第二种尝试：过多的退出语句

```java
    public String getCarInsuranceName(Person person) {
        if (person == null) {	//每个null检查都会添加新的退出点
            return "Unknown";
        }
        Car car = person.getCar();
        if (car == null) {
            return "Unknown";
        }
        Insurance insurance = car.getInsurance();
        if (insurance == null) {
            return "Unknown";
        }
        return insurance.getName();
    }
```

这种流程是极易出错的；如果你忘记检查了那个可能为null的属性会怎样？通过这一章的学习，你会了解使用null来表示变量值的缺失是大错特错的。你需要更优雅的方式来对缺失的变量值建模。

## null 带来的种种问题

在Java程序开发中使用null会带来理论和实际操作上的种种问题。

- 它是错误之源。

  NullPointerException是目前Java程序开发中最典型的异常。

- 它会使你的代码膨胀。
  它让你的代码充斥着深度嵌套的null检查，代码的可读性糟糕透顶。

- 它自身是毫无意义的。
  null自身没有任何的语义，尤其是，它代表的是在静态类型语言中以一种错误的方式对缺失变量值的建模。

- 它破坏了Java的哲学。
  Java一直试图避免让程序员意识到指针的存在，唯一的例外是：null指针。

- 它在Java的类型系统上开了个口子。
  null并不属于任何类型，这意味着它可以被赋值给任意引用类型的变量。这会导致问题，原因是当这个变量被传递到系统中的另一个部分后，你将无法获知这个null变量最初的赋值到底是什么类型。

## 其他语言中 null 的替代品

近年来出现的语言，比如Groovy，通过引入**安全导航操作符**（Safe Navigation Operator，标记为**?**）可以安全访问可能为null的变量。为了理解它是如何工作的，让我们看看下面这段Groovy代码，它的功能是获取某个用户替他的车保险的保险公司的名称：

```
def carInsuranceName = person?.car?.insurance?.name
```

这段代码的表述相当清晰。person对象可能没有car对象，你试图通过赋一个null给Person对象的car引用，对这种可能性建模。类似地，car也可能没有insurance。Groovy的安全导航操作符能够避免在访问这些可能为null引用的变量时抛出NullPointerException，在调用链中的变量遭遇null时将null引用沿着调用链传递下去，返回一个null。

你可能会疑惑：“那么Java 8提供了什么呢？”嗯，实际上Java 8从“optional值”的想法中吸取了灵感，引入了一个名为`java.util.Optional<T>`的新的类。这一章里，我们会展示使用这种方式对可能缺失的值建模，而不是直接将null赋值给变量所带来的好处。我们还会阐释从null到Optional的迁移，你需要反思的是：如何在你的域模型中使用optional值。

---

# Optional 类入门

汲取Haskell和Scala的灵感，Java 8中引入了一个新的类`java.util.Optional<T>`。这是一个封装Optional值的类。举例来说，使用新的类意味着，如果你知道一个人可能有也可能没有车，那么Person类内部的car变量就不应该声明为Car，遭遇某人没有车时把null引用赋值给它，而是应该像图10-1那样直接将其声明为`Optional<Car>`类型。

![image-20220507111626733](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220507111626733.png)

变量存在时，Optional类只是对类简单封装。变量不存在时，缺失的值会被建模成一个“空”的Optional对象，由方法Optional.empty()返回。Optional.empty()方法是一个静态工厂方法，它返回Optional类的特定单一实例。你可能还有疑惑，null引用和Optional.empty()有什么本质的区别吗？从语义上，你可以把它们当作一回事儿，但是实际中它们之间的差别非常大：如果你尝试解引用一个 null ，一定会触发 NullPointerException ，不过使用Optional.empty()就完全没事儿，它是Optional类的一个有效对象，多种场景都能调用，非常有用。关于这一点，接下来的部分会详细介绍。

使用Optional而不是null的一个非常重要而又实际的语义区别是，第一个例子中，我们在声明变量时使用的是`Optional<Car>`类型，而不是Car类型，这句声明非常清楚地表明了这里发生变量缺失是允许的。与此相反，使用Car这样的类型，可能将变量赋值为null，这意味着你需要独立面对这些，你只能依赖你对业务模型的理解，判断一个null是否属于该变量的有效范畴。

牢记上面这些原则，你现在可以使用Optional类对代码清单10-1中最初的代码进行重构，结果如下。

> 代码清单10-4 使用Optional重新定义Person/Car/Insurance的数据模型

```java
public class Person { 
 	private Optional<Car> car; 	//人可能有车，也可能没有车，因此将这个字段声明为Optional
 	public Optional<Car> getCar() { return car; } 
}
public class Car { 
 	private Optional<Insurance> insurance; 	//车可能进行了保险，也可能没有保险，所以将这个字段声明为Optional
 	public Optional<Insurance> getInsurance() { return insurance; } 
} 
public class Insurance { 
 	private String name; 	//保险公司必须有名字
 	public String getName() { return name; }
}
```

发现Optional是如何丰富你模型的语义了吧。代码中person引用的是`Optional<Car>`， 而car引用的是`Optional<Insurance>`，这种方式非常清晰地表达了你的模型中一个person可能拥有也可能没有car的情形，同样，car可能进行了保险，也可能没有保险。

与此同时，我们看到insurance公司的名称被声明成String类型，而不是`Optional<String>`，这非常清楚地表明声明为insurance公司的类型必须提供公司名称。使用这种方式，一旦解引用insurance公司名称时发生NullPointerException，你就能非常确定地知道出错的原因，不再需要为其添加null的检查，因为**null的检查只会掩盖问题，并未真正地修复问题**。

另外，我们还想特别强调，引入Optional类的意图并非要消除每一个null引用。与此相反，它的目标是帮助你更好地设计出普适的API，让程序员看到方法签名，就能了解它是否接受一个Optional的值。这种强制会让你更积极地将变量从Optional中解包出来，直面缺失的变量值。

---

# 应用 Optional 的几种模式

我们该如何使用Optional呢？用这种方式能做什么，或者怎样使用Optional封装的值呢？

## 创建 Optional 对象

完成这一任务有多种方法。

1. 声明一个空的Optional

   你可以通过静态工厂方法Optional.empty，创建一个空的Optional对象：

   ```
   Optional<Car> optCar = Optional.empty();
   ```

2. 依据一个非空值创建Optional

   你还可以使用静态工厂方法Optional.of，依据一个非空值创建一个Optional对象：

   ```
   Optional<Car> optCar = Optional.of(car);
   ```

   如果car是一个null，这段代码会立即抛出一个NullPointerException，而不是等到你试图访问car的属性值时才返回一个错误。

3. 可接受null的Optional

   最后，使用静态工厂方法Optional.ofNullable，你可以创建一个允许null值的Optional对象：

   ```
   Optional<Car> optCar = Optional.ofNullable(car);
   ```

   如果car是null，那么得到的Optional对象就是个空对象。

Optional提供了一个get方法获取变量中的值。不过get方法在遭遇到空的Optional对象时也会抛出异常，所以不按照约定的方式使用它，又会让我们再度陷入由null引起的代码维护的梦魇。因此，我们首先从无需显式检查的Optional值的使用入手，这些方法与Stream中的某些操作极其相似。

## 使用 map 从 Optional 对象中提取和转换值

从对象中提取信息是一种比较常见的模式。比如，你可能想要从insurance公司对象中提取公司的名称。提取名称之前，你需要检查insurance对象是否为null，代码如下所示：

```java
String name = null; 
if(insurance != null){ 
 	name = insurance.getName(); 
}
```

为了支持这种模式，Optional提供了一个map方法。它的工作方式如下（这里，我们继续借用了代码清单10-4的模式）：

```java
Optional<Insurance> optInsurance = Optional.ofNullable(insurance); 
Optional<String> name = optInsurance.map(Insurance::getName);
```

从概念上，这与流的map方法相差无几。map操作会将提供的函数应用于流的每个元素。你可以把Optional对象看成一种特殊的集合数据，它至多包含一个元素。如果Optional包含一个值，那函数就将该值作为参数传递给map，对该值进行转换。如果Optional为空，就什么也不做。图10-2对这种相似性进行了说明，展示了把一个将正方形转换为三角形的函数，分别传递给正方形和Optional正方形流的map方法之后的结果。

![image-20220507145328796](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220507145328796.png)

这看起来挺有用，但是你怎样才能应用起来，重构之前的代码呢？前文的代码里用安全的方式链接了多个方法。

```java
public String getCarInsuranceName(Person person) { 
 	return person.getCar().getInsurance().getName(); 
}
```

为了达到这个目的，我们需要求助Optional提供的另一个方法**flatMap**。

## 使用 flatMap 链接 Optional 对象

你的第一反应可能是我们可以利用map重写之前的代码，如下所示：

```java
Optional<Person> optPerson = Optional.of(person); 
Optional<String> name = 
 	optPerson.map(Person::getCar) 
 			.map(Car::getInsurance) 
 			.map(Insurance::getName);
```

不幸的是，这段代码无法通过编译。

- optPerson是`Optional<Person>`类型的变量， 调用map方法应该没有问题。
- 但getCar返回的是一个`Optional<Car>`类型的对象（如代码清单10-4所示），这意味着map操作的结果是一个`Optional<Optional<Car>>`类型的对象。
- 因此，它对getInsurance的调用是非法的，因为最外层的optional对象包含了另一个optional对象的值，而它当然不会支持getInsurance方法。

图10-3说明了你会遭遇的嵌套式optional结构。

![image-20220507150144581](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220507150144581.png)

我们该如何解决这个问题呢？

[flatMap方法](https://gitee.com/LastedMemory/study-notes/blob/master/JAVASE/JAVA8/%E7%AC%AC%E4%BA%8C%E9%83%A8%E5%88%86%20%E5%87%BD%E6%95%B0%E5%BC%8F%E6%95%B0%E6%8D%AE%E5%A4%84%E7%90%86/%E7%AC%AC5%E7%AB%A0%20%E4%BD%BF%E7%94%A8%E6%B5%81.md#%E6%98%A0%E5%B0%84map--flatmap)。由方法生成的各个流会被合并或者扁平化为一个单一的流。这里你希望的结果其实也是类似的，但是你想要的是将两层的optional合并为一个。

跟图10-2类似，我们借助图10-4来说明flatMap方法在Stream和Optional类之间的相似性。

![image-20220507150426031](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220507150426031.png)

这个例子中，传递给流的flatMap方法会将每个正方形转换为另一个流中的两个三角形。那么，map操作的结果就包含有三个新的流，每一个流包含两个三角形，但flatMap方法会将这种两层的流合并为一个包含六个三角形的单一流。类似地，传递给optional的flatMap方法的函数会将原始包含正方形的optional对象转换为包含三角形的optional对象。如果将该方法传递给map方法，结果会是一个Optional对象，而这个Optional对象中包含了三角形；但flatMap方法会将这种两层的Optional对象转换为包含三角形的单一Optional对象。

**1、使用Optional获取car的保险公司名称**

代码清单10-2和代码清单10-3的示例用基于Optional的数据模式重写之后，如代码清单10-5所示。

```java
    public String getCarInsuranceName(Optional<Person> person) {
        return person.flatMap(Person::getCar)
                     .flatMap(Car::getInsurance)
                     .map(Insurance::getName)
                     .orElse("Unknown");		//如果Optional的结果值为空，设置默认值
    }
```

通过比较代码清单10-5和之前的两个代码清单，我们可以看到，处理潜在可能缺失的值时，使用Optional具有明显的优势。这一次，你可以用非常容易却又普适的方法实现之前你期望的效果——不再需要使用那么多的条件分支，也不会增加代码的复杂性。

**2、使用Optional解引用串接的Person/Car/Insurance对象**

由`Optional<Person>`对象，我们可以结合使用之前介绍的map和flatMap方法，从Person中解引用出Car，从Car中解引用出Insurance，从Insurance对象中解引用出包含insurance公司名称的字符串。图10-5对这种流水线式的操作进行了说明。

![image-20220507151431620](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220507151431620.png)

这里，我们从以Optional封装的Person入手，对其调用flatMap(Person::getCar)。如前所述，这种调用逻辑上可以划分为两步。

- 第一步，某个Function作为参数，被传递给由Optional封装的Person对象，对其进行转换。这个场景中，Function的具体表现是一个方法引用，即对Person对象的getCar方法进行调用。由于该方法返回一个`Optional<Car>`类型的对象，Optional内的Person也被转换成了这种对象的实例，结果就是一个两层的Optional对象，最终它们会被flagMap操作合并。
  - 从纯理论的角度而言，你可以将这种合并操作简单地看成把两个Optional对象结合在一起，如果其中有一个对象为空，就构成一个空的Optional对象。如果你对一个空的Optional对象调用flatMap，实际情况又会如何呢？结果不会发生任何改变，返回值也是个空的Optional对象。
  - 与此相反，如果Optional封装了一个Person对象，传递给flapMap的Function，就会应用到Person上对其进行处理。这个例子中，由于Function的返回值已经是一个Optional对象，flapMap方法就直接将其返回。
- 第二步与第一步大同小异，它会将`Optional<Car>`转换为`Optional<Insurance>`。第三步则会将`Optional<Insurance>`转化为`Optional<String>`对象，由于Insurance.getName()方法的返回类型为String，这里就不再需要进行flapMap操作了。

还有很多其他的方法可以为Optional设定默认值，或者解析出Optional代表的值。接下来我们会对此做进一步的探讨。

> **在域模型中使用Optional，以及为什么它们无法序列化**

在代码清单10-4中，我们展示了如何在你的域模型中使用Optional，将允许缺失或者暂无定义的变量值用特殊的形式标记出来。然而，Optional类设计者的初衷并非如此，他们构思时怀揣的是另一个用例。

由于Optional类设计时就没特别考虑将其作为类的字段使用，所以它也并未实现Serializable接口。由于这个原因，如果你的应用使用了某些要求序列化的库或者框架，在域模型中使用Optional，有可能引发应用程序故障。然而，我们相信，通过前面的介绍，你已经看到用Optional声明域模型中的某些类型是个不错的主意，尤其是你需要遍历有可能全部或部分为空，或者可能不存在的对象时。如果你一定要实现序列化的域模型，作为替代方案，我们建议你像下面这个例子那样，提供一个能访问声明为Optional、变量值可能缺失的接口，

代码清单如下：

```java
public class Person { 
 	private Car car; 
 	public Optional<Car> getCarAsOptional() { 
 		return Optional.ofNullable(car); 
 	} 
}
```

## 默认行为及解引用 Optional 对象

我们决定采用**orElse**方法读取这个变量的值，使用这种方式你还可以定义一个默认值，遭遇空的Optional变量时，默认值会作为该方法的调用返回值。Optional类提供了多种方法读取Optional实例中的变量值。

- `get()`是这些方法中最简单但又最不安全的方法。如果变量存在，它直接返回封装的变量值，否则就抛出一个NoSuchElementException异常。所以，除非你非常确定Optional变量一定包含值，否则使用这个方法是个相当糟糕的主意。此外，这种方式即便相对于嵌套式的null检查，也并未体现出多大的改进。
- `orElse(T other)`是我们在代码清单10-5中使用的方法，正如之前提到的，它允许你在Optional对象不包含值时提供一个默认值。
- `orElseGet(Supplier<? extends T> other)`是orElse方法的延迟调用版，Supplier方法只有在Optional对象不含值时才执行调用。如果创建默认值是件耗时费力的工作，你应该考虑采用这种方式（借此提升程序的性能），或者你需要非常确定某个方法仅在Optional为空时才进行调用，也可以考虑该方式（这种情况有严格的限制条件）。
- `orElseThrow(Supplier<? extends X> exceptionSupplier)`和get方法非常类似，它们遭遇Optional对象为空时都会抛出一个异常，但是使用orElseThrow你可以定制希望抛出的异常类型。
- `ifPresent(Consumer<? super T>)`让你能在变量值存在时执行一个作为参数传入的方法，否则就不进行任何操作。

Optional类和Stream接口的相似之处，远不止map和flatMap这两个方法。还有第三个方法filter，它的行为在两种类型之间也极其相似。

## 两个 Optional 对象的组合

现在，我们假设你有这样一个方法，它接受一个Person和一个Car对象，并以此为条件对外部提供的服务进行查询，通过一些复杂的业务逻辑，试图找到满足该组合的最便宜的保险公司：

```java
public Insurance findCheapestInsurance(Person person, Car car) { 
 	// 不同的保险公司提供的查询服务
 	// 对比所有数据
 	return cheapestCompany; 
}
```

我们还假设你想要该方法的一个null-安全的版本，它接受两个Optional对象作为参数，返回值是一个`Optional<Insurance>`对象，如果传入的任何一个参数值为空，它的返回值亦为空。Optional类还提供了一个isPresent方法，如果Optional对象包含值，该方法就返回true，所以你的第一想法可能是通过下面这种方式实现该方法：

```java
public Optional<Insurance> nullSafeFindCheapestInsurance( Optional<Person> person, Optional<Car> car) { 
 	if (person.isPresent() && car.isPresent()) {
 		return Optional.of(findCheapestInsurance(person.get(), car.get())); 
 	} else { 
 		return Optional.empty(); 
 	} 
}
```

这个方法具有明显的优势，我们从它的签名就能非常清楚地知道无论是person还是car，它的值都有可能为空，出现这种情况时，方法的返回值也不会包含任何值。不幸的是，该方法的具体实现和你之前曾经实现的null检查太相似了：方法接受一个Person和一个Car对象作为参数，而二者都有可能为null。利用Optional类提供的特性，找到更优雅的解决方案。

> **测验10.1：以不解包的方式组合两个Optional对象**

用一行语句重新实现之前出现的nullSafeFindCheapestInsurance()方法。

答案：你可以像使用三元操作符那样，无需任何条件判断的结构，以一行语句实现该方法，代码如下。

```java
public Optional<Insurance> nullSafeFindCheapestInsurance( Optional<Person> person, Optional<Car> car) { 
 	return person.flatMap(p -> car.map(c -> findCheapestInsurance(p, c))); 
}
```

这段代码中，你对第一个Optional对象调用flatMap方法，如果它是个空值，传递给它的Lambda表达式不会执行，这次调用会直接返回一个空的Optional对象。反之，如果person对象存在，这次调用就会将其作为函数Function的输入，并按照与flatMap方法的约定返回一个`Optional<Insurance>`对象。这个函数的函数体会对第二个Optional对象执行map操作，如果第二个对象不包含car，函数Function就返回一个空的Optional对象，整个nullSafeFindCheapestInsuranc方法的返回值也是一个空的Optional对象。最后，如果person和car对象都存在，作为参数传递给map方法的Lambda表达式能够使用这两个值安全地调用原始的findCheapestInsurance方法，完成期望的操作。

Optional类和Stream接口的相似之处远不止map和flatMap这两个方法。还有第三个方法filter，它的行为在两种类型之间也极其相似。

## 使用 filter 剔除特定的值

你经常需要调用某个对象的方法，查看它的某些属性。比如，你可能需要检查保险公司的名称是否为“Cambridge-Insurance”。为了以一种安全的方式进行这些操作，你首先需要确定引用指向的Insurance对象是否为null，之后再调用它的getName方法，如下所示：

```java
Insurance insurance = ...; 
if(insurance != null && "CambridgeInsurance".equals(insurance.getName())){ 
  System.out.println("ok");
} 
```

使用Optional对象的filter方法，这段代码可以重构如下：

```java
Optional<Insurance> optInsurance = ...; 
optInsurance.filter(insurance -> 
 					"CambridgeInsurance".equals(insurance.getName())) 
 			.ifPresent(x -> System.out.println("ok"));
```

filter方法接受一个谓词作为参数。如果Optional对象的值存在，并且它符合谓词的条件，filter方法就返回其值；否则它就返回一个空的Optional对象。

如果Optional对象为空，它不做任何操作，反之，它就对Optional对象中包含的值施加谓词操作。如果该操作的结果为true，它不做任何改变，直接返回该Optional对象，否则就将该值过滤掉，将Optional的值置空。

> **测验10.2：对Optional对象进行过滤**

假设在我们的Person/Car/Insurance 模型中，Person还提供了一个方法可以取得Person对象的年龄，请使用下面的签名改写代码清单10-5中的getCarInsuranceName方法：

```
public String getCarInsuranceName(Optional<Person> person, int minAge)
```

找出年龄大于或者等于minAge参数的Person所对应的保险公司列表。

答案：你可以对Optional封装的Person对象进行filter操作，设置相应的条件谓词，即如果person的年龄大于minAge参数的设定值，就返回该值，并将谓词传递给filter方法，代码如下所示。

```java
public String getCarInsuranceName(Optional<Person> person, int minAge) { 
 	return person.filter(p -> p.getAge() >= minAge) 
 				.flatMap(Person::getCar) 
 				.flatMap(Car::getInsurance) 
 				.map(Insurance::getName) 
 				.orElse("Unknown"); 
}
```

表10-1对Optional类中的方法进行了分类和概括。

![image-20220507171612333](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220507171612333.png)

![image-20220507171621352](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/JAVA8/image-20220507171621352.png)

---

# 使用 Optional 的实战示例

## 用 Optional 封装可能为 null 的值

我们接着用Map做例子，假设你有一个Map<String, Object>方法，访问由key索引的值时，如果map中没有与key关联的值，该次调用就会返回一个null。

```
Object value = map.get("key");
```

使用Optional封装map的返回值，你可以对这段代码进行优化。要达到这个目的有两种方式：你可以使用笨拙的if-then-else判断语句，毫无疑问这种方式会增加代码的复杂度；或者你可以采用我们前文介绍的Optional.ofNullable方法：

```
Optional<Object> value = Optional.ofNullable(map.get("key"));
```

每次你希望安全地对潜在为null的对象进行转换，将其替换为Optional对象时，都可以考虑使用这种方法。

## 异常与 Optional 的对比

由于某种原因，函数无法返回某个值，这时除了返回null，Java API比较常见的替代做法是抛出一个异常。这种情况比较典型的例子是使用静态方法Integer.parseInt(String)，将String转换为int。在这个例子中，如果String无法解析到对应的整型，该方法就抛出一个NumberFormatException。最后的效果是，发生String无法转换为int时，代码发出一个遭遇非法参数的信号，唯一的不同是，这次你需要使用try/catch 语句，而不是使用if条件判断来控制一个变量的值是否非空。

你也可以用空的Optional对象，对遭遇无法转换的String时返回的非法值进行建模，这时你期望parseInt的返回值是一个optional。我们无法修改最初的Java方法，但是这无碍我们进行需要的改进，你可以实现一个工具方法，将这部分逻辑封装于其中，最终返回一个我们希望的Optional对象，代码如下所示。

> **代码清单10-6 将String转换为Integer，并返回一个Optional对象**

```java
public static Optional<Integer> stringToInt(String s) { 
 try { 
 	return Optional.of(Integer.parseInt(s)); 	//如果String能转换为对应的Integer，将其封装在Optioal对象中返回
 } catch (NumberFormatException e) {
 	return Optional.empty(); 	//否则返回一个空的Optional对象
 } 
}
```

我们的建议是，你可以将多个类似的方法封装到一个工具类中，让我们称之为OptionalUtility。通过这种方式，你以后就能直接调用**OptionalUtility.stringToInt**方法，将String转换为一个`Optional<Integer>`对象，而不再需要记得你在其中封装了笨拙的try/catch的逻辑了。

**基础类型的Optional对象，以及为什么应该避免使用它们**

不知道你注意到了没有，与 Stream对象一样，Optional也提供了类似的基础类型——OptionalInt、OptionalLong以及OptionalDouble——所以代码清单10-6中的方法可以不返回`Optional<Integer>`，而是直接返回一个OptionalInt类型的对象。第5章中，我们讨论过使用基础类型Stream的场景，尤其是如果Stream对象包含了大量元素，出于性能的考量，使用基础类型是不错的选择，但对Optional对象而言，这个理由就不成立了，因为Optional对象最多只包含一个值。

我们不推荐大家使用基础类型的Optional，因为基础类型的Optional不支持map、flatMap以及filter方法，而这些却是Optional类最有用的方法（正如我们在10.2节所看到的那样）。此外，与Stream一样，Optional对象无法由基础类型的Optional组合构成，所以，举例而言，如果代码清单10-6中返回的是OptionalInt类型的对象，你就不能将其作为方法引用传递给另一个Optional对象的flatMap方法。

## 把所有内容整合起来

为了展示之前介绍过的Optional类的各种方法整合在一起的威力，我们假设你需要向你的程序传递一些属性。为了举例以及测试你开发的代码，你创建了一些示例属性，如下所示：

```
Properties props = new Properties(); 
props.setProperty("a", "5"); 
props.setProperty("b", "true"); 
props.setProperty("c", "-3");
```

现在，我们假设你的程序需要从这些属性中读取一个值，该值是以秒为单位计量的一段时间。由于一段时间必须是正数，你想要该方法符合下面的签名：

```
public int readDuration(Properties props, String name)
```

即，如果给定属性对应的值是一个代表正整数的字符串，就返回该整数值，任何其他的情况都返回0。为了明确这些需求，你可以采用JUnit的断言，将它们形式化：

```
assertEquals(5, readDuration(param, "a")); 
assertEquals(0, readDuration(param, "b")); 
assertEquals(0, readDuration(param, "c")); 
assertEquals(0, readDuration(param, "d"));
```

这些断言反映了初始的需求：如果属性是a，readDuration方法返回5，因为该属性对应的字符串能映射到一个正数；对于属性b，方法的返回值是0，因为它对应的值不是一个数字；对于c，方法的返回值是0，因为虽然它对应的值是个数字，不过它是个负数；对于d，方法的返回值是0，因为并不存在该名称对应的属性。让我们以命令式编程的方式实现满足这些需求的方法，代码清单如下所示。

> **代码清单10-7 以命令式编程的方式从属性中读取duration值**

```java
public int readDuration(Properties props, String name) { 
 	String value = props.getProperty(name); 
 	if (value != null) { 
 	try { 
 		int i = Integer.parseInt(value); 
 		if (i > 0) { 
 			return i; 
 		} 
 	} catch (NumberFormatException nfe) { }
 } 
 	return 0; 
}
```

你可能已经预见，最终的实现既复杂又不具备可读性，呈现为多个由if语句及try/catch块儿构成的嵌套条件。花几分钟时间思考一下测验10.3，想想怎样使用本章内容实现同样的效果。

> **测验10.3：使用Optional从属性中读取duration**

请尝试使用Optional类提供的特性及代码清单10-6中提供的工具方法，通过一条精炼的语句重构代码清单10-7中的方法。

答案：如果需要访问的属性值不存在，Properties.getProperty(String)方法的返回值就是一个null，使用ofNullable工厂方法非常轻易地就能把该值转换为Optional对象。接着，你可以向它的flatMap方法传递代码清单10-6中实现的OptionalUtility.stringToInt方法的引用，将`Optional<String>`转换为`Optional<Integer>`。最后，你非常轻易地就可以过滤掉负数。这种方式下，如果任何一个操作返回一个空的Optional对象，该方法都会返回orElse方法设置的默认值0；否则就返回封装在Optional对象中的正整数。下面就是这段简化的实现：

```java
public int readDuration(Properties props, String name) { 
 	return Optional.ofNullable(props.getProperty(name)) 
 					.flatMap(OptionalUtility::stringToInt) 
 					.filter(i -> i > 0) 
 					.orElse(0); 
}
```

注意到使用Optional和Stream时的那些通用模式了吗？它们都是对数据库查询过程的反思，查询时，多种操作会被串接在一起执行。

---

# 小结

这一章中，你学到了以下的内容。

- null引用在历史上被引入到程序设计语言中，目的是为了表示变量值的缺失。
- Java 8中引入了一个新的类`java.util.Optional<T>`，对存在或缺失的变量值进行建模。
- 你可以使用静态工厂方法Optional.empty、Optional.of以及Optional.ofNullable创建Optional对象。
- Optional类支持多种方法，比如map、flatMap、filter，它们在概念上与Stream类中对应的方法十分相似。
- 使用Optional会迫使你更积极地解引用Optional对象，以应对变量值缺失的问题，最终，你能更有效地防止代码中出现不期而至的空指针异常。
- 使用Optional能帮助你设计更好的API，用户只需要阅读方法签名，就能了解该方法是否接受一个Optional类型的值。