/*
 * CodeTrail mini C++ interpreter (phase 1 subset)
 * ------------------------------------------------
 * Runs a useful beginner subset of C++ entirely offline so exercises can be
 * checked inside the app. It is NOT a real compiler: it supports
 *   - #include <...>, using namespace std, int main()
 *   - int/short/long/unsigned/double/float/bool/char/std::string/auto, const
 *   - copy / direct / brace / empty-brace initialization (+ narrowing errors)
 *   - std::cout / std::cin / std::endl / std::getline
 *   - arithmetic, comparison, logical, bitwise, assignment, ++/--, ?:
 *   - if/else, while, do-while, for, break, continue, return
 *   - functions (value + reference params, prototypes, recursion)
 *   - static_cast, C-style casts, sizeof(type), a few <cmath>/<algorithm> helpers
 *   - a handful of std::string members (length, size, empty, at, substr, [])
 * Unsupported syntax produces a clear compile error instead of wrong output.
 * Later phases extend this file (arrays, vectors, pointers, classes, ...).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CppInterp = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------------------------------------------- errors */
  class CppError extends Error {
    constructor(kind, msg, line) { super(msg); this.kind = kind; this.line = line || 0; }
  }
  const cErr = (msg, line) => new CppError('compile', msg, line);
  const rErr = (msg, line) => new CppError('runtime', msg, line);

  /* ---------------------------------------------------------------- values */
  const mk = (t, v) => ({ t, v });
  const INTLIKE = new Set(['int', 'uint', 'short', 'long', 'char', 'bool']);
  const FLOATLIKE = new Set(['double', 'float']);
  const tname = (t) => ({ uint: 'unsigned int', string: 'std::string' }[t] || t);

  function formatG(x, P) {
    P = P || 6;
    if (Number.isNaN(x)) return 'nan';
    if (!Number.isFinite(x)) return x < 0 ? '-inf' : 'inf';
    if (x === 0) return Object.is(x, -0) ? '-0' : '0';
    const e = x.toExponential(P - 1);
    const parts = e.split('e');
    const X = parseInt(parts[1], 10);
    if (X < -4 || X >= P) {
      let m = parts[0];
      if (m.indexOf('.') >= 0) m = m.replace(/\.?0+$/, '');
      let digits = parts[1].slice(1);
      if (digits.length < 2) digits = '0' + digits;
      return m + 'e' + parts[1][0] + digits;
    }
    let f = x.toFixed(Math.max(0, P - 1 - X));
    if (f.indexOf('.') >= 0) f = f.replace(/\.?0+$/, '');
    return f;
  }

  function fmt(val) {
    switch (val.t) {
      case 'string': return val.v;
      case 'char': return String.fromCharCode(val.v & 255);
      case 'bool': return val.v ? '1' : '0';
      case 'double': case 'float': return formatG(val.v, 6);
      default: return String(val.v);
    }
  }

  function coerce(type, val, line, brace) {
    if (type === 'string') {
      if (val.t === 'string') return val;
      throw cErr("conversion from '" + tname(val.t) + "' to 'std::string' is not possible", line);
    }
    if (val.t === 'string') throw cErr("cannot convert 'std::string' to '" + type + "' in initialization", line);
    if (val.t === 'ostream' || val.t === 'istream' || val.t === 'manip')
      throw cErr("cannot convert a stream to '" + type + "'", line);
    let v = val.v;
    if (brace && FLOATLIKE.has(val.t) && INTLIKE.has(type))
      throw cErr("narrowing conversion of '" + fmt(val) + "' from '" + val.t + "' to '" + type + "' [-Wnarrowing]", line);
    if (INTLIKE.has(type) && type !== 'bool' && FLOATLIKE.has(val.t)) v = Number.isFinite(v) ? Math.trunc(v) : 0;
    switch (type) {
      case 'int': return mk('int', v | 0);
      case 'uint': return mk('uint', v >>> 0);
      case 'short': return mk('short', (v << 16) >> 16);
      case 'long': return mk('long', v);
      case 'char': return mk('char', (v << 24) >> 24);
      case 'bool': return mk('bool', v !== 0 ? 1 : 0);
      case 'double': return mk('double', v);
      case 'float': return mk('float', Math.fround(v));
    }
    throw cErr("unsupported type '" + type + "'", line);
  }

  const zeroOf = (type) => (type === 'string' ? mk('string', '') : mk(type, 0));

  function promote(a, b) {
    if (a === 'double' || b === 'double') return 'double';
    if (a === 'float' || b === 'float') return 'float';
    if (a === 'long' || b === 'long') return 'long';
    if (a === 'uint' || b === 'uint') return 'uint';
    return 'int';
  }
  const wrapInt = (rt, r) => (rt === 'int' ? r | 0 : rt === 'uint' ? r >>> 0 : r);

  function arith(op, a, b, line) {
    if (a.t === 'ostream' || a.t === 'istream' || b.t === 'ostream' || b.t === 'istream' || a.t === 'manip' || b.t === 'manip')
      throw cErr("invalid operands to binary 'operator" + op + "'", line);
    if (a.t === 'string' || b.t === 'string') {
      if (a.t === 'string' && b.t === 'string') {
        switch (op) {
          case '+': return mk('string', a.v + b.v);
          case '==': return mk('bool', a.v === b.v ? 1 : 0);
          case '!=': return mk('bool', a.v !== b.v ? 1 : 0);
          case '<': return mk('bool', a.v < b.v ? 1 : 0);
          case '>': return mk('bool', a.v > b.v ? 1 : 0);
          case '<=': return mk('bool', a.v <= b.v ? 1 : 0);
          case '>=': return mk('bool', a.v >= b.v ? 1 : 0);
        }
      }
      if (op === '+' && a.t === 'string' && b.t === 'char') return mk('string', a.v + fmt(b));
      throw cErr("no match for 'operator" + op + "' (operand types are '" + tname(a.t) + "' and '" + tname(b.t) + "')", line);
    }
    const rt = promote(a.t, b.t);
    const x = a.v, y = b.v;
    const isF = rt === 'double' || rt === 'float';
    const fin = (r) => (rt === 'float' ? mk('float', Math.fround(r)) : mk(rt, r));
    switch (op) {
      case '+': return isF ? fin(x + y) : mk(rt, wrapInt(rt, x + y));
      case '-': return isF ? fin(x - y) : mk(rt, wrapInt(rt, x - y));
      case '*':
        if (isF) return fin(x * y);
        if (rt === 'int') return mk('int', Math.imul(x, y));
        if (rt === 'uint') return mk('uint', Math.imul(x, y) >>> 0);
        return mk(rt, x * y);
      case '/':
        if (isF) return fin(x / y);
        if (y === 0) throw rErr('Undefined behavior: integer division by zero', line);
        return mk(rt, wrapInt(rt, Math.trunc(x / y)));
      case '%':
        if (isF) throw cErr("invalid operands of types '" + a.t + "' and '" + b.t + "' to binary 'operator%'", line);
        if (y === 0) throw rErr('Undefined behavior: integer remainder by zero', line);
        return mk(rt, wrapInt(rt, x % y) + 0);
      case '==': return mk('bool', x === y ? 1 : 0);
      case '!=': return mk('bool', x !== y ? 1 : 0);
      case '<': return mk('bool', x < y ? 1 : 0);
      case '>': return mk('bool', x > y ? 1 : 0);
      case '<=': return mk('bool', x <= y ? 1 : 0);
      case '>=': return mk('bool', x >= y ? 1 : 0);
      case '&': case '|': case '^': case '<<': case '>>': {
        if (isF) throw cErr("invalid operands of types '" + a.t + "' and '" + b.t + "' to binary 'operator" + op + "'", line);
        let r;
        if (op === '&') r = x & y; else if (op === '|') r = x | y; else if (op === '^') r = x ^ y;
        else if (op === '<<') r = x << y; else r = rt === 'uint' ? x >>> y : x >> y;
        return mk(rt === 'long' ? 'long' : rt, rt === 'uint' ? r >>> 0 : r);
      }
    }
    throw cErr("unsupported operator '" + op + "'", line);
  }

  /* ------------------------------------------------------------- tokenizer */
  function tokenize(src) {
    const toks = [], includes = [];
    const n = src.length;
    let i = 0, line = 1;
    const isDigit = (c) => c >= '0' && c <= '9';
    const OPS3 = ['<<=', '>>='];
    const OPS2 = ['::', '++', '--', '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '->'];
    const OPS1 = '+-*/%=<>!(){}[];,.?:&|^~';
    const ESC = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v' };
    function unescape(j) {
      const e = src[j + 1];
      if (e === 'x') {
        let k = j + 2, h = '';
        while (k < n && /[0-9a-fA-F]/.test(src[k]) && h.length < 2) h += src[k++];
        return { ch: String.fromCharCode(parseInt(h || '0', 16)), next: k };
      }
      return { ch: ESC[e] !== undefined ? ESC[e] : e, next: j + 2 };
    }
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') {
        const start = line; i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        if (i >= n) throw cErr('unterminated /* comment', start);
        i += 2; continue;
      }
      if (c === '#') {
        let j = i; while (j < n && src[j] !== '\n') j++;
        const text = src.slice(i, j).trim();
        const m = /^#\s*include\s*[<"]([^>"]+)[>"]/.exec(text);
        if (m) includes.push(m[1]);
        else if (!/^#\s*pragma/.test(text))
          throw cErr('preprocessor directives other than #include are not supported in this mini C++ yet', line);
        i = j; continue;
      }
      if (isDigit(c) || (c === '.' && isDigit(src[i + 1] || ''))) {
        let j = i, isFloat = false, val;
        if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
          j = i + 2; while (j < n && /[0-9a-fA-F']/.test(src[j])) j++;
          val = parseInt(src.slice(i + 2, j).replace(/'/g, ''), 16);
        } else if (c === '0' && (src[i + 1] === 'b' || src[i + 1] === 'B')) {
          j = i + 2; while (j < n && /[01']/.test(src[j])) j++;
          val = parseInt(src.slice(i + 2, j).replace(/'/g, ''), 2);
        } else {
          while (j < n && /[0-9']/.test(src[j])) j++;
          if (src[j] === '.') { isFloat = true; j++; while (j < n && /[0-9']/.test(src[j])) j++; }
          if (src[j] === 'e' || src[j] === 'E') {
            let k = j + 1; if (src[k] === '+' || src[k] === '-') k++;
            if (isDigit(src[k] || '')) { isFloat = true; j = k; while (j < n && isDigit(src[j])) j++; }
          }
          const text = src.slice(i, j).replace(/'/g, '');
          if (!isFloat && text.length > 1 && text[0] === '0') {
            if (/[89]/.test(text)) throw cErr("invalid digit in octal constant", line);
            val = parseInt(text, 8);
          } else val = parseFloat(text);
        }
        let s = j; while (s < n && /[uUlLfF]/.test(src[s])) s++;
        const suffix = src.slice(j, s).toLowerCase();
        if (s < n && /[A-Za-z0-9_]/.test(src[s])) {
          let e = s; while (e < n && /[A-Za-z0-9_]/.test(src[e])) e++;
          throw cErr('invalid suffix "' + src.slice(j, e) + '" on ' + (isFloat ? 'floating' : 'integer') + ' constant', line);
        }
        let type;
        if (isFloat || suffix === 'f') type = suffix === 'f' ? 'float' : 'double';
        else if (suffix.indexOf('u') >= 0) type = 'uint';
        else if (suffix.indexOf('l') >= 0 || val > 2147483647) type = 'long';
        else type = 'int';
        if (type === 'float') val = Math.fround(val);
        toks.push({ t: 'num', val: mk(type, val), line });
        i = s; continue;
      }
      if (c === '"') {
        let j = i + 1, s = '';
        while (j < n && src[j] !== '"') {
          if (src[j] === '\n') throw cErr('missing terminating " character', line);
          if (src[j] === '\\') { const r = unescape(j); s += r.ch; j = r.next; } else s += src[j++];
        }
        if (j >= n) throw cErr('missing terminating " character', line);
        toks.push({ t: 'str', v: s, line }); i = j + 1; continue;
      }
      if (c === "'") {
        let j = i + 1, ch;
        if (src[j] === '\\') { const r = unescape(j); ch = r.ch; j = r.next; }
        else if (src[j] === "'" || src[j] === '\n' || j >= n) throw cErr('empty character constant', line);
        else ch = src[j++];
        if (src[j] !== "'") throw cErr("missing terminating ' character (multi-character constants are not supported)", line);
        toks.push({ t: 'chr', v: ch.charCodeAt(0), line }); i = j + 1; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        toks.push({ t: 'id', v: src.slice(i, j), line }); i = j; continue;
      }
      const t3 = src.substr(i, 3), t2 = src.substr(i, 2);
      if (OPS3.indexOf(t3) >= 0) { toks.push({ t: 'op', v: t3, line }); i += 3; continue; }
      if (OPS2.indexOf(t2) >= 0) { toks.push({ t: 'op', v: t2, line }); i += 2; continue; }
      if (OPS1.indexOf(c) >= 0) { toks.push({ t: 'op', v: c, line }); i++; continue; }
      throw cErr("stray '" + c + "' in program", line);
    }
    toks.push({ t: 'eof', v: '', line });
    return { toks, includes };
  }

  /* ---------------------------------------------------------------- parser */
  const TYPE_WORDS = new Set(['int', 'double', 'float', 'bool', 'char', 'void', 'auto', 'short', 'long', 'unsigned', 'signed']);
  const RESERVED = new Set(['int', 'double', 'float', 'bool', 'char', 'void', 'auto', 'short', 'long', 'unsigned', 'signed',
    'if', 'else', 'while', 'for', 'do', 'return', 'break', 'continue', 'const', 'switch', 'case', 'default', 'class', 'struct',
    'namespace', 'using', 'new', 'delete', 'typedef', 'enum', 'goto', 'static', 'template', 'try', 'catch', 'throw']);
  const STD_NAMES = new Set(['cout', 'cin', 'endl', 'string', 'getline', 'abs', 'sqrt', 'pow', 'min', 'max']);
  const NEEDS_STD = new Set(['cout', 'cin', 'endl', 'string', 'getline', 'min', 'max']);
  const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=']);
  const PREC = {
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10
  };
  const SIZES = { char: 1, bool: 1, short: 2, int: 4, uint: 4, long: 8, float: 4, double: 8, string: 32 };

  function desc(t) {
    if (t.t === 'eof') return 'end of input';
    if (t.t === 'str') return '"' + t.v + '"';
    if (t.t === 'num') return "'" + fmt(t.val) + "'";
    if (t.t === 'chr') return "'" + String.fromCharCode(t.v) + "'";
    return "'" + t.v + "'";
  }

  class Parser {
    constructor(toks, includes) {
      this.toks = toks; this.includes = includes; this.p = 0;
      this.scopes = [new Map()];
      this.fns = new Map();
      this.defined = new Set();
      this.usingStd = false;
      this.usesIO = null;
      this.curFn = null;
      this.loopDepth = 0;
    }
    peek(o) { return this.toks[Math.min(this.p + (o || 0), this.toks.length - 1)]; }
    next() { return this.toks[this.p++]; }
    isOp(v, o) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
    isId(v, o) { const t = this.peek(o); return t.t === 'id' && t.v === v; }
    acceptOp(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
    prevLine() { return this.toks[Math.max(0, this.p - 1)].line; }
    expectOp(v) {
      const t = this.peek();
      if (t.t === 'op' && t.v === v) { this.p++; return t; }
      throw cErr("expected '" + v + "' before " + desc(t), v === ';' ? this.prevLine() : t.line);
    }
    expectSemi() { return this.expectOp(';'); }
    expectIdent() {
      const t = this.peek();
      if (t.t !== 'id' || RESERVED.has(t.v)) throw cErr('expected unqualified-id before ' + desc(t), t.line);
      this.p++; return t;
    }
    lookupVar(name) {
      for (let i = this.scopes.length - 1; i >= 0; i--) { const v = this.scopes[i].get(name); if (v) return v; }
      return null;
    }
    declareVar(name, isConst, line) {
      const top = this.scopes[this.scopes.length - 1];
      if (top.has(name)) throw cErr("redeclaration of '" + name + "'", line);
      top.set(name, { const: !!isConst });
    }
    isTypeStart(o) {
      const t = this.peek(o);
      if (t.t !== 'id') return false;
      if (t.v === 'const' || t.v === 'string' || TYPE_WORDS.has(t.v)) return true;
      return t.v === 'std' && this.isOp('::', (o || 0) + 1) && this.isId('string', (o || 0) + 2);
    }
    parseType() {
      let isConst = false;
      const words = [];
      for (;;) {
        const t = this.peek();
        if (t.t !== 'id') break;
        if (t.v === 'const') { isConst = true; this.p++; continue; }
        if (t.v === 'std' && this.isOp('::', 1) && this.isId('string', 2)) { this.p += 3; words.push('string'); continue; }
        if (t.v === 'string') {
          if (!this.usingStd) throw cErr("'string' does not name a type (did you mean 'std::string'?)", t.line);
          this.p++; words.push('string'); continue;
        }
        if (TYPE_WORDS.has(t.v)) { this.p++; words.push(t.v); continue; }
        break;
      }
      if (!words.length) throw cErr('expected a type before ' + desc(this.peek()), this.peek().line);
      const has = (w) => words.indexOf(w) >= 0;
      let name;
      if (has('string')) name = 'string';
      else if (has('double')) name = 'double';
      else if (has('float')) name = 'float';
      else if (has('bool')) name = 'bool';
      else if (has('char')) name = 'char';
      else if (has('void')) name = 'void';
      else if (has('auto')) name = 'auto';
      else if (has('long')) name = 'long';
      else if (has('short')) name = 'short';
      else if (has('unsigned')) name = 'uint';
      else name = 'int';
      return { name, const: isConst };
    }

    parseProgram() {
      const funcs = new Map(), globals = [];
      while (this.peek().t !== 'eof') {
        if (this.isId('using')) {
          const t = this.next();
          if (this.isId('namespace') && this.isId('std', 1)) this.usingStd = true;
          else if (!(this.isId('std') && this.isOp('::', 1)) && !this.isId('namespace'))
            throw cErr('unsupported using-declaration', t.line);
          while (!this.isOp(';') && this.peek().t !== 'eof') this.p++;
          this.expectSemi(); continue;
        }
        if (!this.isTypeStart()) {
          const t = this.peek();
          throw cErr('expected declaration before ' + desc(t), t.line);
        }
        // function or global variable?
        const save = this.p;
        const type = this.parseType();
        const nameTok = this.expectIdent();
        if (this.isOp('(')) {
          const fn = this.parseFunction(type, nameTok);
          if (fn) funcs.set(fn.name, fn);
        } else {
          this.p = save;
          globals.push(this.parseDecl());
        }
      }
      if (!funcs.has('main')) throw cErr("undefined reference to 'main' (every program needs an int main() function)", 0);
      if (funcs.get('main').ret !== 'int') throw cErr("'main' must return 'int'", funcs.get('main').line);
      if (this.usesIO && this.includes.indexOf('iostream') < 0)
        throw cErr("'" + this.usesIO.name + "' is not a member of 'std' (did you forget #include <iostream>?)", this.usesIO.line);
      return { funcs, globals };
    }

    parseFunction(type, nameTok) {
      const name = nameTok.v, line = nameTok.line;
      this.expectOp('(');
      const params = [];
      if (!this.isOp(')')) {
        if (this.isId('void') && this.isOp(')', 1)) this.p++;
        else do {
          const pt = this.parseType();
          if (pt.name === 'void' || pt.name === 'auto') throw cErr("invalid parameter type '" + pt.name + "'", this.peek().line);
          let ref = false;
          if (this.isOp('&')) { this.p++; ref = true; }
          let pname = null;
          if (this.peek().t === 'id' && !RESERVED.has(this.peek().v)) pname = this.next().v;
          params.push({ type: pt.name, const: pt.const, ref, name: pname });
        } while (this.acceptOp(','));
      }
      this.expectOp(')');
      const prev = this.fns.get(name);
      if (prev && prev.params.length !== params.length)
        throw cErr("conflicting declaration of function '" + name + "'", line);
      const sig = { name, ret: type.name, params, line };
      this.fns.set(name, sig);
      if (this.acceptOp(';')) return null;
      if (this.defined.has(name)) throw cErr("redefinition of '" + name + "'", line);
      this.defined.add(name);
      if (!this.isOp('{')) throw cErr("expected '{' before " + desc(this.peek()), this.peek().line);
      this.scopes.push(new Map());
      for (const p of params) if (p.name) this.declareVar(p.name, p.const && !p.ref ? false : p.const, line);
      this.curFn = sig;
      const body = this.parseBlock(false);
      this.curFn = null;
      this.scopes.pop();
      return { name, ret: type.name, params, body, line };
    }

    parseBlock(newScope) {
      const open = this.expectOp('{');
      if (newScope !== false) this.scopes.push(new Map());
      const body = [];
      while (!this.isOp('}')) {
        if (this.peek().t === 'eof') throw cErr("expected '}' at end of input", open.line);
        body.push(this.parseStatement());
      }
      this.p++;
      if (newScope !== false) this.scopes.pop();
      return { k: 'block', body, noScope: newScope === false, line: open.line };
    }

    scopedStatement() {
      this.scopes.push(new Map());
      const s = this.parseStatement();
      this.scopes.pop();
      return s;
    }

    parseStatement() {
      const t = this.peek();
      if (t.t === 'op') {
        if (t.v === '{') return this.parseBlock(true);
        if (t.v === ';') { this.p++; return { k: 'empty', line: t.line }; }
      }
      if (t.t === 'id') {
        switch (t.v) {
          case 'if': {
            this.p++; this.expectOp('(');
            const c = this.parseExpr(); this.expectOp(')');
            const a = this.scopedStatement();
            let b = null;
            if (this.isId('else')) { this.p++; b = this.scopedStatement(); }
            return { k: 'if', c, a, b, line: t.line };
          }
          case 'while': {
            this.p++; this.expectOp('(');
            const c = this.parseExpr(); this.expectOp(')');
            this.loopDepth++; const body = this.scopedStatement(); this.loopDepth--;
            return { k: 'while', c, body, line: t.line };
          }
          case 'do': {
            this.p++;
            this.loopDepth++; const body = this.scopedStatement(); this.loopDepth--;
            if (!this.isId('while')) throw cErr("expected 'while' before " + desc(this.peek()), this.peek().line);
            this.p++; this.expectOp('(');
            const c = this.parseExpr(); this.expectOp(')'); this.expectSemi();
            return { k: 'do', c, body, line: t.line };
          }
          case 'for': {
            this.p++; this.expectOp('(');
            this.scopes.push(new Map());
            let init = null;
            if (this.isOp(';')) this.p++;
            else if (this.isTypeStart()) init = this.parseDecl();
            else { init = { k: 'expr', e: this.parseExpr(), line: t.line }; this.expectSemi(); }
            const c = this.isOp(';') ? null : this.parseExpr(); this.expectSemi();
            const s = this.isOp(')') ? null : this.parseExpr(); this.expectOp(')');
            this.loopDepth++; const body = this.scopedStatement(); this.loopDepth--;
            this.scopes.pop();
            return { k: 'for', init, c, s, body, line: t.line };
          }
          case 'return': {
            this.p++;
            let e = null;
            if (!this.isOp(';')) e = this.parseExpr();
            this.expectSemi();
            const ret = this.curFn ? this.curFn.ret : 'int';
            if (e && ret === 'void') throw cErr("return-statement with a value, in function returning 'void'", t.line);
            if (!e && ret !== 'void') throw cErr("return-statement with no value, in function returning '" + ret + "'", t.line);
            return { k: 'ret', e, line: t.line };
          }
          case 'break': case 'continue': {
            this.p++; this.expectSemi();
            if (!this.loopDepth) throw cErr(t.v + ' statement not within a loop', t.line);
            return { k: t.v === 'break' ? 'brk' : 'cnt', line: t.line };
          }
          case 'switch': case 'class': case 'struct': case 'enum': case 'typedef': case 'new': case 'delete': case 'goto': case 'try': case 'static': case 'template':
            throw cErr("'" + t.v + "' is not supported in this mini C++ yet (coming in a later phase)", t.line);
          case 'else':
            throw cErr("'else' without a previous 'if'", t.line);
        }
        if (this.isTypeStart()) return this.parseDecl();
      }
      const e = this.parseExpr();
      this.expectSemi();
      return { k: 'expr', e, line: t.line };
    }

    parseDecl() {
      const line = this.peek().line;
      const type = this.parseType();
      if (type.name === 'void') throw cErr("variable declared void", line);
      const decls = [];
      do {
        let ref = false;
        if (this.isOp('&')) { this.p++; ref = true; }
        const nameTok = this.expectIdent();
        let init = null, form = 'none';
        this.declareVar(nameTok.v, type.const, nameTok.line);
        if (this.isOp('=')) { this.p++; init = this.parseAssign(); form = 'copy'; }
        else if (this.isOp('{')) {
          this.p++;
          if (this.isOp('}')) form = 'brace-empty';
          else { init = this.parseAssign(); form = 'brace'; }
          this.expectOp('}');
        } else if (this.isOp('(')) { this.p++; init = this.parseAssign(); this.expectOp(')'); form = 'direct'; }
        if (type.name === 'auto' && !init) throw cErr("declaration of 'auto " + nameTok.v + "' has no initializer", nameTok.line);
        if (type.const && !init && form !== 'brace-empty') throw cErr("uninitialized const '" + nameTok.v + "'", nameTok.line);
        if (ref && (!init || init.k !== 'id')) throw cErr("a reference must be initialized with a variable", nameTok.line);
        decls.push({ name: nameTok.v, init, form, ref, line: nameTok.line });
      } while (this.acceptOp(','));
      this.expectSemi();
      return { k: 'decl', type: type.name, const: type.const, decls, line };
    }

    parseExpr() {
      let e = this.parseAssign();
      while (this.isOp(',')) { const t = this.next(); e = { k: 'comma', l: e, r: this.parseAssign(), line: t.line }; }
      return e;
    }
    isLvalue(n) { return n.k === 'id'; }
    checkAssignable(n, t) {
      if (!this.isLvalue(n)) throw cErr('lvalue required as left operand of assignment', t.line);
      const v = this.lookupVar(n.name);
      if (v && v.const) throw cErr("assignment of read-only variable '" + n.name + "'", t.line);
    }
    parseAssign() {
      const l = this.parseCond();
      const t = this.peek();
      if (t.t === 'op' && ASSIGN_OPS.has(t.v)) {
        this.p++;
        this.checkAssignable(l, t);
        const r = this.parseAssign();
        return { k: 'asg', op: t.v, l, r, line: t.line };
      }
      return l;
    }
    parseCond() {
      const c = this.parseBin(1);
      if (this.isOp('?')) {
        const t = this.next();
        const a = this.parseAssign(); this.expectOp(':');
        const b = this.parseAssign();
        return { k: 'cond', c, a, b, line: t.line };
      }
      return c;
    }
    parseBin(minPrec) {
      let l = this.parseUnary();
      for (;;) {
        const t = this.peek();
        if (t.t !== 'op' || !PREC[t.v] || PREC[t.v] < minPrec) break;
        this.p++;
        const r = this.parseBin(PREC[t.v] + 1);
        if (t.v === '&&' || t.v === '||') l = { k: 'log', op: t.v, l, r, line: t.line };
        else l = { k: 'bin', op: t.v, l, r, line: t.line };
      }
      return l;
    }
    parseUnary() {
      const t = this.peek();
      if (t.t === 'op') {
        if (t.v === '!' || t.v === '-' || t.v === '+' || t.v === '~') { this.p++; return { k: 'un', op: t.v, e: this.parseUnary(), line: t.line }; }
        if (t.v === '++' || t.v === '--') {
          this.p++;
          const e = this.parseUnary();
          this.checkAssignable(e, t);
          return { k: 'pre', op: t.v, e, line: t.line };
        }
        if (t.v === '(' && this.isTypeStart(1)) {
          this.p++;
          const ty = this.parseType();
          this.expectOp(')');
          return { k: 'cast', type: ty.name, e: this.parseUnary(), line: t.line };
        }
        if (t.v === '&' || t.v === '*') throw cErr('pointers and address-of are not supported in this mini C++ yet (coming in a later phase)', t.line);
      }
      if (t.t === 'id' && t.v === 'sizeof') {
        this.p++;
        if (this.isOp('(') && this.isTypeStart(1)) {
          this.p++; const ty = this.parseType(); this.expectOp(')');
          return { k: 'num', val: mk('uint', SIZES[ty.name] || 4), line: t.line };
        }
        const e = this.parseUnary();
        return { k: 'sizeof', e, line: t.line };
      }
      return this.parsePostfix();
    }
    parsePostfix() {
      let n = this.parsePrimary();
      for (;;) {
        const t = this.peek();
        if (t.t !== 'op') break;
        if (t.v === '++' || t.v === '--') {
          this.p++;
          this.checkAssignable(n, t);
          n = { k: 'post', op: t.v, e: n, line: t.line };
        } else if (t.v === '[') {
          this.p++; const i = this.parseExpr(); this.expectOp(']');
          n = { k: 'idx', obj: n, i, line: t.line };
        } else if (t.v === '.') {
          this.p++;
          const m = this.expectIdent();
          this.expectOp('(');
          const args = this.parseArgs();
          n = { k: 'method', obj: n, name: m.v, args, line: t.line };
        } else break;
      }
      return n;
    }
    parseArgs() {
      const args = [];
      if (!this.isOp(')')) do args.push(this.parseAssign()); while (this.acceptOp(','));
      this.expectOp(')');
      return args;
    }
    parsePrimary() {
      const t = this.next();
      switch (t.t) {
        case 'num': return { k: 'num', val: t.val, line: t.line };
        case 'chr': return { k: 'num', val: mk('char', t.v), line: t.line };
        case 'str': {
          let s = t.v;
          while (this.peek().t === 'str') s += this.next().v;
          return { k: 'num', val: mk('string', s), line: t.line };
        }
        case 'op':
          if (t.v === '(') { const e = this.parseExpr(); this.expectOp(')'); return e; }
          throw cErr('expected primary-expression before ' + desc(t), t.line);
        case 'eof': throw cErr('expected primary-expression before end of input', t.line);
      }
      // identifier
      let name = t.v, viaStd = false;
      if (name === 'true' || name === 'false') return { k: 'num', val: mk('bool', name === 'true' ? 1 : 0), line: t.line };
      if (name === 'std' && this.isOp('::')) {
        this.p++;
        const nt = this.next();
        if (nt.t !== 'id' || !STD_NAMES.has(nt.v)) throw cErr("'" + (nt.v || '?') + "' is not a member of 'std' (or not supported yet)", nt.line);
        name = nt.v; viaStd = true;
      }
      if (name === 'static_cast') {
        this.expectOp('<'); const ty = this.parseType(); this.expectOp('>');
        this.expectOp('('); const e = this.parseExpr(); this.expectOp(')');
        return { k: 'cast', type: ty.name, e, line: t.line };
      }
      if (RESERVED.has(name)) throw cErr('expected primary-expression before ' + desc(t), t.line);
      if (!viaStd) {
        if (this.lookupVar(name)) return { k: 'id', name, line: t.line };
        if (this.isOp('(') && this.fns.has(name)) return this.parseUserCall(name, t.line);
      }
      if (STD_NAMES.has(name) && name !== 'string') {
        if (!viaStd && NEEDS_STD.has(name) && !this.usingStd)
          throw cErr("'" + name + "' was not declared in this scope; did you mean 'std::" + name + "'?", t.line);
        if (name === 'cout' || name === 'cin' || name === 'endl' || name === 'getline') {
          if (!this.usesIO) this.usesIO = { name, line: t.line };
        }
        if (name === 'cout') return { k: 'cout', line: t.line };
        if (name === 'cin') return { k: 'cin', line: t.line };
        if (name === 'endl') return { k: 'endl', line: t.line };
        if (!this.isOp('(')) throw cErr("'" + name + "' must be called like a function", t.line);
        this.p++;
        const args = this.parseArgs();
        return { k: 'bcall', name, args, line: t.line };
      }
      throw cErr("'" + name + "' was not declared in this scope", t.line);
    }
    parseUserCall(name, line) {
      this.expectOp('(');
      const args = this.parseArgs();
      const sig = this.fns.get(name);
      if (args.length !== sig.params.length)
        throw cErr('too ' + (args.length > sig.params.length ? 'many' : 'few') + " arguments to function '" + name + "'", line);
      sig.params.forEach((p, i) => {
        if (p.ref && !p.const && args[i].k !== 'id')
          throw cErr("cannot bind non-const lvalue reference of type '" + p.type + "&' to an rvalue", line);
      });
      return { k: 'call', name, args, line };
    }
  }

  function parse(src) {
    const { toks, includes } = tokenize(src);
    return new Parser(toks, includes).parseProgram();
  }

  /* ----------------------------------------------------------- interpreter */
  const BRK = { sig: 'break' }, CNT = { sig: 'continue' };
  const STEP_LIMIT = 4000000;
  const OUT_LIMIT = 200000;

  class Interp {
    constructor(prog, input) {
      this.prog = prog; this.out = ''; this.input = input || ''; this.inPos = 0;
      this.inFail = false; this.steps = 0; this.depth = 0; this.globals = new Map();
    }
    write(s) {
      this.out += s;
      if (this.out.length > OUT_LIMIT) throw rErr('Too much output (limit reached).', 0);
    }
    runMain() {
      for (const g of this.prog.globals) this.execDecl(g, { scopes: [] }, true);
      const main = this.prog.funcs.get('main');
      const r = this.callFn(main, [], { scopes: [] }, main.line);
      return r ? r.v : 0;
    }
    lookup(env, name) {
      for (let i = env.scopes.length - 1; i >= 0; i--) { const c = env.scopes[i].get(name); if (c) return c; }
      return this.globals.get(name) || null;
    }
    readCell(c, line) {
      if (!c.val) throw rErr("Undefined behavior: variable '" + c.name + "' was used before it was given a value", line);
      return c.val;
    }
    toBool(v, line) {
      if (v.t === 'istream') return !this.inFail;
      if (v.t === 'string' || v.t === 'ostream' || v.t === 'manip') throw cErr("cannot convert '" + tname(v.t) + "' to 'bool'", line);
      return v.v !== 0;
    }
    callFn(fn, argNodes, env, line) {
      if (++this.depth > 700) throw rErr('Stack overflow: too many nested function calls (infinite recursion?)', line);
      const scope = new Map();
      fn.params.forEach((p, i) => {
        if (p.ref) {
          const cell = this.lookup(env, argNodes[i].name);
          if (p.name) scope.set(p.name, cell);
        } else {
          const v = this.ev(argNodes[i], env);
          if (p.name) scope.set(p.name, { type: p.type, val: coerce(p.type, v, line), name: p.name, isConst: p.const });
        }
      });
      const r = this.exec(fn.body, { scopes: [scope] });
      this.depth--;
      if (fn.ret === 'void') return null;
      if (r && r.sig === 'return') return coerce(fn.ret, r.val, line);
      if (fn.name === 'main') return mk('int', 0);
      throw rErr("Undefined behavior: function '" + fn.name + "' reached its end without returning a value", line);
    }
    execDecl(n, env, isGlobal) {
      const scope = isGlobal ? this.globals : env.scopes[env.scopes.length - 1];
      for (const d of n.decls) {
        if (d.ref) {
          const cell = this.lookup(env, d.init.name);
          scope.set(d.name, cell);
          continue;
        }
        let type = n.type, val = null;
        if (d.init) {
          const iv = this.ev(d.init, env);
          if (type === 'auto') type = iv.t;
          val = coerce(type, iv, d.line, d.form === 'brace');
        } else if (d.form === 'brace-empty') {
          val = zeroOf(type);
        } else if (type === 'string' || isGlobal) {
          val = zeroOf(type);
        }
        scope.set(d.name, { type, val, name: d.name, isConst: n.const });
      }
    }
    exec(n, env) {
      switch (n.k) {
        case 'block': {
          if (n.noScope) {
            for (const s of n.body) { const r = this.exec(s, env); if (r) return r; }
            return null;
          }
          env.scopes.push(new Map());
          try { for (const s of n.body) { const r = this.exec(s, env); if (r) return r; } }
          finally { env.scopes.pop(); }
          return null;
        }
        case 'empty': return null;
        case 'decl': this.execDecl(n, env, false); return null;
        case 'expr': this.ev(n.e, env); return null;
        case 'if':
          if (this.toBool(this.ev(n.c, env), n.line)) return this.exec(n.a, env);
          return n.b ? this.exec(n.b, env) : null;
        case 'while':
          while (this.toBool(this.ev(n.c, env), n.line)) {
            const r = this.exec(n.body, env);
            if (r) { if (r === BRK) break; if (r === CNT) continue; return r; }
          }
          return null;
        case 'do':
          do {
            const r = this.exec(n.body, env);
            if (r) { if (r === BRK) break; if (r === CNT) continue; return r; }
          } while (this.toBool(this.ev(n.c, env), n.line));
          return null;
        case 'for': {
          env.scopes.push(new Map());
          try {
            if (n.init) this.exec(n.init, env);
            for (;;) {
              if (n.c && !this.toBool(this.ev(n.c, env), n.line)) break;
              const r = this.exec(n.body, env);
              if (r) { if (r === BRK) break; if (r !== CNT) return r; }
              if (n.s) this.ev(n.s, env);
            }
          } finally { env.scopes.pop(); }
          return null;
        }
        case 'ret': return { sig: 'return', val: n.e ? this.ev(n.e, env) : null };
        case 'brk': return BRK;
        case 'cnt': return CNT;
      }
      throw rErr('internal error: unknown statement ' + n.k, n.line);
    }
    readLine() {
      if (this.inPos >= this.input.length) { this.inFail = true; return null; }
      let j = this.input.indexOf('\n', this.inPos);
      if (j < 0) j = this.input.length;
      const s = this.input.slice(this.inPos, j);
      this.inPos = Math.min(j + 1, this.input.length + 1);
      return s.replace(/\r$/, '');
    }
    extract(cell, line) {
      if (this.inFail) return;
      const inp = this.input;
      let p = this.inPos;
      while (p < inp.length && /\s/.test(inp[p])) p++;
      if (p >= inp.length) { this.inFail = true; this.inPos = p; if (cell.type !== 'string') cell.val = zeroOf(cell.type); return; }
      const rest = inp.slice(p);
      let m, val;
      const t = cell.type;
      if (t === 'string') { m = /^\S+/.exec(rest); val = mk('string', m[0]); }
      else if (t === 'char') { m = [rest[0]]; val = mk('char', rest.charCodeAt(0)); }
      else if (t === 'double' || t === 'float') {
        m = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(rest);
        if (m) val = coerce(t, mk('double', parseFloat(m[0])), line);
      } else if (t === 'bool') {
        m = /^[01]/.exec(rest); if (m) val = mk('bool', parseInt(m[0], 10));
      } else {
        m = /^[+-]?\d+/.exec(rest);
        if (m) val = coerce(t, mk('long', parseInt(m[0], 10)), line);
      }
      if (!m) { this.inFail = true; cell.val = zeroOf(t); return; }
      this.inPos = p + m[0].length;
      cell.val = val;
    }
    ev(n, env) {
      if (++this.steps > STEP_LIMIT) throw rErr('The program ran for too long (is there an infinite loop?).', n.line);
      switch (n.k) {
        case 'num': return n.val;
        case 'id': {
          const c = this.lookup(env, n.name);
          if (!c) throw cErr("'" + n.name + "' was not declared in this scope", n.line);
          return this.readCell(c, n.line);
        }
        case 'cout': return mk('ostream', 0);
        case 'cin': return mk('istream', 0);
        case 'endl': return mk('manip', 'endl');
        case 'comma': this.ev(n.l, env); return this.ev(n.r, env);
        case 'log': {
          const l = this.toBool(this.ev(n.l, env), n.line);
          if (n.op === '&&') return mk('bool', l && this.toBool(this.ev(n.r, env), n.line) ? 1 : 0);
          return mk('bool', l || this.toBool(this.ev(n.r, env), n.line) ? 1 : 0);
        }
        case 'bin': {
          if (n.op === '<<') {
            const l = this.ev(n.l, env);
            if (l.t === 'ostream') {
              const r = this.ev(n.r, env);
              if (r.t === 'manip') this.write('\n');
              else if (r.t === 'ostream' || r.t === 'istream') throw cErr("invalid operands to 'operator<<'", n.line);
              else this.write(fmt(r));
              return l;
            }
            return arith('<<', l, this.ev(n.r, env), n.line);
          }
          if (n.op === '>>') {
            const l = this.ev(n.l, env);
            if (l.t === 'istream') {
              if (n.r.k !== 'id') throw cErr("cin >> needs a variable on the right-hand side", n.line);
              const cell = this.lookup(env, n.r.name);
              if (!cell) throw cErr("'" + n.r.name + "' was not declared in this scope", n.line);
              if (cell.isConst) throw cErr("cannot read into const variable '" + n.r.name + "'", n.line);
              this.extract(cell, n.line);
              return l;
            }
            return arith('>>', l, this.ev(n.r, env), n.line);
          }
          return arith(n.op, this.ev(n.l, env), this.ev(n.r, env), n.line);
        }
        case 'un': {
          const v = this.ev(n.e, env);
          if (n.op === '!') return mk('bool', this.toBool(v, n.line) ? 0 : 1);
          if (v.t === 'string' || v.t === 'ostream' || v.t === 'istream') throw cErr("wrong type argument to unary '" + n.op + "'", n.line);
          const rt = promote(v.t, 'int');
          if (n.op === '+') return mk(rt, v.v);
          if (n.op === '-') return rt === 'double' || rt === 'float' ? mk(rt, -v.v) : mk(rt, wrapInt(rt, -v.v) + 0);
          if (rt === 'double' || rt === 'float') throw cErr("wrong type argument to bit-complement", n.line);
          return mk(rt, wrapInt(rt, ~v.v));
        }
        case 'pre': case 'post': {
          const c = this.lookup(env, n.e.name);
          if (!c) throw cErr("'" + n.e.name + "' was not declared in this scope", n.line);
          const old = this.readCell(c, n.line);
          if (old.t === 'string') throw cErr("cannot increment a string", n.line);
          const nv = coerce(c.type, mk(promote(old.t, 'int'), old.v + (n.op === '++' ? 1 : -1)), n.line);
          c.val = nv;
          return n.k === 'pre' ? nv : old;
        }
        case 'asg': {
          const c = this.lookup(env, n.l.name);
          if (!c) throw cErr("'" + n.l.name + "' was not declared in this scope", n.line);
          const r = this.ev(n.r, env);
          if (n.op === '=') { c.val = coerce(c.type, r, n.line); return c.val; }
          const cur = this.readCell(c, n.line);
          c.val = coerce(c.type, arith(n.op.slice(0, -1), cur, r, n.line), n.line);
          return c.val;
        }
        case 'cond': return this.toBool(this.ev(n.c, env), n.line) ? this.ev(n.a, env) : this.ev(n.b, env);
        case 'cast': return coerce(n.type, this.ev(n.e, env), n.line);
        case 'sizeof': {
          if (n.e.k === 'id') {
            const c = this.lookup(env, n.e.name);
            if (c) return mk('uint', SIZES[c.type] || 4);
          }
          const v = this.ev(n.e, env);
          return mk('uint', SIZES[v.t] || 4);
        }
        case 'call': {
          const fn = this.prog.funcs.get(n.name);
          if (!fn) throw cErr("undefined reference to '" + n.name + "'", n.line);
          const r = this.callFn(fn, n.args, env, n.line);
          return r || mk('void', 0);
        }
        case 'bcall': return this.builtin(n, env);
        case 'idx': {
          const s = this.ev(n.obj, env), i = this.ev(n.i, env);
          if (s.t !== 'string') throw cErr("only std::string supports [] in this mini C++ so far", n.line);
          if (i.v < 0 || i.v >= s.v.length) throw rErr('Undefined behavior: index ' + i.v + ' is out of range for a string of length ' + s.v.length, n.line);
          return mk('char', s.v.charCodeAt(i.v));
        }
        case 'method': {
          const s = this.ev(n.obj, env);
          if (s.t !== 'string') throw cErr("only std::string members are supported so far", n.line);
          const a = n.args.map((x) => this.ev(x, env));
          switch (n.name) {
            case 'length': case 'size': return mk('uint', s.v.length);
            case 'empty': return mk('bool', s.v.length === 0 ? 1 : 0);
            case 'at':
              if (a[0].v < 0 || a[0].v >= s.v.length) throw rErr('std::out_of_range: at() index ' + a[0].v + ' is out of range', n.line);
              return mk('char', s.v.charCodeAt(a[0].v));
            case 'substr': {
              const st = a[0].v, len = a.length > 1 ? a[1].v : undefined;
              if (st > s.v.length) throw rErr('std::out_of_range: substr() start is out of range', n.line);
              return mk('string', len === undefined ? s.v.slice(st) : s.v.substr(st, len));
            }
          }
          throw cErr("'std::string' has no member named '" + n.name + "' (or it is not supported yet)", n.line);
        }
      }
      throw rErr('internal error: unknown expression ' + n.k, n.line);
    }
    builtin(n, env) {
      if (n.name === 'getline') {
        if (n.args.length !== 2 || n.args[0].k !== 'cin' || n.args[1].k !== 'id')
          throw cErr('std::getline needs (std::cin, stringVariable)', n.line);
        const cell = this.lookup(env, n.args[1].name);
        if (!cell || cell.type !== 'string') throw cErr('std::getline needs a std::string variable', n.line);
        const line = this.readLine();
        if (line !== null) cell.val = mk('string', line);
        return mk('istream', 0);
      }
      const a = n.args.map((x) => this.ev(x, env));
      const num = (v) => { if (v.t === 'string') throw cErr('no matching function for call to ' + n.name, n.line); return v; };
      switch (n.name) {
        case 'abs': { const v = num(a[0]); return mk(promote(v.t, 'int'), Math.abs(v.v)); }
        case 'sqrt': return mk('double', Math.sqrt(num(a[0]).v));
        case 'pow': return mk('double', Math.pow(num(a[0]).v, num(a[1]).v));
        case 'min': case 'max': {
          const x = a[0], y = a[1];
          if (x.t === 'string' && y.t === 'string') return (n.name === 'min' ? y.v < x.v : y.v > x.v) ? y : x;
          const rt = promote(num(x).t, num(y).t);
          const r = n.name === 'min' ? Math.min(x.v, y.v) : Math.max(x.v, y.v);
          return mk(rt, r);
        }
      }
      throw cErr("unsupported function '" + n.name + "'", n.line);
    }
  }

  /* ------------------------------------------------------------------- api */
  function run(src, input) {
    let prog;
    try { prog = parse(String(src)); }
    catch (e) {
      if (e instanceof CppError) return { ok: false, kind: e.kind, message: e.message, line: e.line, stdout: '' };
      throw e;
    }
    const it = new Interp(prog, input || '');
    try {
      const code = it.runMain();
      return { ok: true, stdout: it.out, exitCode: code };
    } catch (e) {
      if (e instanceof CppError)
        return { ok: false, kind: e.kind, message: e.message, line: e.line, stdout: e.kind === 'compile' ? '' : it.out };
      if (e instanceof RangeError)
        return { ok: false, kind: 'runtime', message: 'Stack overflow: too many nested function calls (infinite recursion?)', line: 0, stdout: it.out };
      throw e;
    }
  }

  const norm = (s) => String(s).replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\s+$/, '');

  /* Grade a code exercise: static requirements first, then every test. */
  function grade(ex, src) {
    for (const r of ex.require || []) {
      if (!r.re.test(src)) return { pass: false, kind: 'require', message: r.msg };
    }
    const results = [];
    for (const t of ex.tests) {
      const res = run(src, t.input || '');
      if (!res.ok) return { pass: false, kind: res.kind, message: res.message, line: res.line, results };
      const ok = norm(res.stdout) === norm(t.expected);
      results.push({ input: t.input || '', expected: t.expected, got: res.stdout, ok, hidden: !!t.hidden });
      if (!ok) return { pass: false, kind: 'wrong', results };
    }
    return { pass: true, kind: 'ok', results };
  }

  return { run, grade, parse, tokenize, formatG, norm };
});
