/**
 * @Description: 代码练习台格式化工具，按当前语言和已有缩进整理代码。
 * @Date: 2026-11-20
 */
import { cssLanguage } from "@codemirror/lang-css";
import { htmlLanguage } from "@codemirror/lang-html";

const SCRIPT_FILES = {
  js: "practice.js",
  ts: "practice.ts",
  react: "practice.jsx",
};

function greatestCommonDivisor(left, right) {
  return right === 0 ? left : greatestCommonDivisor(right, left % right);
}

function readIndentation(source) {
  const indents = Array.from(source.matchAll(/^[\t ]+(?=\S)/gm), ([indent]) => indent);
  const tabLines = indents.filter((indent) => indent.startsWith("\t")).length;
  const spaceWidth = indents
    .filter((indent) => /^ +$/.test(indent))
    .reduce((width, indent) => greatestCommonDivisor(width, indent.length), 0);
  return {
    useTabs: tabLines > indents.length / 2,
    width: spaceWidth >= 2 && spaceWidth <= 8 ? spaceWidth : 2,
  };
}

function formatScript(source, filename, tsCompiler, { useTabs, width }) {
  const host = {
    getScriptFileNames: () => [filename],
    getScriptVersion: () => "0",
    getScriptSnapshot: (file) => file === filename ? tsCompiler.ScriptSnapshot.fromString(source) : undefined,
    getCurrentDirectory: () => "",
    getCompilationSettings: () => ({
      allowJs: true,
      jsx: tsCompiler.JsxEmit.Preserve,
      noLib: true,
      noResolve: true,
    }),
    getDefaultLibFileName: () => "",
    fileExists: (file) => file === filename,
    readFile: (file) => file === filename ? source : undefined,
  };
  const service = tsCompiler.createLanguageService(host);
  try {
    const [diagnostic] = service.getSyntacticDiagnostics(filename);
    if (diagnostic) throw new SyntaxError(tsCompiler.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));

    // 只应用格式化编辑。保留字符串写法及已有分号，且不加载类型声明。
    const edits = service.getFormattingEditsForDocument(filename, {
      ...tsCompiler.getDefaultFormatCodeSettings(),
      convertTabsToSpaces: !useTabs,
      indentSize: width,
      tabSize: width,
      newLineCharacter: source.includes("\r\n") ? "\r\n" : "\n",
      semicolons: tsCompiler.SemicolonPreference.Ignore,
    });
    for (const { span, newText } of edits.sort((left, right) => right.span.start - left.span.start)) {
      source = source.slice(0, span.start) + newText + source.slice(span.start + span.length);
    }
    return source;
  } finally {
    service.dispose();
  }
}

function preserveStyles(source, formatted) {
  function getStyles(text) {
    const declarations = [];
    const strings = [];
    cssLanguage.parser.parse(text).iterate({
      enter({ node }) {
        if (node.name === "Declaration") {
          const property = node.firstChild;
          let next = node.nextSibling;
          while (next?.name === "Comment") next = next.nextSibling;
          declarations.push({
            name: text.slice(property?.from, property?.to),
            semicolon: next?.name === ";" ? next.from : null,
          });
        } else if (node.name === "StringLiteral") {
          strings.push({ from: node.from, to: node.to, text: text.slice(node.from, node.to) });
        }
      },
    });
    return { declarations, strings };
  }

  const before = getStyles(source);
  const after = getStyles(formatted);
  const changes = [];
  // 只还原缺省的尾部分号和原有的字符串写法，不改格式化后的缩进。
  if (before.declarations.length === after.declarations.length &&
      after.declarations.every(({ name }, index) => name === before.declarations[index].name)) {
    after.declarations.forEach(({ semicolon }, index) => {
      if (semicolon !== null && before.declarations[index].semicolon === null) {
        changes.push({ from: semicolon, to: semicolon + 1, text: "" });
      }
    });
  }
  if (before.strings.length === after.strings.length) {
    after.strings.forEach(({ from, to }, index) => {
      changes.push({ from, to, text: before.strings[index].text });
    });
  }
  return replaceRanges(formatted, changes);
}

function replaceRanges(source, ranges) {
  for (const { from, to, text } of ranges.sort((left, right) => right.from - left.from)) {
    source = source.slice(0, from) + text + source.slice(to);
  }
  return source;
}

function preserveHtmlText(source, formatted) {
  function getProtectedRanges(text) {
    const ranges = [];
    htmlLanguage.parser.parse(text).iterate({
      enter({ node }) {
        if (node.name === "Element") {
          const name = node.firstChild?.getChild("TagName");
          const tag = name ? text.slice(name.from, name.to).toLowerCase() : "";
          if (["pre", "textarea", "script", "style"].includes(tag) && node.lastChild?.name === "CloseTag") {
            const from = node.firstChild.to;
            const to = node.lastChild.from;
            ranges.push({ kind: tag, from, to, text: text.slice(from, to) });
            return false;
          }
        }
        if (node.name === "AttributeValue") {
          ranges.push({ kind: "attribute", from: node.from, to: node.to, text: text.slice(node.from, node.to) });
        }
      },
    });
    return ranges;
  }

  // 浏览器会按原样呈现部分元素内容，且属性中的引号由练习者决定。
  const before = getProtectedRanges(source);
  const after = getProtectedRanges(formatted);
  if (before.length !== after.length || after.some(({ kind }, index) => kind !== before[index].kind)) {
    return formatted;
  }
  return replaceRanges(formatted, after.map(({ from, to }, index) => ({ from, to, text: before[index].text })));
}

export async function formatCodeLabSource(source, mode, tsCompiler) {
  if (!source.trim()) return source;
  const indentation = readIndentation(source);
  const filename = SCRIPT_FILES[mode];
  if (filename) return formatScript(source, filename, tsCompiler, indentation);
  if (mode !== "html" && mode !== "css") return source;

  // 用户调用 HTML/CSS 格式化时才加载对应语言插件。
  const [prettier, plugin] = await Promise.all([
    import("prettier/standalone"),
    mode === "html" ? import("prettier/plugins/html") : import("prettier/plugins/postcss"),
  ]);
  const formatted = await prettier.format(source, {
    parser: mode,
    plugins: [plugin.default],
    tabWidth: indentation.width,
    useTabs: indentation.useTabs,
    endOfLine: "auto",
    htmlWhitespaceSensitivity: "strict",
    embeddedLanguageFormatting: "off",
  });
  return mode === "html" ? preserveHtmlText(source, formatted) : preserveStyles(source, formatted);
}
