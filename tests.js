/**** TESTING ****/
/* test objects */
var def0 = funcDef('sum-sq', ['a', 'b'], 
                   funcApp('add', 
                           [funcApp('mul', 'a', 'a'), 
                            funcApp('mul', 'b', 'b')]));
var def1 = funcDef('cube', ['a'], 
                   funcApp('mul', 'a', 'a', 'a'));
var def2 = funcDef('mul-cube', 'a', 
                   funcApp('mul', 
                           funcApp('cube', 'a'), 3));
var def3 = funcDef('by-3', ['a', 'b', 'c'], 
                   funcApp('mul', 'a', 'b', 'c'))
var def4 = funcDef('two-trues', ['a'], funcApp('and', 'true', 'a'));
var def5 = conDef('near-pi', 3.14);

DEFINED.push(def0);
DEFINED.push(def1);
DEFINED.push(def2);
DEFINED.push(def3);
DEFINED.push(def4);
DEFINED.push(def5);


function isEqual(a, b){
    return a === b;
}

/* Error, Error -> Boolean */
function isError(err, expected){
    return err.message === expected.message;
}

/* { test: Function-Name, actual: Function-Expr, expected: Expr }
    if an expression attempts to operate on a non valid type,
    the program will immediately exit with an error 
    EX: evalExpr(funcApp('add', 3, 'c'))  */
var tests = [
    /* error testing */
    /*{
        test: isError,
        actual: evalExpr({ f: 4 }),
        expected: new Error('Invalid function name')
    },*/
    {
        test: isError,
        actual: evalExpr(undefined),
        expected: new Error('Undefined')
    },
    
    /* evalExpr testing */
    {
        test: isEqual,
        actual: evalExpr(funcApp('add', 1, 5, 6, 7)),
        expected: 19
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('mul', 1,2,4)),
        expected: 8
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('add', 1, 5, 
                                 funcApp('mul', 3, 
                                         funcApp('add', 4, 5)))),
        expected: 33
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('subt', 5, 4)),
        expected: 1
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('subt', 3, funcApp('mul', 3, 4))),
        expected: -9
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('gtEq', 3, 3, 1)),
        expected: true
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('ltEq', 1, 1, 3)),
        expected: true
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('gtEq', 3, 4, 1)),
        expected: false
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('gtEq', 1,3,1)),
        expected: false
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('div', 12,3,2)),
        expected: 2
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('div', 12,5,2)),
        expected: 1.2
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('div', 12,0)),
        expected: Infinity
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('modDiv', 12, 2)),
        expected: 0
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('modDiv', 15, 2)),
        expected: 1
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('if', 
                                 funcApp('or', 'true', 'false'), 5, 6)),
        expected: 5
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('if', 
                                 funcApp('or', 
                                         funcApp('lt', 3, 4),
                                         funcApp('gtEq', 5, 5)), true, false)),
        expected: true
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('cond', 
                                 [[funcApp('or', 'false', 'false'), 5],
                                 ['else', 6]])),
        expected: 6
    },
    
    /* variable substitution */
    {
        test: isEqual,
        actual: evalExpr(substitute(funcApp('subt', 'v', 4, 
                                            funcApp('add', 7,'v', 9)), 'v', 5)),
        expected: -20
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('and', 'true', 'true', 
                                 funcApp('not', 'false'))),
        expected: true
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('cube', 9)),
        expected: 729
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('cube', 0)),
        expected: 0
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('cube', 1)),
        expected: 1
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('cube', -2)),
        expected: -8
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('mul-cube', 9)),
        expected: 2187
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('mul-cube', 0.5)),
        expected: 0.375
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('mul-cube', 1)),
        expected: 3
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('two-trues', 'false')),
        expected: false
    },
    {
        test: isEqual,
        actual: evalExpr(funcApp('two-trues', 'true')),
        expected: true
    }
];

function runTests(ts){
    var testsNum = ts.length;
    var testsRan = 0;
    
    ts.forEach((i) => {
        var test = i.test(i.expected, i.actual);

        if(test){
            testsRan++;
        } else {
            console.log(`Expected: ${i.expected} | Actual: ${i.actual}`);
        }
    });
    
    console.log(`Tests Ran: ${testsNum}\nTests Failed: ${testsNum - testsRan}`);
}

runTests(tests);
