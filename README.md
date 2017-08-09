# Ugly Scheme

A gradual attempt to implement a Scheme-like language with valid JSON.

    {"define": ["sum-sq", ["a", "b"], 
        {"+": [
            {"*": ["a", "a"], 
            {"*": ["b", "b"]}}]}]}
            
    {"sum-sq": [3, 4]} // 25

### Library:
Bolded terms have yet to be implemented
##### definitions
- define
- **let**
##### booleans
- and
- or
- not
- **boolean?**
- **number?**
- **string?**
- null?
- ">"
- "<"
- ">="
- "<="
- **eq?**      // most discriminating -> === 
- **eqv?**     // in between, open for interpretation
- **equal?**   // least discriminating -> ==
##### arithmetic
- "+"
- "*"
- "-"
- "/"
- "%" (modulo)
- **max**
- **min**
- **floor**
- **ceiling**
- **truncate**
##### strings
- **string-length**
- **string-ref**
- **string-append**
##### conditionals
- if
- cond/else
### datatypes
- booleans
- numbers
- **strings**
- **structs**
- lists
    - car
    - cons

