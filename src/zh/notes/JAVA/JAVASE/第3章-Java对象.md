---
title: 第3章_Java对象
category:
  - JAVA
tag: 
  - JAVASE
date: 2023-03-03
---

<!-- more -->

## 1、Object类

Java中的所有类都默认继承自一个类，那就是java.lang.Object类，是所有类的超类，即使在写代码时没有明确指定，也会默认继承这个类。

Object类中定义了以下几个方法：

- wait()：使当前线程进入等待状态，直到另一个线程调用此对象的notify()方法/notifyAll()方法
- notify()：唤醒正在等待这个对象的监视所的单个线程
- notifyAll()：唤醒正在等待这个对象的监视器的所有线程
- clone()：创建并返回此对象的副本
- equals(Object obj)：指示其他对象是否“等于”此对象
- toString()：返回对象的字符串表示形式
- finalize()：当垃圾回收器决定回收某对象时，就会运行该对象的finalize()方法

---

## 2、JavaBean

我们可以把JavaBean称为一种标准，只要符合这个标准定义出来的类都叫JavaBean。这个标准主要有以下几个条件：

- 所有属性都是private
- 提供默认的构造函数
- 提供一系列setter和getter方法
- 实现Serializable接口

**getter和setter**

根据JavaBeans Specification规定，如果是普通的参数propertyName，则要以以下方式定义其setter/getter：

`public <PropertyType> get<PropertyName>();`

`public void set<PropertyName>(<PropertyType> a)`

**为什么使用success和而不是isSuccess**

发生序列化时可能导致参数转换异常。在定义一个布尔类型的JavaBean时，应该使用success这样的命名方式，而不是isSuccess。

---

## 3、equals和hashCode关系

**在没有重写equals方法的情况下，使用equals作比较，判断的是两个对象的引用是否相等**

```java
public class EqualsTest {
	public static void main(String[] args) {
		Person person1 = new Person("Hollis");
		Person person2 = new Person("Hollis");
		Person person3 = person1;
		System.out.println("person1 == person2 ? " + (person1.equals(person2)));
		System.out.println("person1 == person3 ? " + (person1.equals(person3)));
	}
}
class Person {
	private String name;
	public Person(String name) {
		this.name = name;
	}
}
```

以上代码输出结果为：

person1 == person2 ? false
person1 == person3 ? true

**如果要判断两个对象的内容是否相等，则需要重写equals()和hashCode()方法，例如：**

```java
public class EqualsTest {
	public static void main(String[] args) {
		Person person1 = new Person("Hollis");
		Person person2 = new Person("Hollis");
		Person person3 = person1;
		System.out.println("person1 == person2 ? " + (person1.equals(person2)));
		System.out.println("person1 == person3 ? " + (person1.equals(person3)));
	}
}
class Person {
	private String name;
	public Person(String name) {
		this.name = name;
	}
	@Override
	    public Boolean equals(Object o) {
		if (this == o) {
			return true;
		}
		if (o == null || getClass() != o.getClass()) {
			return false;
		}
		Person person = (Person) o;
		return Objects.equals(name, person.name);
	}
}
```

以上代码输出结果为：

person1 == person2 ? true
person1 == person3 ? true

因为我们重写了Person类的equals方法，比较其中的name值是否一致。

**equals的多种写法**

其实，在实现equals方法时，有很多种方式。我们以Person类为例，使用多种方式实现equals方法。

第一种，IDEA中默认的实现方式：

```java
@Override
public boolean equals(Object o) {
    if (this == o) {
        return true;
    }
    if (o == null || getClass() != o.getClass()) {
        return false;
    }
    Person person = (Person) o;
    return name != null ? name.equals(person.name) : person.name == null;
}
```

第二种，基于`java.util.Objects#equals`，也就是前面我们介绍过得实现方式。

第三种，基于Apache Commons Lang框架的实现方式：

```java
@Override
public boolean equals(Object o) {
    if (this == o) {
        return true;
    }
    if (o == null || getClass() != o.getClass()) {
        return false;
    }
    Person person = (Person) o;
    return new EqualsBuilder()
            .append(name,person.name)
            .isEquals();
}
 
```
第四种，基于Guava框架的实现方式：
```java
@Override
public boolean equals(Object o) {
    if (this == o) {
        return true;
    }
    if (o == null || getClass() != o.getClass()) {
        return false;
    }
    Person person = (Person) o;
    return Objects.equals(name, person.name);
}
 
```

**equals和hashCode**

两个对象相等的严格定义是：对象内容相等（`equals()`的结果），并且哈希值也要相等(hashCode的结果)。

hashCode()方法也是Object类中定义的方法，作用是返回对象的哈希值，返回值类型是int。这个哈希值的作用是确定该对象在哈希表中的位置。
如果一个类，只重写了equals方法，而没有重写hashCode方法，那么会发生什么问题呢？例如：

```java
 public class EqualsTest {
    public static void main(String[] args) {
        Person person1 = new Person("Hollis");
        Person person2 = new Person("Hollis");
        HashSet<Person> set = new HashSet<>();
        set.add(person1);
        set.add(person2);
        System.out.println(set.size());
    }
}

class Person {
    private String name;

    public Person(String name) {
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Person person = (Person) o;
        return Objects.equals(name, person.name);
    }
}
 
```

最后输出这个Set元素个数是2，说明Set认为这两个对象不是相等的。

我们给Person类添加一个hashCode方法，重新执行以上方法，最终得到的结果就是1了。
```java
class Person {
    private String name;

    public Person(String name) {
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Person person = (Person) o;
        return Objects.equals(name, person.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
 
```
所以，我们在重写equal方法时，一定要同时重写hashCode方法。

---

## 4、对象的clone方法

### 4.1 浅拷贝

浅拷贝（Shadow Clone）：对于基本数据类型进行传递，对引用数据类型进行引用传递的拷贝，此为浅拷贝，如图3-1所示。

![image-20230303111435854](https://studyimages.oss-cn-beijing.aliyuncs.com/img/JAVASE/Base/202303031114282.png)

下面通过一段示例代码展示默认情况下的clone方法的浅拷贝的现象：
```java
public class People implements Cloneable {
    public static void main(String[] args) throws CloneNotSupportedException {
        Address address = new Address();
        address.setProvince("Zhejiang");
        People people1 = new People("Hollis", address);
        People people2 = (People) people1.clone();
        people2.getAddress().setProvince("JiangSu");
        System.out.println(people1);
        System.out.println(people2);
    }

    private String name;
    private Address address;

    public People(String name, Address address) {
        this.name = name;
        this.address = address;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    @Override
    public String toString() {
        return "People{" +
                "name='" + name + '\'' +
                ", address=" + address +
                '}';
    }
}

class Address {
    private String province;

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    @Override
    public String toString() {
        return "Address{" +
                "province='" + province + '\'' +
                '}';
    }
}
 
```
我们创建一个Person类的对象people1，然后使用clone方法复制一个新的对象并把它赋值给people2，只修改people2的address属性的province值。最终打印结果，发现people1和people2的值都发生了改变：

People{name='Hollis', address=Address{province='JiangSu'}}
People{name='Hollis', address=Address{province='JiangSu'}}

以上现象就是浅拷贝。

### 4.2 深拷贝

如何实现深拷贝呢，最简单，最直观的办法就是重写clone方法。修改上述代码，重写clone方法。
```java
 
public class People implements Cloneable {
    public static void main(String[] args) throws CloneNotSupportedException {
        Address address = new Address();
        address.setProvince("Zhejiang");
        People people1 = new People("Hollis", address);
        People people2 = (People) people1.clone();
        people2.getAddress().setProvince("JiangSu");
        System.out.println(people1);
        System.out.println(people2);
    }

    private String name;
    private Address address;

    public People(String name, Address address) {
        this.name = name;
        this.address = address;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    @Override
    public String toString() {
        return "People{" +
                "name='" + name + '\'' +
                ", address=" + address +
                '}';
    }

    @Override
    protected Object clone() throws CloneNotSupportedException {
        People people = (People) super.clone();
        people.setAddress((Address) address.clone());
        return people;
    }
}

class Address implements Cloneable{
    private String province;

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    @Override
    public String toString() {
        return "Address{" +
                "province='" + province + '\'' +
                '}';
    }

    @Override
    protected Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
}
}
 
```
以上代码输出：

People{name='Hollis', address=Address{province='Zhejiang'}}
People{name='Hollis', address=Address{province='JiangSu'}}

 