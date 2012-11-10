# simpleoo.js #

A simple utility to make prototypal inheritance in Javascript a bit easier, but staying
as close to Javascript's built-in inheritance model as possible.

## Examples ##

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
})

var garfield = new Cat();
console.log(garfield instanceof Cat); //true
console.log(garfield instanceof Animal); //true
```

### Example 2 - Calling a parent method ###

Parent/super methods should be called just the way they would in traditional Javascript.

```js

var extend = simpleoo.extend;

function Pet(name) {
	this.name = name;
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
