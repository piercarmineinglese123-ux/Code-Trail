/* Tiny markdown renderer + C++ syntax highlighter (no dependencies, works offline). */
(function (root) {
  'use strict';

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const KW = new Set(['int', 'double', 'float', 'bool', 'char', 'void', 'auto', 'short', 'long', 'unsigned', 'signed', 'const',
    'if', 'else', 'while', 'for', 'do', 'return', 'break', 'continue', 'using', 'namespace', 'true', 'false', 'class', 'struct',
    'new', 'delete', 'static', 'switch', 'case', 'default', 'nullptr', 'sizeof', 'typedef', 'enum', 'public', 'private',
    'protected', 'template', 'typename', 'static_cast', 'constexpr', 'include']);

  function highlight(code) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(^[ \t]*#[^\n]*)|(\b\d[\d']*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFuUlL]*\b)|([A-Za-z_]\w*)/gm;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const tok = m[0];
      if (m[1]) out += '<span class="tk-c">' + esc(tok) + '</span>';
      else if (m[2]) out += '<span class="tk-s">' + esc(tok) + '</span>';
      else if (m[3]) out += '<span class="tk-p">' + esc(tok) + '</span>';
      else if (m[4]) out += '<span class="tk-n">' + esc(tok) + '</span>';
      else if (KW.has(tok)) out += '<span class="tk-k">' + esc(tok) + '</span>';
      else if (tok === 'std') out += '<span class="tk-t">' + esc(tok) + '</span>';
      else if (code[re.lastIndex] === '(') out += '<span class="tk-f">' + esc(tok) + '</span>';
      else out += esc(tok);
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  function inline(s) {
    const spans = [];
    s = String(s).replace(/`([^`]+)`/g, (m, c) => { spans.push(c); return '\u0000' + (spans.length - 1) + '\u0000'; });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => '<code>' + esc(spans[+i]) + '</code>');
  }

  function codeBlock(code, lang) {
    if (!lang) return '<pre class="code plain"><code>' + esc(code) + '</code></pre>';
    return '<pre class="code"><code>' + highlight(code) + '</code></pre>';
  }

  const CALLOUT = { tip: 'Tip', note: 'Note', warn: 'Careful' };
  const isBlockStart = (l) => /^(```|#{1,4}\s|\||>|[-*]\s+|\d+\.\s+)/.test(l);

  function render(md) {
    const lines = String(md).replace(/\r/g, '').split('\n');
    let html = '', i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (/^\s*$/.test(l)) { i++; continue; }
      if (/^```/.test(l)) {
        const lang = l.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        html += codeBlock(buf.join('\n'), lang);
        continue;
      }
      let m;
      if ((m = /^(#{1,4})\s+(.*)$/.exec(l))) {
        const lvl = Math.min(m[1].length + 1, 5);
        html += '<h' + lvl + '>' + inline(m[2]) + '</h' + lvl + '>';
        i++; continue;
      }
      if (/^\|/.test(l)) {
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        const cells = (r) => r.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]);
        const body = rows.slice(/^\|[\s:|-]+\|?\s*$/.test(rows[1] || '') ? 2 : 1).map(cells);
        html += '<div class="tbl"><table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
          body.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
        continue;
      }
      if (/^>/.test(l)) {
        const buf = [];
        while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
        let text = buf.join(' ').trim(), kind = 'note';
        const c = /^\[!(\w+)\]\s*/.exec(text);
        if (c) { kind = CALLOUT[c[1]] ? c[1] : 'note'; text = text.slice(c[0].length); }
        html += '<div class="callout ' + kind + '"><b>' + CALLOUT[kind] + '</b><span>' + inline(text) + '</span></div>';
        continue;
      }
      if (/^[-*]\s+/.test(l)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s+/, ''));
        html += '<ul>' + items.map((t) => '<li>' + inline(t) + '</li>').join('') + '</ul>';
        continue;
      }
      if (/^\d+\.\s+/.test(l)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s+/, ''));
        html += '<ol>' + items.map((t) => '<li>' + inline(t) + '</li>').join('') + '</ol>';
        continue;
      }
      const buf = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !(buf.length && isBlockStart(lines[i]))) buf.push(lines[i++]);
      html += '<p>' + inline(buf.join(' ')) + '</p>';
    }
    return html;
  }

  root.MD = { render, inline, highlight, esc, codeBlock };
})(typeof self !== 'undefined' ? self : this);
