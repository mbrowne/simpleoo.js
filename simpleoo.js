(function(define) {
/*
   Example usage:
   
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
    
    //This method supports multiple mixins
    function mixin(dst, src1 /*, src2, src3, ... */) {
        for(i = 0; i < arguments.length; i++) {
            singleMixin(dst, arguments[i], true);
        }
        return dst;
    }
    
    function singleMixin(dst, src, replaceExisting) {
        if (typeof replaceExisting=='undefined') replaceExisting = false;
        for(var s in src) {
            if(src.hasOwnProperty(s) && !(s in emptyObject)) {
                if (replaceExisting || !dst.hasOwnProperty(s))
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
            result = singleMixin(result, src);

            if(src.hasOwnProperty('toString') && typeof src.toString === 'function') {
                result.toString = src.toString;
            }
        }
        
        return result;
    }
    
    return {
        mixin: mixin,
        extend: extend
    }
});
})(typeof define != 'undefined' ? define : function(deps, factory) { module.exports = factory(); });