# simpleoo.js #

A simple utility to make prototypal inheritance in Javascript a bit easier, but staying
as close to Javascript's built-in inheritance model as possible.

## Example usage ##

```js

   function Animal() {};
   
   Animal.prototype = {
        constructor: Animal,
        eat: function() { console.log('yum'); }
   };
   
   function Cat() {};
   Cat.prototype = simpleoo.extend(Animal.prototype, {
       constructor: Cat,
       meow: function() { console.log('meow'); } 
   })

   var garfield = new Cat();
   console.log(garfield instanceof Cat); //true
```