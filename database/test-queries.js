/**
 * Tree-sitter Query Validator
 * Tests each rule against sample code to ensure the queries work correctly.
 */

const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

// Initialize parser
const parser = new Parser();
parser.setLanguage(JavaScript);

// Sample code containing various patterns to test against
const sampleCode = `
// Security Issues
const apiKey = "sk-1234567890abcdef";
const password = "secret123";
const API_SECRET = "my-secret-key";
const jwtSecret = "super-secret-jwt";

eval("console.log('dangerous')");
new Function("return 1 + 2");

document.getElementById("app").innerHTML = "<script>alert('xss')</script>";
document.write("Hello World");

const url = "http://insecure-api.com/data";
setTimeout("alert('hello')", 1000);

// eslint-disable-next-line no-console
console.log("debug");

const query = "SELECT * FROM users WHERE id = " + id;

// Naming Issues
function Get_User_Data() { return {}; }
function GetUserData() { return {}; }
const user_name = "John";
const UserName = "Jane";

class userService {}
class UserService {}

const CONSTANT_VALUE = 42;
const constantValue = 100;

const x = 10;
const a = "single letter";

const usr = "abbreviated";
const msg = "message";

const active = true;
const isActive = true;
const hasPermission = false;

class MyClass {
  _privateMethod() {}
  _PrivateMethod() {}
}

// Style Issues
console.log("Hello World");
debugger;

// TODO: Fix this later
// FIXME: This is broken

try {
  riskyOperation();
} catch (e) {}

var oldVariable = "legacy";
let newVariable = "modern";

if (x == 5) {}
if (x === 5) {}
if (y != 10) {}
if (y !== 10) {}

const result = x > 5 ? (x > 10 ? "big" : "medium") : "small";

alert("Warning!");
confirm("Are you sure?");

function emptyFunction() {}

function tooManyParams(a, b, c, d, e) {}

async function fetchDataAsync() {}
async function fetchData() {}

// React patterns
const Button = () => <button onClick={handleClick}>Click</button>;
const button = () => <button>Bad</button>;

export default () => {};
export default function NamedExport() {}
`;

// Rules to test (simplified versions)
const rulesToTest = [
  {
    name: "No eval()",
    query: `(call_expression
      function: (identifier) @fn
      (#eq? @fn "eval")
    )`,
    shouldMatch: true
  },
  {
    name: "No console.log",
    query: `(call_expression
      function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @prop
        (#eq? @obj "console")
        (#eq? @prop "log")
      )
    )`,
    shouldMatch: true
  },
  {
    name: "No debugger",
    query: `(debugger_statement) @debugger`,
    shouldMatch: true
  },
  {
    name: "No var",
    query: `(variable_declaration
      kind: "var"
    ) @var_decl`,
    shouldMatch: true
  },
  {
    name: "Loose equality ==",
    query: `(binary_expression
      operator: "=="
    ) @loose_equality`,
    shouldMatch: true
  },
  {
    name: "No alert()",
    query: `(call_expression
      function: (identifier) @fn
      (#eq? @fn "alert")
    )`,
    shouldMatch: true
  },
  {
    name: "TODO comments",
    query: `(comment) @comment
      (#match? @comment "(?i)(TODO|FIXME)")`,
    shouldMatch: true
  },
  {
    name: "Function starting with uppercase",
    query: `(function_declaration
      name: (identifier) @fn_name
      (#match? @fn_name "^[A-Z]")
    )`,
    shouldMatch: true
  },
  {
    name: "Class starting with lowercase",
    query: `(class_declaration
      name: (identifier) @class_name
      (#match? @class_name "^[a-z]")
    )`,
    shouldMatch: true
  },
  {
    name: "Async function not ending with Async",
    query: `(function_declaration
      "async"
      name: (identifier) @fn_name
      (#not-match? @fn_name "Async$")
    )`,
    shouldMatch: true
  }
];

// Run tests
console.log('🧪 Testing Tree-sitter Queries...\n');

const tree = parser.parse(sampleCode);
let passed = 0;
let failed = 0;

for (const rule of rulesToTest) {
  try {
    const query = new Parser.Query(JavaScript, rule.query);
    const matches = query.matches(tree.rootNode);
    
    if (rule.shouldMatch && matches.length > 0) {
      console.log(`✅ ${rule.name}: ${matches.length} matches`);
      passed++;
    } else if (!rule.shouldMatch && matches.length === 0) {
      console.log(`✅ ${rule.name}: No matches (expected)`);
      passed++;
    } else {
      console.log(`❌ ${rule.name}: Expected ${rule.shouldMatch ? 'matches' : 'no matches'}, got ${matches.length}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${rule.name}: Query error - ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
