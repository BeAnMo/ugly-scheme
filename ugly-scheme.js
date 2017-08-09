var isSchemeLoaded = true;

/********  
### Ugly-Scheme ###
    {"define": ["sum-sq", ["a", "b"], 
        {"+": [
            {"*": ["a", "a"]},
            {"*": ["b", "b"]}]}]}
            
    {"sum-sq": [3, 4]} // 25
*********/

// defined 'map' & 'sq' but (map sq (cons 5 (cons 4 '()))) is triggering:
// TypeError: expr[name].map is not a function
// this is from issues with 'cond'
// can't substitute variable/call functions within cond?


/* Test definition for 'map'

{"define": ["map", ["f", "l"],{"cond": [[{"null?": ["l"]}, null],["else", {"cons": [{"f": [{"car": ["l"]}]},{"map":["f", {"cdr": ["l"]}]}]}]]}]},{"define": ["sq", ["a"], {"*": ["a", "a"]}]},{"map": ["sq", {"cons": [5, {"cons": [4, null]}]}]}

*/



/* Expr (only valid JSON):
- Null
- Boolean
- Number
- String
- Function Application {def: Boolean, name: String, args: [...Expr]} */

/**** 
    Representations
Function Definition (funcDef):
{ name: String, param: [...String], body: Expr }

Constant Definition (conDef):
{ name: String, expr: Expr }

Function Application (funcApp):
{ name: String, args: [...Expr] } 

    Expressions (to be parsed)
Function Definition: 
{'define': [String, [...String], Expr]}

Constant Definition:
{'define': [String, Expr]}

Function Application:
{String: [...Expr]}
****/

var DEFINED = [];
var PRE_DEFINED = {
    /* definitions */
    'define': (args, userDefs) => console.log(args),
    /* booleans */
    'and': (args) => {
        return args.reduce((acc, bool) => {
            return checkIfBoolean(acc) && evalExpr(bool);
        }, true);
    },
    
    'or': (args) => {
        return args.reduce((acc, bool) => {
            return checkIfBoolean(acc) || evalExpr(bool);
        }, false);
    },
    
    'not': (args) => !evalExpr(args[0]),
    
    '>': (args) => cmpArr(args, (a, b) => a > b),
    
    '>=': (args) => cmpArr(args, (a, b) => a >= b),
    
    '<': (args) => cmpArr(args, (a, b) => a < b),
    
    '<=': (args) => cmpArr(args, (a, b) => a <= b),
    
    'null?': (args) => args[0] === null,
    
    /* arithmetic */
    '+': (args, defs) => {
        return args.reduce((acc, curr) => {
            return checkIfNumber(acc) + evalExpr(curr, defs);
        }, 0);
    },
    
    '-': (args, defs) => {
        return args.reduce((acc, curr) => {
            return checkIfNumber(acc) + - evalExpr(curr, defs);
        });
    },
    
    '*': (args, defs) => {
        return args.reduce((acc, curr) => {
            return checkIfNumber(acc) * evalExpr(curr, defs);
        }, 1);
    },
    
    '/': (args, defs) => {
        return args.reduce((acc, curr) => {
            return checkIfNumber(acc) / evalExpr(curr, defs); 
        });
    },
    
    'modulo': (args, defs) => {
        return args.reduce((acc, curr) => {
            return checkIfNumber(acc) % evalExpr(curr, defs);
        });
    },
    
    /* conditional */
    'if': (args, defs) => ifApp(args, defs), 
    
    'cond': (args, defs) => condApp(args, defs),
    
    /* lists & pairs */
    'cons': (args, defs) => consApp(args, defs),
    
    'car': (args, defs) => carApp(args, defs),
    
    'cdr': (args, defs) => cdrApp(args, defs),
};


/* Array-of-Expr, String -> Expr 
    looks up definitions, not applications  */
function lookupDef(userDefs, name){
    var matched = userDefs.filter((d) => {
        return d.define[0] === name;
    });
    return matched.length > 0 ? 
        matched[0] : 
        false;
}

/* Expr, Array-of-Expr -> Expr */
function evalExpr(expr, userDefs){
    switch(typeof(expr)){
        case 'boolean':
            return expr;
            
        case 'number':
            return expr;
            
        case 'string':
            var constName = lookupDef(userDefs, expr);
            
            if(!constName){
                return expr;
            } else {
                return constName.define[1];
            }
            
        case 'object':
            if(expr === null){
                return null;
            } else {
                return evalFuncExpr(expr, userDefs);
            }
            
        default:
            return new Error('Undefined');
    }
}

/* Expr, Array-of-Expr -> Expr */
function evalFuncExpr(expr, userDefs){
    var name = Object.getOwnPropertyNames(expr)[0];

    if(name in PRE_DEFINED){
        switch(name){
            case 'define':
                return lookupDef(userDefs, expr.define[0]) ?
                    new Error(`Previously defined: ${expr.define[0]}`) : // replace existing def with new one
                    userDefs.push(expr);
                    
            case 'if':
                return PRE_DEFINED[name](expr[name], userDefs);
                
            case 'cond':
                return PRE_DEFINED[name](expr[name], userDefs);
                
            default:
                // need to pass definitions to all functions
                // in case global variables are used
                return PRE_DEFINED[name](expr[name], userDefs);
        }
    } else {
        // take DEFINED as a parameter to evalExpr/FuncExpr
        var def = lookupDef(userDefs, name);
        
        return def ?
            evalExpr(
                substMultiples(
                    def.define[2], // body
                    def.define[1], // param
                    expr[name].map((arg) => evalExpr(arg, userDefs)) // args
                ),
                userDefs
            ) :
            new Error('Invalid');
    }
}

/* Expr, String, String|Number -> Expr
    substitutes a given variable for a value 
    within an expression  */
function substitute(expr, varStr, val){
    switch(typeof(expr)){
        case 'boolean':
            return expr;
    
        case 'number':
            return expr;
        
        case 'string':
            if(expr === varStr){
                return val;
            } else {
                return expr;
            }
            
        case 'object':
            if(expr === null){
                return null;
            } else {
                var name = Object.getOwnPropertyNames(expr)[0];
                
                return {[name]: expr[name].map((ex) => {
                    return substitute(ex, varStr, val);
                })};
            }
            
        default:
            return new Error('Undefined variable');
    }
}

/* Expr, Array, Array -> Expr */
function substMultiples(expr, arrVar, arrVal){
    if(arrVar.length !== arrVal.length){
        // mismatch throws 'Invalid function name'
        throw new Error('substMultiples: number of parameters|arguments not equal');
    } else if(arrVar.length === 0){
        return expr;
    } else {
        return substMultiples(
            substitute(expr, arrVar[0], arrVal[0]), 
            arrVar.slice(1), 
            arrVal.slice(1)
        );
    }
}

/* Array -> Expr 
    {if: [Expr, Expr, Expr]}
    'if' statement application body consists of an array
    of 3 items: [test, consequent, alternate]  */
function ifApp(args, defs){
    console.log(args);
    if(args.length !== 3){
        throw new Error('if statement expects 3 parts');
    } else {
        return evalExpr(args[0], defs) ?
            evalExpr(args[1], defs) :
            evalExpr(args[2], defs);
    }
}

/* Array-of-Array, Array-of-Expr -> Expr
    {cond: [...[Expr, Expr],...['else', Expr]]}
    'cond' application body is an array of arrays of Exprs
    each Array-of-Expr is 2 items: [test, consequent] 
    if the evaluated test is true, its consequent is evalualated 
    & returned, else next Array-of-Expr is tested  
    !!! must take an array-of-arrays or else only the first
    inner array will be used when called with funcApp !!!  */
function condApp(args, defs){
    var test = args[0][0];
    var conseq = args[0][1];
    
    if(args.length === 1 && test === 'else'){
        return evalExpr(conseq, defs);
    } else if(args.length === 1 && !evalExpr(test, defs)){
        throw new Error('cond: all tests are false');
    } else {
        return evalExpr(test, defs) ? 
            evalExpr(conseq, defs) :
            condApp(args.slice(1));
    }
}

/* Array-of-Expr, Array-of-Expr -> Expr 
    {cons: [Expr, Expr]} 
    'cons' application has 2 arguments, first is an Expr,
    the second is either null (empty), an Expr (list-association), 
    or another 'cons' application  */
function consApp(args, defs){ 
    if(args[1] === null){
        return { "cons": [evalExpr(args[0], defs), null]};
        
    } else if(args[1].cons){
        return { "cons": [
            evalExpr(args[0], defs), 
            consApp(args[1].cons, defs)
        ]};
        
    } else {
        return {"pair": [
            evalExpr(args[0], defs), 
            evalExpr(args[1], defs)
        ]};
    }
}

/* Array-of-Expr, Array-of-Expr -> Expr */
function carApp(args, defs){
    var arg = args[0];
    var type = Object.getOwnPropertyNames(arg)[0];

    if(type === 'cons' || type === 'list' || type === 'pair' || type === 'cdr' || type === 'car'){
        return evalExpr(arg, defs);
    } else {
        return 'Not a list';
    }
}

/* Array-of-Expr, Array-of-Expr -> Expr */
function cdrApp(args, defs){
    var arg = args[0];
    var type = Object.getOwnPropertyNames(arg)[0];
    
    /*if(type === 'cons' || type === 'list' || type === 'pair' || type === 'cdr'){
        // check for user definitions
        console.log(arg[type].slice(arg[type].length - 1)[0]);
        return evalExpr(arg[type].slice(arg[type].length - 1)[0], defs);
    } else {
    // (car (cdr (cons 5 (cons 4 '())))) is not a list?
    // if an operation returns a list, it should be an array of list items
        return 'Not a list';
    }*/
    return evalExpr(arg[type].slice(arg[type].length - 1)[0], defs);
}

/* Number -> Number or Error */
function checkIfNumber(n){
    if(typeof(n) === 'number' && !Number.isNaN(n)){
        return n;
    } else {
        throw new Error(`Not a number: ${n}`);
    }
}

/* Boolean -> Boolean or Error */
function checkIfBoolean(b){
    if(typeof(b) === 'boolean'){
        return b;
    } else {
        throw new Error(`Not a boolean: ${b}`);
    }
}

/* Object, String -> Boolean */
function hasProp(obj, prop){
    return obj.hasOwnProperty(prop);
}

/* Array, [object -> Boolean] -> Boolean 
    compares the values of an Array using cmp  */
function cmpArr(arr, cmp){
    if(arr.length < 2){
        return true;
    } else {
        if(cmp(arr[0], arr[1])){
            return cmpArr(arr.slice(1), cmp);
        } else {
            return false;
        }
    }
}

