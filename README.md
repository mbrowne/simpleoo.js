# simpleoo.js #

A simple utility to make prototypal inheritance in Javascript a bit easier, but staying
as close to Javascript's built-in inheritance model as possible.

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
Animal constructor, which helps you remember to call it yourself from the Cat constructor. Forgetting to call the
parent constructor could otherwise result in some hard-to-find bugs due to unintended shared prototype
properties. (See http://www.bennadel.com/blog/1566-Using-Super-Constructors-Is-Critical-In-Prototypal-Inheritance-In-Javascript.htm).

This also allows you to do things like require certain constructor parameters (throwing an error if they're absent).


### Example 3 - Mixins / multiple inheritance using the mixin function ###

The mixin function is used under the hood by the extend function. All it does is copy properties.
Unlike the extend function, it operates directly on the first argument passed to it, rather than calling
Object.create and returning a new object. This also means no new prototype is created. 

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
	for(var i = arguments.length - 1; i >= 0; --i) {
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