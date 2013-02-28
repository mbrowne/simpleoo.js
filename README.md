# simpleoo.js #

A simple utility to make prototypal inheritance in Javascript a bit easier, but staying
as close to Javascript's built-in inheritance model as possible.

## Set Up ##

### Web browser: ###

Use an AMD (asynchronous module definition) loader such as 'curl'
(not to be confused with the command line network tool with the same name):
https://github.com/cujojs/curl

Assuming that curl.js and simpleoo.js are both in the same directory as the HTML file:

```html
<script src="curl.js"></script>
<script>
curl(['simpleoo'], function(simpleoo) {
	var extend = simpleoo.extend;
	//see below for usage...
});
</script>

```

To learn more about AMD, including the motivation for it, see:
http://requirejs.org/docs/whyamd.html

### node.js ###

It also works as a CommonJS module so you can use it as you would any other node.js module:

```
$ npm install simpleoo
```

Include the -g option if you want it to be available for all your node.js projects.

```js
var simpleoo = require('simpleoo');
var extend = simpleoo.extend;
//see below for usage...
```

## [API](https://github.com/mbrowne/simpleoo.js/wiki/api) ##

Note: It's highly recommended to read at least the first two examples before reading the API.

Here's the link:

**[API](https://github.com/mbrowne/simpleoo.js/wiki/api)**


## Examples & Notes ##

### Example 1 - Basic usage ###

```js

var extend = simpleoo.extend;

function Animal() {}
Animal.prototype = {
	eat: function() { console.log('yum'); }
};

function Cat() {}
Cat.prototype = extend(Animal.prototype, {
   meow: function() { console.log('meow'); } 
});

var garfield = new Cat();
console.log(garfield instanceof Cat); //true
console.log(garfield instanceof Animal); //true
```

### Example 2 - Alternative basic usage ###

Using this method the prototype.constructor property is always set to the constructor passed as the
first argument. This gives more useful debugging output in the console, and may have
[other advantages](http://www.2ality.com/2011/06/constructor-property.html) as well.

The method signature is as follows:
	makePrototype(ctor, prototypeDefinition)

ctor stands for 'constructor'.
prototypeDefinition is an object that could actually be used as a prototype in its own right;
the usefulness of the makePrototype method is that it sets the constructor property appropriately
for you, saving a step (see [explanation](#makePrototypeExplanation)).  

```
Animal.prototype = makePrototype(Animal, {
	eat: function() { console.log('yum'); }
});

Cat.prototype = makePrototype( Cat, extend(Animal.prototype, {
	meow: function() { console.log('meow'); }
}) );

var garfield = new Cat();
console.log(garfield instanceof Cat); //true
console.log(garfield instanceof Animal); //true

console.log(new Animal());  //this will show 'Animal' in the console instead of just 'Object' like the above example
console.log(garfield);  //this will show 'Cat' in the console instead of just 'Object' like the above example
```

### Example 3 - Calling a parent method ###

Parent/super methods should be called just the way they would in traditional Javascript.

```js

var extend = simpleoo.extend;

function Pet(name) {
	this.name = name || null; //default to null if no name is provided
}
Pet.prototype = { /* ... */ };

function Cat() {
	Pet.apply(this, arguments);
}
Cat.prototype = extend(Pet.prototype, { /* ... */ });

var garfield = new Cat('Garfield');
console.log(garfield.name); // Garfield
```

Or if you want to explicity call the parameters of the parent method:

```js

function Cat(name) {
	Pet.call(this, name);
}
```

This isn't as future-proof (in case the definition of the parent method changes) but can be useful
for certain cases.


### Tip ###

Internally, Object.create is used (or a fallback for older browsers) to create a new instance of the
parent type to be used as the prototype. So in this example, the prototype would be set like this:

```js
Cat.prototype = Object.create(Pet.prototype);
```

The *first* argument passed to extend() will always be used to set the prototype of the object returned. 

Using Object.create is superior to ```Cat.prototype = new Pet();``` because it avoids calling the
Pet constructor, which helps you remember to call it yourself from the Cat constructor (if you don't call it,
all of the properties that would have been created by calling `new Pet()` will be `undefined` instead).

Forgetting to call the
parent constructor could otherwise result in some hard-to-find bugs due to unintended shared prototype
properties. (See http://www.bennadel.com/blog/1566-Using-Super-Constructors-Is-Critical-In-Prototypal-Inheritance-In-Javascript.htm).

This also allows you to do things like require certain constructor parameters (throwing an error if they're absent).


### Another tip ###

This tip is really more general info about Javascript than it is something specific to simpleOO, but it's important... 

While the internal usage of Object.create helps to some degree with the issue of unintended shared properties discussed above,
it doesn't prevent you from making the common mistake of declaring object properties on the prototype:

```js
Animal.prototype.myArray = []; //Don't do this!
```

Instead, properties should be initialized in the constructor:

```js
function Animal() {
	this.myArray = [];
}
```

Any properties set on the prototype should either be set to simple literals like strings, numbers, booleans, or null.
To be safe, simply don't put properties on the prototype at all - only use it for methods.

For more details, see http://www.bennadel.com/blog/1566-Using-Super-Constructors-Is-Critical-In-Prototypal-Inheritance-In-Javascript.htm.


### Example 4 - Mixins / multiple inheritance using the mixin function ###

The mixin function simply copies properties.
Unlike the extend function, it operates directly on the first argument passed to it, rather than calling
Object.create and returning a new object. This also means no new prototype is created.

To be clear, extend() will return a *new* object whereas mixin() returns the *same* object given
(after adding new members to it of course, or overriding existing ones).

With both the extend function and the mixin function, later arguments override earlier arguments if there are members with the same name.

```js

var extend = simpleoo.extend;

function Person() {
}

function Student() {}
Student.prototype = extend(Person, {
	study: function() { console.log('study'); }
});

function Employee() {}
Employee.prototype = extend(Person, {
	work: function() { console.log('work'); }
});

var fred = new Person();

//Fred is both a student and an employee

mixin(fred, Student.prototype, Employee.prototype);

//this is equivalent to:  fred = extend(fred, Student.prototype, Employee.prototype);
//except that it operates on fred directly rather than creating a new object

//only works in browsers supporting ECMAScript 5 or above
//for older browsers you can try the non-standard fred.__proto__
if (Object.getPrototypeOf) {
	log( Object.getPrototypeOf(fred) ); //Person
}

fred.study();
fred.work();

log(fred instanceof Person); //true

//This is false, because Javascript only has a single prototype property,
//and it was already set to Person.prototype  
log(fred instanceof Employee); //false
```

Consider the situation where Fred was already a student:

```js
var fred = new Student();
mixin(fred, Employee.prototype);
```

Now we have a problem...

```js
console.log( fred instanceof Student ); //true
console.log( fred instanceof Employee ); //false
```

In this type of situation it might be better to create the student and employee roles as simple trait
objects, and have Fred just be an instance of Person:

```js
var studentTrait = {
	study: function() {}
}

var employeeTrait = {
	work: function() {}
}

var fred = new Person();
mixin(fred, studentTrait, employeeTrait);

//or if he started out as just a student...
mixin(fred, studentTrait);

//and later became and employee...
mixin(fred, employeeTrait); 

//you could still have a quick way of creating students (or employees) if that's something you needed to do a lot:
function createStudent() {
	var student = new Person();
	return extend(student, studentTrait);
}

var michelle = createStudent();
```

Although mixins are certainly one of the cool features of Javascript that sets it apart from languages like Java or PHP,
it's quite possible to overuse them or use them inappropriately. The following link considers mixins rather unfavorably,
and so should be contrasted with other articles about mixins and their usefulness, but it offers some good food for thought
on the subject. The author discusses mixins in Python but many of his ideas are arguably applicable to Javascript as well:

http://www.artima.com/weblogs/viewpost.jsp?thread=246483


### [Additional Examples](https://github.com/mbrowne/simpleoo.js/wiki/Additional-Examples) ###

The above examples cover the core features of simpleoo.js, which, indeed, is a deliberately minimal and simple library.
One thing it doesn't cover is the `deepCopy()` function, which is documented [here](https://github.com/mbrowne/simpleoo.js/wiki/Additional-Examples#deepCopy). 

There are also several other examples, including a follow-up on the above example that shows how to do
mixins with properties in addition to methods.

These additional examples really have more to do with general OOP in Javascript than with simpleOO
in particular (actually, that's what some of the above is about as well).
However, since simpleOO stays so close to native Javascript, and basic desmonstration of the API only goes so
far to show intended usage, you may find the additional examples to be quite helpful.

**[View Additional Examples](https://github.com/mbrowne/simpleoo.js/wiki/Additional-Examples)**


<a name="makePrototypeExplanation"></a>
### Explanation / Rationale for the makePrototype() function ###

makePrototype does only one thing: it assigns the constructor property on the prototype.

So, modifying the first example slightly for illustration purposes, if you run:
	var def = {
		eat: function() { console.log('yum'); }
	};
	Animal.prototype = makePrototype(Animal, def);

the last line is equivalent to:
	Animal.prototype = def;
	def.constructor = Animal;

Although this may at first seem minimally helpful or nearly pointless, it actually
significantly improves code consistency and avoids confusion. 

Why? Because of the way the `extend` method works.

The `extend` method deals only with objects, and is not aware of any constructor functions that might be involved.

Therefore, it can't know for certain how the constructor property should be set on the object returned, so it
always sets its constructor property to `Object`. It's important that `extend` does this rather than simply leaving
the object alone, because otherwise the constructor property would always be the same as the constructor property of
the first parameter passed to `extend`, e.g.:
```
Cat.prototype.constructor == Animal;  //true, not good!
```

Instead, the `extend` method behaves as follows:

```
Cat.prototype = extend(Animal.prototype, {...});
Cat.prototype.constructor == Object;  //true 
```

This is better, but what we actually want is:
```
Cat.prototype.constructor == Cat
```

To accomplish this, we could try to set the constructor property ourselves, but would quickly encounter inconsistencies:

```
function Animal() {}
Animal.prototype.eat = function();
Animal.prototype.constructor == Animal; //true;

Animal.prototype = {
	constructor: Animal,
	eat: function()
};
Animal.prototype.constructor == Animal; //true;

function Cat() {}
Cat.prototype = extend(Animal, {
	constructor: Cat,
	meow: function() {}
});

Cat.prototype.constructor == Cat;  // FALSE!

Cat.prototype.constructor == Object; //true, because extend() always sets the constructor property to Object

Cat.prototype.constructor = Cat;
//We have now solved the problem, but now we now have to remember to use a different approach when extending an object
//versus creating a "class" with no parent. 
```

In contrast, when we use `makePrototype`, we have one consistent approach that always works, and saves a bit of typing to boot:

```
Animal.prototype = makePrototype(Animal, {
	eat: function() {}
});

Cat.prototype = makePrototype( Cat, extend(Animal.prototype, {
	meow: function() {}
}) );
```

The name `makePrototype` is not quite accurate because its second parameter could actually be used as a prototype
without modification (Javascript allows you to set any object as the prototype), but it conveys the purpose of the method
pretty well, which is to return a prototype fully ready for use (assuming you care about having the constructor property
set correctly in the first place, which is generally only useful for debugging, although it's potentially useful for other
things as well (see http://www.2ality.com/2011/06/constructor-property.html).
