(function(define) {
/*
   Example usage:
   
   var makePrototype = simpleoo.makePrototype;
   var extend = simpleoo.extend;
   
   function Animal() {}
   Animal.prototype = makePrototype(Animal, {
        eat: function() { console.log('yum'); }
   });
   
   function Cat() {}
   Cat.prototype = makePrototype(Cat, extend(Animal.prototype, {
       meow: function() { console.log('meow'); } 
   }));

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
    
    var supportsES5 = null;
    /**
     * Returns whether the browser supports ES5 Object functions
     * @returns bool
     */
    function browserSupportsES5() {
        if (supportsES5 === null) {            
            //If the environment supports ES5 (or if an ES5 shim has been loaded),
            //use defineProperty rather than simple assignment in order to preserve
            //property attributes such as 'writable' and 'configurable'.
            //In ES5 environments, it can mix in non-enumerable properties.
            if (Object.defineProperty) {            
                //test it to make sure it's ES5-compliant
                var obj = {};
                try {
                    Object.defineProperty(obj, 'x', {});
                }
                catch (e) {}
                supportsES5 = ('x' in obj) && Object.getOwnPropertyNames && Object.getOwnPropertyDescriptor;
            }
        }
        return supportsES5;
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
        if (browserSupportsES5()) {
            //If the environment supports ES5 (or if an ES5 shim has been loaded),
            //use defineProperty rather than simple assignment in order to preserve
            //property attributes such as enumerability
            //Kudos to http://www.2ality.com/2012/01/js-inheritance-by-example.html
            
            var dstIsFunction = (typeof dst == 'function');
            
            Object.getOwnPropertyNames(src)
            .forEach(function(propName) {
                if (!(propName in emptyObject)) {
                    if ((!dstIsFunction || !(propName in Function)) &&
                        (replaceExisting || !dst.hasOwnProperty(propName)))
                    {    
                        Object.defineProperty(dst, propName,
                            Object.getOwnPropertyDescriptor(src, propName)
                        );
                    }
                }
            });
        }
        else {
            for(var s in src) {
                if(src.hasOwnProperty(s) && !(s in emptyObject)) {
                    if (replaceExisting || !dst.hasOwnProperty(s))
                        dst[s] = src[s];
                }
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
     * A helper to make a prototype that has its constructor property set correctly.
     * This establishes a standard way of setting the constructor property, since the use of the
     * extend function by itself means that you can only set the constructor property *after*
     * running the extend function, which might be confusing (see note above).
     *
     * The second parameter can be any object, including an object returned by the extend function, e.g.
     *
     * Cat.prototype = makePrototype(Cat, extend(Animal, {
     *        meow: function() {}
     * }));
     */
    function makePrototype(ctor, def) {
        def.constructor = ctor;
        return def;
    }
    
    /**
     * Deep copy an object (make copies of all its object properties, sub-properties, etc.)
     * An improved version of http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone
     * that doesn't break if the constructor has required parameters
     * 
     * It also borrows some code from http://stackoverflow.com/a/11621004/560114
     */ 
    function deepCopy(src, /* INTERNAL */ _visited) {
        if(src == null || typeof(src) !== 'object'){
            return src;
        }

        // Initialize the visited objects array if needed
        // This is used to detect cyclic references
        if (_visited == undefined){
            _visited = [];
        }
        // Otherwise, ensure src has not already been visited
        else {
            var i, len = _visited.length;
            for (i = 0; i < len; i++) {
                // If src was already visited, don't try to copy it, just return the reference
                if (src === _visited[i]) {
                    return src;
                }
            }
        }

        // Add this object to the visited array
        _visited.push(src);
        
        //Honor native/custom clone methods
        if(typeof src.clone == 'function'){
            return src.clone(true);
        }
        
        //Special cases:
        //Date
        if (src instanceof Date){
            return new Date(src.getTime());
        }
        //RegExp
        if(src instanceof RegExp){
            return new RegExp(src);
        }
        //DOM Elements
        if(src.nodeType && typeof src.cloneNode == 'function'){
            return src.cloneNode(true);
        }
        
        //If we've reached here, we have a regular object, array, or function
        
        //make sure the returned object has the same prototype as the original
        var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src): src.__proto__);
        if (!proto) {
            proto = src.constructor.prototype; //this line would probably only be reached by very old browsers 
        }
        var ret = object_create(proto);
        
        for(var key in src){
            //Note: this does NOT preserve ES5 property attributes like 'writable', 'enumerable', etc.
            //For an example of how this could be modified to do so, see the singleMixin() function
            ret[key] = deepCopy(src[key], _visited);
        }
        return ret;
    }
    
    return {
        mixin: mixin,
        extend: extend,
        makePrototype: makePrototype,
        deepCopy: deepCopy
    }
});
})(typeof define != 'undefined' ? define : function(deps, factory) { module.exports = factory(); });
