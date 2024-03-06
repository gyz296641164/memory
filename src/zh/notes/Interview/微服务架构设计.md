---
title: 微服务架构设计
category:
  - 微服务
date: 2024-02-28
---

<!-- more -->

## 1. 开篇

前言：我认为你们在了解了整个微服务架构之后，需要能够明白，微服务架构重点在于架构二字，这个内容搞清楚了，其实任何的架构，任何的手段都是一个工具，如何去利用这些工具解决一些问题才是最重要的。

架构的本质：用最简单的手段解决复杂的问题。

系统整理是复杂的没错，然而80%（数字只是一个比喻，表示大多数）的用户和80%的场景都是简单的，架构的目的就是首先保证80%的简单性问题能够得到真正简单的处理，然后再构建复杂的专家级的应用去处理真正复杂的事情。

系统复杂度增加的原因：

很多架构/系统一开始是简单的，这一点都没错，因为他们开始只处理简单问题，只处理几个点，这是正确的。随着系统的不断升级迭代，他们开始把复杂的事情往简单里入侵，于是系统边界开始变得模糊不清，最后崩塌。

---

## 2. 如何解决架构的复杂度问题，或者换句话说，如何降低架构的复杂度

我们到底要如何降低系统的复杂度呢？本质思想如上所述，需要加入外力的干预，最好是强力的干预。而这个外力我认为就是架构设计思想和架构解耦工具

### 2.1. 架构分层

我认为分层几乎是系统设计中最重要的思想，可以参考计算机网络协议和计算机缓存设计等。

三层架构

四层架构 职责单一化

### 2.2. 领域拆分

良好的领域拆分需要依赖系统设计人员对系统应用场景的深刻理解。且具备很好的抽象能力。

### 2.3. 服务聚合

同拆分一样，找到同类的功能进行聚合，也是需要对场景的理解，且需要不断优化和尝试。

A  + B = C

### 2.4. 高度自治

系统拆分与聚合清晰后，需要独立模块有高度自治的能力。对外定义控制输入和输出协议，对内实现独立且明确的能力。

### 2.5. 链路简单清晰

系统链路一定要简化，尤其系统核心链路。简单意味着好理解、易维护、稳定性强、容易扩展。

用户-商品-订单- 库存- 支付   冗余到一起

DDD领域驱动

---

## 3. 解耦工具-主要指常用的代码设计方法

### 3.1. 事件消息机制

```java
import java.util.ArrayList;
import java.util.List;

public class Event {
    private String type;

    public Event(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}

public interface EventHandler {
    public void handleEvent(Event event);
}

public class EventDispatcher {
    private List<EventHandler> handlers;

    public EventDispatcher() {
        handlers = new ArrayList<EventHandler>();
    }

    public void addHandler(EventHandler handler) {
        handlers.add(handler);
    }

    public void dispatchEvent(Event event) {
        for (EventHandler handler : handlers) {
            if (handler != null) {
                handler.handleEvent(event);
            }
        }
    }
}
```

在这个事件驱动的代码中，我们有一个Event类来表示事件，并具有一个类型属性。我们还有一个EventHandler接口，用于处理事件。最后，我们有一个EventDispatcher类，用于添加处理程序并分派事件。

可以创建不同类型的事件，并创建实现EventHandler接口的处理程序来处理这些事件。然后，可以将处理程序添加到EventDispatcher中以便可以启动事件处理。

例如，我们可以创建一个名为“ButtonClickEvent”的事件，并创建一个名为“ButtonClickEventHandler”的处理程序来处理该事件。然后，可以将该处理程序添加到EventDispatcher中，以便在单击按钮时启动事件处理。

```java
public class ButtonClickEvent extends Event {
    public ButtonClickEvent() {
        super("ButtonClickEvent");
    }
}

public class ButtonClickEventHandler implements EventHandler {
    public void handleEvent(Event event) {
        if (event.getType().equals("ButtonClickEvent")) {
            // 执行单击按钮时要执行的操作
            System.out.println("Button clicked");
        }
    }
}

public static void main(String[] args) {
    // 创建一个事件分派器
    EventDispatcher eventDispatcher = new EventDispatcher();

    // 创建一个按钮单击事件
    ButtonClickEvent buttonClickEvent = new ButtonClickEvent();

    // 创建一个处理程序来处理按钮单击事件
    EventHandler buttonClickEventHandler = new ButtonClickEventHandler();

    // 将处理程序添加到事件分派器
    eventDispatcher.addHandler(buttonClickEventHandler);

    // 分派按钮单击事件
    eventDispatcher.dispatchEvent(buttonClickEvent);
}
```

在这个示例中，我们创建了一个名为“ButtonClickEvent”的事件，并创建一个名为“ButtonClickEventHandler”的处理程序来处理它。然后，我们创建了一个事件分派器，并添加了该处理程序。最后，我们分派按钮单击事件，该事件将触发执行单击按钮时要执行的操作。

可以根据需要添加更多的事件和处理程序，并根据事件类型执行不同的操作。

### 3.2. 策略、责任链等设计模式

在电商场景中，责任链模式可以用于处理订单退款申请。下面是一个简单的电商场景的责任链Java代码实现：

```java
public abstract class RefundHandler {

    private RefundHandler nextHandler;

    public void setNextHandler(RefundHandler handler) {
        this.nextHandler = handler;
    }

    public void handleRefundRequest(Order order, RefundRequest request) {
        if (canHandle(request)) {
            handle(order, request);
        } else if (nextHandler != null) {
            nextHandler.handleRefundRequest(order, request);
        } else {
            System.out.println("没有处理该退款请求的处理程序");
        }
    }

    protected abstract boolean canHandle(RefundRequest request);

    protected abstract void handle(Order order, RefundRequest request);
}

public class CustomerServiceHandler extends RefundHandler {

    @Override
    protected boolean canHandle(RefundRequest request) {
        return request.getType() == RefundType.CUSTOMER_SERVICE;
    }

    @Override
    protected void handle(Order order, RefundRequest request) {
        // 联系客服处理退款申请
        System.out.println("联系客服处理退款申请");
    }
}

public class FinanceHandler extends RefundHandler {

    @Override
    protected boolean canHandle(RefundRequest request) {
        return request.getType() == RefundType.FINANCE;
    }

    @Override
    protected void handle(Order order, RefundRequest request) {
        // 财务部门处理退款申请
        System.out.println("财务部门处理退款申请");
    }
}

public class LogisticsHandler extends RefundHandler {

    @Override
    protected boolean canHandle(RefundRequest request) {
        return request.getType() == RefundType.LOGISTICS;
    }

    @Override
    protected void handle(Order order, RefundRequest request) {
        // 物流部门处理退款申请
        System.out.println("物流部门处理退款申请");
    }
}
```

在这个责任链的实现中，我们定义了一个抽象的RefundHandler类，它有一个指向下一个处理程序的引用，还有一个处理退款申请的抽象方法handle。如果当前处理程序无法处理退款申请，则将退款请求转发给下一个处理程序。

我们还定义了三个具体的处理程序CustomerServiceHandler、FinanceHandler和LogisticsHandler，它们分别处理不同类型的退款请求。如果一个处理程序可以处理退款请求，则处理该请求并结束责任链。否则，将该请求传递给下一个处理程序。

我们可以将这些处理程序按照责任链的顺序连接起来:

```java
RefundHandler logisticsHandler = new LogisticsHandler();
RefundHandler financeHandler = new FinanceHandler();
RefundHandler customerServiceHandler = new CustomerServiceHandler();

logisticsHandler.setNextHandler(financeHandler);
financeHandler.setNextHandler(customerServiceHandler);
```

然后，当收到一个退款请求时，我们将它传递给责任链的第一个处理程序:

```java
Order order = getOrder();
RefundRequest request = getRefundRequest();

logisticsHandler.handleRefundRequest(order, request);
```

如果第一个处理程序无法处理该请求，则将其传递给下一个处理程序。如果所有处理程序都无法处理该请求，则在最后提供默认响应。

```java
System.out.println("没有处理该退款请求的处理程序");
```

### 3.3. 规则引擎

规则引擎可以帮助你将逻辑和数据解耦，数据放入领域模型中，逻辑放入规则中

电商领域的规则引擎可以用来处理价格计算、促销活动、优惠券使用等复杂的业务逻辑。以下是一个电商领域的规则引擎的简单示例代码：

假设我们需要计算某个商品的价格，考虑到会有多种不同的优惠策略，如会员折扣、新用户优惠、满减等，这时我们可以使用规则引擎来实现灵活的计价方案。

首先我们定义一个Rule类，用来表示一个规则：

```java
public abstract class Rule<T> {
    private String ruleName;
    private int priority;

    public abstract boolean evaluate(T obj);

    public abstract BigDecimal calculate(T obj);

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public int getPriority() {
        return priority;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }
}
```

在这里，我们定义了两个抽象方法 `evaluate`和 `calculate`，分别用来评估当前规则是否适用于给定的对象（如某个订单）以及如何计算折扣后的价格等。

接下来，我们定义一个RuleEngine类，用来实现规则的执行逻辑：

```java
public class RuleEngine<T> {
    private List<Rule<T>> rules;

    public RuleEngine() {
        rules = new ArrayList<>();
    }

    public void addRule(Rule<T> rule) {
        rules.add(rule);
    }

    public BigDecimal execute(T obj) {
        rules.sort(Comparator.comparingInt(Rule::getPriority));
        BigDecimal price = BigDecimal.ZERO;
        for (Rule<T> rule : rules) {
            if (rule.evaluate(obj)) {
                price = rule.calculate(obj);
            }
        }
        return price;
    }
}
```

在这里，我们定义了一个 `addRule`方法和一个 `execute`方法。其中 `addRule`用来添加规则，而 `execute`方法则用来执行规则引擎的逻辑。在 `execute`方法中，我们首先对规则按照优先级进行排序，然后依次运行每一个规则。如果当前规则适用于给定的对象，则执行该规则的计算方法，累加价格并返回。

最后，我们可以使用具体的规则来实现价格计算：

```java
public class MemberDiscountRule extends Rule<Order> {
    // ...

    @Override
    public boolean evaluate(Order obj) {
        return obj.getUser().isMember();
    }

    @Override
    public BigDecimal calculate(Order obj) {
        return obj.getTotalPrice().multiply(new BigDecimal("0.9")); // 9折优惠
    }
}

public class NewUserDiscountRule extends Rule<Order> {
    // ...

    @Override
    public boolean evaluate(Order obj) {
        return obj.getUser().isNewUser();
    }

    @Override
    public BigDecimal calculate(Order obj) {
        return obj.getTotalPrice().subtract(new BigDecimal("5")); // 新用户减5元
    }
}

public class Over100DiscountRule extends Rule<Order> {
    // ...

    @Override
    public boolean evaluate(Order obj) {
        return obj.getTotalPrice().compareTo(new BigDecimal("100")) >= 0;
    }

    @Override
    public BigDecimal calculate(Order obj) {
        return obj.getTotalPrice().subtract(new BigDecimal("10")); // 满100减10元
    }
}
```

在这里，我们实现了会员折扣、新用户优惠和满减等三个规则。通过 `evaluate`方法判断当前规则是否适用于给定的订单，通过 `calculate`计算满足当前规则后的价格。我们可以通过如下方式来应用这些规则：

```java
RuleEngine<Order> engine = new RuleEngine<>();
engine.addRule(new MemberDiscountRule());
engine.addRule(new NewUserDiscountRule());
engine.addRule(new Over100DiscountRule());

Order order = new Order();
// 初始化订单信息，如商品列表、会员信息等

BigDecimal finalPrice = engine.execute(order);
```

当然，市面上也有一些开源的规则引擎，这个更好用一些，比如drools这种

### 3.4. 状态机

```java
public enum State {
    STATE_ONE,
    STATE_TWO,
    STATE_THREE
}

public class StateMachine {
    private State state;

    public StateMachine() {
        state = State.STATE_ONE;
    }

    public void processInput(String input) {
        switch (state) {
            case STATE_ONE:
                if (input.equals("A")) {
                    state = State.STATE_TWO;
                }
                break;

            case STATE_TWO:
                if (input.equals("B")) {
                    state = State.STATE_THREE;
                } else {
                    state = State.STATE_ONE;
                };
                break;

            case STATE_THREE:
                if (input.equals("C")) {
                    state = State.STATE_ONE;
                }
                break;

            default:
                break;
        }
    }
}
```

在这个状态机中，我们有三个状态: STATE_ONE，STATE_TWO和STATE_THREE。在构造函数中，我们将初始状态设置为STATE_ONE。

processInput方法接受输入，并根据当前状态进行转换。在每个状态中，我们检查输入并根据需要更新状态。

例如，如果我们处于STATE_ONE状态，并且输入是“A”，我们将转换到STATE_TWO状态。如果我们处于STATE_TWO状态并且输入是“B”，我们将转换到STATE_THREE状态。如果我们处于STATE_TWO状态但输入不是“B”，我们将返回到STATE_ONE状态。在STATE_THREE状态中，如果输入是“C”，我们将返回到STATE_ONE状态。否则，我们将保持在STATE_THREE状态中。

可以根据需要修改此状态机，例如，添加更多状态或更改状态之间的转换条件。

### 3.5. DDD 模式

以下是一个电商中的DDD代码案例：

假设我们正在开发一个电商网站的下单功能，我们需要识别用户是否有足够的库存、确认订单信息是否正确、扣除相应金额、生成订单等等。我们可以先定义一个 `Order`实体类表示订单，在这个实体类中定义一些重要属性和方法：

```java
public class Order {
    private String orderId;
    private User user;
    private List<Item> items;
    private BigDecimal totalPrice;
    private OrderStatus status;

    public void createOrder() {
        //生成订单的具体实现逻辑
    }

    public void confirmOrder() {
        //确认订单的具体实现逻辑
    }

    //getter和setter方法
}
```

在这里，`Order`类是我们的聚合根（Aggregate Root），其他所有相关的实体（如 `User`和 `Item`）都是 `Order`的子对象。我们可以通过调用 `createOrder`方法来生成订单，同时该方法中可以调用其他相关实体的方法。例如，检查库存、计算订单总价、生成订单号等等。当确认订单之后，我们可以调用 `confirmOrder`方法来将订单状态改为已确认、扣除相应的金额、生成订单等。

除此之外，我们还可以定义一个 `OrderRepository`接口来处理订单的持久化操作：

```java
public interface OrderRepository {
    void save(Order order);
    void delete(Order order);
    List<Order> findByUserId(String userId);
    Order findByOrderId(String orderId);
}
```

在这里，我们通过定义接口来实现订单的数据存储和检索。这个接口可以被不同类型的实例去实现，例如内存数据库、关系数据库、NoSQL数据库等等。对于某些特殊情况（如并发冲突、分布式环境下的多线程冲突等），我们可以通过引入领域事件（Domain Event）来处理这些问题，进一步增强我们的代码的稳定性和可扩展性。

### 3.6. 流程拆分与编排

容器编排、流程拆分、限界上下文

## 4. 服务划分原则

在微服务架构中，服务划分可以基于多种因素，例如业务功能、数据域、可扩展性、可维护性等。以下是一些常用的划分方法：

1. 基于业务功能：将服务划分为不同的业务功能单元，例如订单服务、支付服务、用户服务等。
2. 基于数据域：将服务按照数据领域进行划分，例如客户服务（用户中心）、订单服务（订单中心）、库存服务（WMS数据中心）等。
3. 基于可扩展性：将服务划分为可以水平扩展的单元，例如将前端服务划分为多个负载均衡的实例，每个实例都可以处理一部分流量。
4. 基于可维护性：将服务划分为易于维护和更新的单元，例如将核心服务与辅助服务分离，将通用功能提取为独立的服务。

在面试时，应该清楚地解释您所选择的划分方法，并说明其优缺点以及在什么情况下该方法适用。此外，您应该能够描述如何将这些服务组合成一个完整的应用程序，并讨论在不同服务之间通信的方式。最后，您可能需要讨论一些与微服务相关的挑战，例如服务发现、服务治理、数据一致性等，并说明您如何解决这些挑战

---

## 5. 微服务架构设计的优缺点

### 5.1. 微服务架构的优点

1. **灵活性高** ：它将应用程序分解为小型服务（松散耦合），使其开发、维护更快，更易于理解，可以提供更高的灵活性；
2. **独立扩展** ：它使每个服务能够独立扩展，将系统中的不同功能模块拆分成多个不同的服务，这些服务进行独立地开发和部署，每个服务都运行在自己的进程内，这样每个服务的更新都不会影响其他服务的运行；
3. **支持多种编程语言** ：微服务可通过最佳及最合适的不同的编程语言与工具进行开发，能够做到有的放矢地解决针对性问题；异构开发
4. **自动部署与持续集成工具集成** ：它允许以灵活的方式将自动部署与持续集成工具集成，例如Jenkins，Hudson等；
5. **通用性** ：通过服务实现应用的组件化（按功能拆分、可独立部署和维护），围绕业务能力组织服务，根据业务不同的需求进行不同组件的使用，所做产品非项目化，对于平台具有一定的通用性。

### 5.2. 微服务架构的缺点

1. **处理故障难度高** ：微服务架构是一个分布式系统，必须构建一个相互通信机制并处理部分故障；
2. **部署工作量大** ：整体式应用程序可以部署在负载平衡器后面的相同服务器上。但对于微服务，每个服务都有不同的实例，每个实例都需要配置、部署、缩放和监控；
3. **测试复杂度高** ：微服务在一定程度上也会导致系统变得越来越复杂，增加了集成测试的复杂度；
4. **运营成本增加** ：整体应用可能只需部署至一小片应用服务区集群，而微服务架构可能变成需要构建/测试/部署/运行数十个独立的服务，并可能需要支持多种语言和环境。这导致一个整体式系统如果由20个微服务组成，可能需要40~60个进程；
5. **发布风险高** ：把系统分为多个协作组件后会产生新的接口，这意味着简单的交叉变化可能需要改变许多组件，并需协调一起发布。在实际环境中，一个新品发布可能被迫同时发布大量服务，由于集成点的大量增加，微服务架构会有更高的发布风险；
6. **分布性系统问题** ：作为一种分布式系统，微服务引入了复杂性和其他若干问题，例如网络延迟、容错性、消息序列化、不可靠的网络、异步机制、版本化、差异化的工作负载等，开发人员需要考虑以上的分布式系统问题。

---

## 6. 微服务技术选型问题

* 微服务架构中服务发现和注册的设计思路和方案。
  nacos、Eurek、consul、zk
  服务注册   服务续约   服务获取    服务调用    服务下线   失效剔除  自我保护  服务同步
  数据存储  有要求       数据得交互性   要求不高            CP的注册中心     nacos
  CAP定理    CP强一致性      AP   可用性   最终的一致
  直播电商    nacos    Eureka        强AP模式   多级缓存    最终一致   对方的直播下线了   能忍
* 微服务架构中通信机制的原则和实现方式。
  RPC：功能较为完善，服务性能较好，建议大型项目
* RestFul风格的HTTP：简单，开发快
* 微服务架构中数据共享和访问的设计策略。
  配置中心：config   nacos  disconf   Apollo
  1.动态修改
* 2.修改过后更新
* 3.安全性的保证：权限的控制
* 微服务架构中安全和可靠性的保障措施。
  链路追踪：用什么方式     侵入式的  还是非侵入式的  性能怎么样  吃不吃资源
  zipkin    pingpoint   Cat    skywalking
* 微服务架构中的智能监控和日志分析方案。
  Elastic Stack         Prometheus   Grafana
* 微服务架构中的部署和运维策略。

---

## 7. 微服务架构下的性能优化

网络传输时间+逻辑运行时间（缓存+消息引擎）+数据库连接时间+数据库的查询时间

DNS的解析+通过网关的时间 +网络传输时间+逻辑运行时间（缓存+消息引擎）+数据库连接时间+数据库的查询时间

### 7.1. 网关的效率问题

在微服务架构下，网关的效率问题往往受到以下几个方面的影响：

1. **请求转发效率**：网关的核心任务是将客户端发来的请求转发到相应的微服务，因此其请求转发效率对整个微服务性能产生重要影响。网关需要完成请求转发、解析、负载均衡、并发限制、路由转发等功能，这些操作都会消耗一定的时间，因此需要合理配置网关的转发配置，避免过于复杂的路由和过度的并发限制等情况导致网关性能下降。
2. **网络传输效率**：在微服务架构中，由于服务数量的增加，服务之间的调用往往需要通过网络进行。如果网关与微服务之间的网络传输效率低下，则会极大地影响网关的整体效率。为提高网络传输效率，可以采用HTTPS协议、移动端服务端双向认证等措施，避免因网络传输效率低下导致网关性能下降。
3. **连接池性能**：连接池是用于管理数据库或其他资源连接的工具。在微服务架构下，网关需要使用连接池来管理多个微服务之间的连接，其性能直接影响网关的整体性能。因此，在选择连接池时，需要考虑到其性能和稳定性等因素。
4. **缓存效率**：缓存是提高网关效率的重要手段之一，可以减少请求转发、数据库查询等操作次数。但是，如果缓存管理不当，则可能导致缓存效率低下，从而影响网关的整体效率。为提高缓存效率，可以采用合理的缓存策略，如定期清理缓存、设置过期时间等。

综上所述，网关效率问题需要从多个方面进行考虑和优化，避免某个环节出现性能瓶颈导致整个网关性能下降。在实际应用中，可以使用性能测试工具对网关进行测试评估，发现性能瓶颈并及时进行优化。

### 7.2. 你们项目接口性能指标有哪些标准？

互联网项目中，接口性能指标可以从不同的角度进行考虑，以下是一些常用的指标：

1. **响应时间**：指接口处理请求并返回结果所需的时间。通常，响应时间应该尽可能地短，一般来说不超过1秒，最好控制在0.5秒以内。
2. **吞吐量**：指接口每秒处理的请求数。高吞吐量可以使系统更有效地使用资源并提高访问效率。对于高并发的应用，吞吐量要求会比较高，需要根据实际情况进行合理的调整。一般项目要求96%以上，但是根据CPU上下文切换时间不同，有所下降
3. **并发数**：指在同一时间内有多少个请求在处理。并发数过高可能会导致请求响应时间延长或者系统崩溃，需要合理地控制并发数。2个方向进行控制        hystrix   sentinel   并发控制   不限制死      业务服务之后
   500个    200个         sentinel  信号量隔离     服务层面  线程池隔离      300  hystrix
4. **错误率**：指接口处理失败或者返回错误结果的概率。错误率应该尽可能低，一般来说不超过1%，同时还需要对错误进行详细记录与分析，及时发现并解决问题。（召回率）
5. **延迟分布情况**：指接口响应时间在不同请求场景下的分布情况，如 90%的请求响应时间在1秒以内，99%的请求响应时间在2秒以内等。延迟分布情况可以给出更详细的性能数据，并根据数据来判断是否需要调整系统架构或者调整业务流程。
6. **网络流量**：指网络传输的数据量，可以根据实际情况进行监控和调整。Zabbix进行监控
7. **系统资源利用率**：指系统使用的CPU、内存、磁盘等资源的利用率，需要根据实际情况进行监控和调整。

综上所述，接口性能指标有很多，需要根据具体业务场景来选择和权衡。在实际项目中，可以使用一些专业的性能测试工具，如JMeter、Gatling等来进行性能测试，并根据测试结果进行适当的调整和优化。

### 7.3. 在微服务架构下，如何判定性能的标准：

在微服务架构下，判别接口性能的标准一般可以从以下几个方面进行评估：

1. **请求响应时间**：这是最基本的性能评估指标之一。请求响应时间指的是从客户端发出请求到服务器处理完请求并返回响应所需要的时间。一般来说，请求响应时间越短，说明服务性能越好。
2. **吞吐量**：吞吐量指的是在一定时间内可以处理的请求数量。一般来说，吞吐量越高，说明服务性能越好。
3. **并发能力**：并发能力指的是服务器同时处理多个请求的能力。一般来说，服务器的并发能力越强，说明服务性能越好。
4. **容错能力**：容错能力指的是在出现异常情况时，服务器的自我保护和恢复能力。一般来说，容错能力越强，说明服务性能越好。
5. **稳定性**：稳定性指的是服务在长时间运行过程中，是否出现过崩溃、死锁等问题。一般来说，稳定性越高，说明服务性能越好。

在实际的性能测试中，除了以上几个方面，还可以根据具体业务需求进行评估。同时，在进行性能测试时，需要考虑到并发场景、请求量、负载均衡、缓存等因素对服务性能的影响，综合评估服务的性能表现。
