// Run with: node tests/interp.test.js
const { run, formatG } = require('../www/js/interp.js');
let fails = 0, count = 0;
function t(name, src, input, expect) {
  count++;
  const r = run(src, input);
  let ok;
  if (expect.error) ok = !r.ok && (expect.error === true || r.message.includes(expect.error));
  else ok = r.ok && r.stdout === expect.out;
  if (!ok) { fails++; console.log('FAIL', name, JSON.stringify(r), 'expected', JSON.stringify(expect)); }
}
const H = '#include <iostream>\n';

t('hello', H + 'int main(){ std::cout << "Hello, world!\\n"; return 0; }', '', { out: 'Hello, world!\n' });
t('using', H + 'using namespace std;\nint main(){ cout << 1 + 2 << endl; }', '', { out: '3\n' });
t('init forms', H + 'int main(){ int a = 5; int b(6); int c{7}; int d{}; std::cout << a << b << c << d; }', '', { out: '5670' });
t('narrowing', H + 'int main(){ int x{4.5}; }', '', { error: 'narrowing' });
t('copy trunc', H + 'int main(){ int x = 4.9; std::cout << x; }', '', { out: '4' });
t('uninit', H + 'int main(){ int x; std::cout << x; }', '', { error: 'Undefined behavior' });
t('uninit then cin', H + 'int main(){ int x; std::cin >> x; std::cout << x * 2; }', '21', { out: '42' });
t('cin two', H + 'int main(){ int a, b; std::cin >> a >> b; std::cout << a + b << "\\n"; }', '3 4', { out: '7\n' });
t('int div', H + 'int main(){ std::cout << 7 / 2 << " " << 7 % 2 << " " << -7 / 2 << " " << -7 % 3; }', '', { out: '3 1 -3 -1' });
t('double div', H + 'int main(){ std::cout << 7.0 / 2 << " " << 1.0/3 << " " << 100000.0 << " " << 1e6 << " " << 0.0001; }', '', { out: '3.5 0.333333 100000 1e+06 0.0001' });
t('div zero', H + 'int main(){ int z{0}; std::cout << 1 / z; }', '', { error: 'division by zero' });
t('bool/char', H + 'int main(){ char c{\'a\'}; bool b{true}; std::cout << c << b << (c + 1) << static_cast<char>(c + 1); }', '', { out: 'a198b' });
t('string', H + 'int main(){ std::string s{"hi"}; s += " there"; std::cout << s << s.length(); }', '', { out: 'hi there8' });
t('if/else', H + 'int main(){ int x{5}; if (x > 3) std::cout << "big"; else std::cout << "small"; }', '', { out: 'big' });
t('while', H + 'int main(){ int i{0}; while (i < 3) { std::cout << i; ++i; } }', '', { out: '012' });
t('for/continue', H + 'int main(){ for (int i{0}; i < 5; ++i) { if (i == 2) continue; std::cout << i; } }', '', { out: '0134' });
t('do', H + 'int main(){ int i{0}; do { i++; } while (i < 5); std::cout << i; }', '', { out: '5' });
t('func', H + 'int add(int a, int b){ return a + b; }\nint main(){ std::cout << add(2, 3); }', '', { out: '5' });
t('proto', H + 'int sq(int);\nint main(){ std::cout << sq(4); }\nint sq(int x){ return x * x; }', '', { out: '16' });
t('call before decl', H + 'int main(){ std::cout << sq(4); }\nint sq(int x){ return x * x; }', '', { error: 'not declared' });
t('recursion', H + 'int f(int n){ return n <= 1 ? 1 : n * f(n - 1); }\nint main(){ std::cout << f(5); }', '', { out: '120' });
t('ref param', H + 'void inc(int& x){ x++; }\nint main(){ int a{1}; inc(a); inc(a); std::cout << a; }', '', { out: '3' });
t('no semicolon', H + 'int main(){ int x{1} std::cout << x; }', '', { error: "expected ';'" });
t('undeclared', H + 'int main(){ std::cout << y; }', '', { error: 'not declared' });
t('no std', H + 'int main(){ cout << 1; }', '', { error: "did you mean 'std::cout'" });
t('no include', 'int main(){ std::cout << 1; }', '', { error: 'iostream' });
t('redecl', H + 'int main(){ int x; int x; }', '', { error: 'redeclaration' });
t('const assign', H + 'int main(){ const int x{1}; x = 2; }', '', { error: 'read-only' });
t('infinite loop', H + 'int main(){ while (true) {} }', '', { error: 'too long' });
t('recursion depth', H + 'int f(int n){ return f(n + 1); }\nint main(){ return f(0); }', '', { error: 'Stack overflow' });
t('global zero', H + 'int g;\nint main(){ std::cout << g; }', '', { out: '0' });
t('auto', H + 'int main(){ auto a = 5; auto b = 2.5; auto c = \'x\'; std::cout << a << b << c; }', '', { out: '52.5x' });
t('comments', H + 'int main(){ std::cout << "A"; // std::cout << "B";\n /* std::cout << "C"; */ std::cout << "D"; }', '', { out: 'AD' });
t('nested comment', H + 'int main(){ /* a /* b */ c */ }', '', { error: true });
t('multi-line string cat', H + 'int main(){ std::cout << "Hello, " "World"; }', '', { out: 'Hello, World' });
t('getline', H + 'int main(){ std::string s; std::getline(std::cin, s); std::cout << "[" << s << "]"; }', 'hello world\nx', { out: '[hello world]' });
t('compound', H + 'int main(){ int x{10}; x += 5; x *= 2; x -= 1; x /= 3; x %= 5; std::cout << x; }', '', { out: '4' });
t('short circuit', H + 'int main(){ int x{0}; if (x != 0 && 10 / x > 1) std::cout << "a"; else std::cout << "b"; }', '', { out: 'b' });
t('post/pre', H + 'int main(){ int x{5}; std::cout << x++ << x << ++x; }', '', { out: '567' });
t('unsigned wrap', H + 'int main(){ unsigned int u{0}; --u; std::cout << u; }', '', { out: '4294967295' });
t('int overflow wrap', H + 'int main(){ int x{2147483647}; x = x + 1; std::cout << x; }', '', { out: '-2147483648' });
t('sizeof', H + 'int main(){ std::cout << sizeof(int) << sizeof(double); }', '', { out: '48' });
t('missing brace', H + 'int main(){ int x{1};', '', { error: "expected '}'" });
t('void return val', H + 'void f(){ return 1; }\nint main(){}', '', { error: 'void' });
t('main no return ok', H + 'int main(){ }', '', { out: '' });
t('2fast', H + 'int main(){ int 2fast; }', '', { error: true });
t('keyword name', H + 'int main(){ int return{1}; }', '', { error: true });
t('formatG', '', '', { error: true });
if (formatG(123456789) !== '1.23457e+08') { fails++; console.log('FAIL formatG big'); }
if (formatG(0.1 + 0.2) !== '0.3') { fails++; console.log('FAIL formatG 0.3'); }
console.log(fails ? fails + ' of ' + count + ' tests FAILED' : 'all ' + count + ' interpreter tests passed');
process.exit(fails ? 1 : 0);
