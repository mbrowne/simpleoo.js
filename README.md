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

### Example 2 - Calling a parent method ###

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
Pet constructor, which helps you remember to call it yourself from the Cat constructor. Forgetting to call the
parent constructor could otherwise result in some hard-to-find bugs due to unintended shared prototype
properties. (See http://www.bennadel.com/blog/1566-Using-Super-Constructors-Is-Critical-In-Prototypal-Inheritance-In-Javascript.htm).

This also allows you to do things like require certain constructor parameters (throwing an error if they're absent).


### Another tip ###

This tip is really more general info about Javascript than it is something specific to simpleoo, but it's important... 

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


### Example 3 - Mixins / multiple inheritance using the mixin function ###

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

### Example 4 - Mixins / multiple inheritance with properties in addition to methods ###

```js

var mixin = simpleoo.mixin;

function Person() {}

Person.prototype.addRoles = function(role1 /*, role2, ... */) {
	if (this.initRole) {
		throw new Error("addRoles method doesn't work if an initRole method exists on the Person prototype");
	}
	for(var i in arguments) {
		var role = arguments[i];
		if (typeof role.initRole=='function') {
			role.initRole.call(this);
		}		
		mixin(this, role);
	}
	delete this.initRole;
};

var studentRole = {
	initRole: function() {
		console.log('init student');
		
		//It's important to define properties in some sort of init function rather than directly on the
		//trait or role object, for the same reason that default values for object properties should be
		//initialized in the constructor for regular "classes." See "Another tip" above.
		
		this.school = null;
		this.numCourses = null;
	},
	study: function() {}
}

var employeeRole = {
	initRole: function() {
		console.log('init employee');
		this.employer = null;
	},
	work: function() {}
}

var fred = new Person();
fred.addRoles(studentRole, employeeRole);

fred.school = fred.employer = "Cyberland College";
fred.numCourses = 4;

console.log(fred);

```