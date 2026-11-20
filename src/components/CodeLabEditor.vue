<!-- @Description: 代码练习台的编辑器，按当前标签提供语法高亮与补全。 -->
<template>
  <div ref="host" class="code-editor-host"></div>
</template>

<script>
import { markRaw } from "vue";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import {
  history, historyKeymap, indentLess, indentMore, insertNewline, isolateHistory, standardKeymap, temporarilySetTabFocusMode,
} from "@codemirror/commands";
import { defaultHighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import {
  acceptCompletion, autocompletion, closeCompletion, completionKeymap, nextSnippetField, prevSnippetField,
} from "@codemirror/autocomplete";
import { javascript, jsxLanguage, scopeCompletionSource } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { completeReact } from "@/utils/codeLabReactCompletion";

const INDENT = "  ";

function completeOrIndent(view) {
  if (acceptCompletion(view) || nextSnippetField(view)) return true;
  if (view.state.selection.ranges.some((range) => !range.empty)) return indentMore(view);
  view.dispatch(view.state.replaceSelection(INDENT), { scrollIntoView: true, userEvent: "input" });
  return true;
}

function languageExtensions(mode) {
  if (mode === "html") return html({ autoCloseTags: false });
  if (mode === "css") return css();

  const script = javascript({ typescript: mode === "ts" });
  // JSX沿用JavaScript的提示规则，标签由使用者输入或主动选择补全。
  const language = mode === "react" ? jsxLanguage : script.language;
  const browserApis = scopeCompletionSource({
    console, document, window, navigator, Math, JSON, Array, Object, Date, String, Number,
    Promise, Map, Set, RegExp, Error, URL, URLSearchParams, fetch, setTimeout, clearTimeout,
    setInterval, clearInterval, requestAnimationFrame,
  });
  return [
    language,
    script.support,
    language.data.of({ autocomplete: browserApis }),
    mode === "react" ? language.data.of({ autocomplete: completeReact }) : [],
  ];
}

const theme = EditorView.theme({
  "&": { flex: "1", minHeight: "0", backgroundColor: "#f8fafc", color: "#1f2937", fontSize: "14px" },
  "&.cm-focused": { outline: "1px solid #93c5fd", outlineOffset: "-1px" },
  ".cm-scroller": { fontFamily: 'Consolas, "Liberation Mono", Menlo, monospace', lineHeight: "1.6" },
  ".cm-content": { padding: "12px 0" },
  ".cm-gutters": { backgroundColor: "#f1f5f9", color: "#64748b", borderRight: "1px solid #e2e8f0" },
});

export default {
  name: "CodeLabEditor",
  props: {
    modelValue: { type: String, required: true },
    mode: { type: String, required: true },
  },
  emits: ["update:modelValue", "run", "save", "blur"],
  data() {
    return { editor: null };
  },
  watch: {
    modelValue(value) {
      const editor = this.editor;
      if (!editor || editor.state.doc.toString() === value) return;
      const { doc, selection } = editor.state;
      const currentLine = doc.lineAt(selection.main.head);
      const nextDoc = editor.state.toText(value);
      const nextLine = nextDoc.line(Math.min(currentLine.number, nextDoc.lines));
      const column = selection.main.head - currentLine.from;
      // 把格式化作为单独的编辑操作，保留撤销和当前行的位置。
      editor.dispatch({
        changes: { from: 0, to: doc.length, insert: nextDoc },
        selection: { anchor: Math.min(nextLine.to, nextLine.from + column) },
        annotations: isolateHistory.of("full"),
      });
    },
  },
  mounted() {
    this.editor = markRaw(new EditorView({
      parent: this.$refs.host,
      doc: this.modelValue,
      extensions: [
        languageExtensions(this.mode),
        EditorState.tabSize.of(INDENT.length),
        indentUnit.of(INDENT),
        lineNumbers(),
        history(),
        syntaxHighlighting(defaultHighlightStyle),
        autocompletion({ defaultKeymap: false, activateOnTypingDelay: 25, interactionDelay: 0 }),
        EditorView.contentAttributes.of({ "aria-label": "代码编辑器", "aria-describedby": "code-editor-shortcuts" }),
        EditorView.lineWrapping,
        theme,
        Prec.high(keymap.of([
          { key: "Tab", run: completeOrIndent, shift: (view) => prevSnippetField(view) || indentLess(view) },
          {
            key: "Escape",
            run(view) {
              closeCompletion(view);
              return temporarilySetTabFocusMode(view);
            },
          },
          { key: "Enter", run: insertNewline, shift: insertNewline },
          {
            key: "Mod-s",
            run: () => {
              this.$emit("save");
              return true;
            },
          },
          {
            key: "Mod-Enter",
            run: () => {
              this.$emit("run");
              return true;
            },
          },
        ])),
        keymap.of([
          ...completionKeymap.filter(({ key }) => key !== "Enter" && key !== "Escape"),
          ...standardKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) this.$emit("update:modelValue", update.state.doc.toString());
        }),
        EditorView.domEventHandlers({ blur: () => { this.$emit("blur"); } }),
      ],
    }));
  },
  beforeUnmount() {
    this.editor?.destroy();
  },
};
</script>
