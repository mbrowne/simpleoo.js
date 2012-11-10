(function(define) {
/*
   Example usage:
   
   function Animal() {};
   Animal.prototype = {
        constructor: Animal,
        eat: function() { console.log('yum'); }
   };
   
   function Cat() {};
   Cat.prototype = extend(Animal.prototype, {
       constructor: Cat,
       meow: function() { console.log('meow'); } 
   })

   var garfield = new Cat();
   console.log(garfield instanceof Cat); //true
 */
define([], function() {

    //If Object.create isn't already defined, we just do the simple shim, without the second argument,
    //since that's all we need here
    var object_create = Object.create;
    if (typeof object_create !== 'function') {
        object_create = function(o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }
    
    var emptyObject = {};

    function mixin(dst, src) {
        for(var s in src) {
            if(src.hasOwnProperty(s) && !dst.hasOwnProperty(s) && !(s in emptyObject)) {
                dst[s] = src[s];
            }
        }
    
        return dst;
    }
    
    function extend(src1 /*, src2, src3... */) {
        var result, src, i;

        //Use the first object provided as the prototype
        result = object_create(src1);

        for(i = arguments.length - 1; i > 0; --i) {
            src = arguments[i];
            result = mixin(result, src);

            if(src.hasOwnProperty('toString') && typeof src.toString === 'function') {
                result.toString = src.toString;
            }

        }
        
        //This makes it possible to optionally pass in a constructor property pointing back
        //to the constructor function for the *last* src argument, so the instanceof
        //operator will work (see examples above)
        if (arguments.length>1) {
            var lastSrc = arguments[arguments.length-1];
            result.constructor = lastSrc;
        }
        else result.constructor = Object;
        
        return result;
    }
    
    return {
        mixin: mixin,
        extend: extend
    }
});
})(typeof define != 'undefined' ? define : function(deps, factory) { module.exports = factory(); });