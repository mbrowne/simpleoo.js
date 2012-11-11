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
        
        //The user can set the constructor property correctly after calling this method if they want;
        //since we have no way of knowing for sure what it should be, it's safer to set it to Object
        //to avoid potential confusion (without this line the constructor property of the returned object
        //would be always be the same as src1.constructor, which almost certainly wouldn't be correct)
        //This issue is also discussed in the test.html file. 
        result.constructor = Object;
        
        return result;
    }
    
    /**
     * 3 forms:
     * createPrototype(ctor, mixin1)
     * [NOT YET IMPLEMENTED:]
     * This will become: createPrototype(ctor, mixin1 [, mixin2, mixin3, ...])
     * 
     * createPrototype(ctor, parentProto, mixin1)
     * 
     * [NOT YET IMPLEMENTED:]
     * createPrototype(ctor, parentProto, mixin1 [, mixin2, mixin3, ...])
     */
    function createPrototype(ctor /*, other arguments... */) {
        var proto;
        var newProps = arguments[arguments.length-1];
        if (arguments.length==2) {
            proto = newProps;
        }
        else {
            var parentProto = arguments[1];
            proto = extend(parentProto, newProps);
        }
        proto.constructor = ctor;
        return proto;
    }
    
    /**
     * Deep copy an object (make copies of all its object properties, sub-properties, etc.)
     * An improved version of http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone
     * that doesn't break if the constructor has required parameters
     */ 
    function deepCopy(obj) {
        if(obj == null || typeof(obj) !== 'object'){
            return obj;
        }
        //make sure the returned object has the same prototype as the original
        var ret = object_create(obj.constructor.prototype);
        for(var key in obj){
            ret[key] = deepCopy(obj[key]);
        }
        return ret;
    }
    
    return {
        mixin: mixin,
        extend: extend,
        createPrototype: createPrototype,
        deepCopy: deepCopy
    }
});
})(typeof define != 'undefined' ? define : function(deps, factory) { module.exports = factory(); });