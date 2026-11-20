/** @Description: 按导入、React API、组件实例和 JSX 标签提供练习台补全。 */
import { syntaxTree } from "@codemirror/language";
import { REACT_IMPORT_MAP } from "./codeLabReact.js";

const completionOptions = (names, type) => names.split(" ").map((label) => ({ label, type }));
const hooks = completionOptions(
  "useState useEffect useRef useMemo useCallback useContext useReducer useId useLayoutEffect useImperativeHandle useTransition useDeferredValue useSyncExternalStore useActionState useOptimistic useInsertionEffect useDebugValue",
  "function"
);
const reactTags = completionOptions("Fragment StrictMode Suspense Profiler", "class");
const reactExports = [
  ...hooks,
  ...reactTags,
  ...completionOptions("Component PureComponent", "class"),
  ...completionOptions("createElement cloneElement createContext createRef forwardRef isValidElement lazy memo startTransition use", "function"),
  ...completionOptions("Children", "namespace"),
];
const moduleExports = {
  react: reactExports,
  "react-dom/client": completionOptions("createRoot hydrateRoot", "function"),
  "react/jsx-runtime": completionOptions("Fragment jsx jsxs", "function"),
};
const standaloneExports = reactExports.map((option) => ({ ...option, detail: "从 react 导入" }));
const importPaths = Object.keys(REACT_IMPORT_MAP.imports).map((label) => ({ label, type: "namespace" }));
const instanceMembers = [
  ...completionOptions("props state context", "property"),
  ...completionOptions("setState forceUpdate", "method"),
];
const tags = completionOptions(
  "a article aside audio b blockquote br button canvas code dd details dialog div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr img input label legend li main nav ol option p pre section select small span strong summary table tbody td textarea th thead tr ul video",
  "type"
);
const commonAttributes = completionOptions(
  "key ref id className style title hidden tabIndex role aria-label aria-hidden onClick onDoubleClick onChange onInput onFocus onBlur onKeyDown onKeyUp onMouseEnter onMouseLeave",
  "property"
);
const elementAttributes = {
  a: "href target rel download",
  button: "type disabled name value",
  form: "action method onSubmit onReset",
  img: "src alt width height loading",
  input: "type name value defaultValue checked defaultChecked placeholder disabled required readOnly autoComplete min max step",
  label: "htmlFor",
  option: "value disabled",
  select: "name value defaultValue multiple disabled required",
  textarea: "name value defaultValue placeholder rows cols disabled required readOnly",
};

function completeImport(context, declaration) {
  const module = declaration.getChild("String");
  const path = module && context.state.sliceDoc(module.from, module.to);
  if (module && context.pos > module.from && context.pos <= module.to) {
    const to = path.length > 1 && path.at(-1) === path[0] ? module.to - 1 : module.to;
    if (context.pos > to) return null;
    return { from: module.from + 1, to, options: importPaths, validFor: /^[\w/-]*$/ };
  }

  const group = declaration.getChild("ImportGroup");
  const word = context.matchBefore(/[\w$]+/);
  if (!group || context.pos <= group.from || context.pos > group.to || (!word && !context.explicit)) return null;
  const moduleName = path?.slice(1, -1);
  if (moduleName && !Object.hasOwn(moduleExports, moduleName)) return null;
  const options = moduleName ? moduleExports[moduleName] : [...reactExports, ...moduleExports["react-dom/client"]];
  return options ? { from: word?.from ?? context.pos, options, validFor: /^[\w$]*$/ } : null;
}

function completeTag(context, tree, node) {
  const reactTag = context.matchBefore(/<\/?React\.[\w$]*/);
  if (reactTag?.from === node.from) {
    return { from: reactTag.from + reactTag.text.indexOf(".") + 1, options: reactTags, validFor: /^[\w$]*$/ };
  }

  const tag = context.matchBefore(/<\/?[\w$-]*/);
  if (tag?.from === node.from) {
    const names = new Set();
    tree.iterate({
      enter({ name, from, to }) {
        if (name !== "VariableDefinition") return;
        const label = context.state.sliceDoc(from, to);
        if (/^[A-Z]/.test(label)) names.add(label);
      },
    });
    const components = Array.from(names, (label) => ({ label, type: "class" }));
    const openTag = node.parent?.getChild("JSXOpenTag");
    const openName = openTag?.firstChild?.nextSibling;
    const matchingTag = node.name === "JSXCloseTag" && openName
      ? [{ label: context.state.sliceDoc(openName.from, openName.to), type: "type", boost: 20 }]
      : [];
    return {
      from: tag.from + (tag.text.startsWith("</") ? 2 : 1),
      options: [...matchingTag, ...components, ...tags],
      validFor: /^[\w$-]*$/,
    };
  }

  if (node.name === "JSXCloseTag") return null;
  const name = node.firstChild?.nextSibling;
  const attribute = context.matchBefore(/\s[\w:-]*$/);
  if (!name || !attribute || attribute.from < name.to || (!attribute.text.trim() && !context.explicit)) return null;
  if (/=\s*$/.test(context.state.sliceDoc(name.to, attribute.from))) return null;
  const tagName = context.state.sliceDoc(name.from, name.to);
  const extra = Object.hasOwn(elementAttributes, tagName) ? elementAttributes[tagName] : "";
  return {
    from: attribute.from + 1,
    options: extra ? [...commonAttributes, ...completionOptions(extra, "property")] : commonAttributes,
    validFor: /^[\w:-]*$/,
  };
}

function isReactClass(context, node) {
  for (; node; node = node.parent) {
    if (node.name !== "ClassBody") continue;
    const header = context.state.sliceDoc(node.parent.from, node.from);
    return /\bextends\s+(?:React\s*\.\s*)?(?:PureComponent|Component)\s*$/.test(header);
  }
  return false;
}

export function completeReact(context) {
  const tree = syntaxTree(context.state);
  const target = tree.resolveInner(context.pos, -1);
  let inExpression = false;
  for (let node = target; node; node = node.parent) {
    if (node.name === "ImportDeclaration") return completeImport(context, node);
    if (node.name === "String" && node.parent?.name === "ImportDeclaration") continue;
    if (/^(?:LineComment|BlockComment|String|TemplateString|JSXText|JSXAttributeValue)$/.test(node.name)) return null;
    if (node.name === "JSXEscape") inExpression = true;
    if (!inExpression && /^JSX(?:OpenTag|SelfClosingTag|CloseTag|FragmentTag)$/.test(node.name)) {
      return completeTag(context, tree, node);
    }
  }

  const word = context.matchBefore(/[\w$]+/);
  if (context.matchBefore(/\.[\w$]*/)) {
    if (context.matchBefore(/\bReact\.[\w$]*/)) {
      return { from: word?.from ?? context.pos, options: reactExports, validFor: /^[\w$]*$/ };
    }
    if (context.matchBefore(/\bthis\.[\w$]*/) && isReactClass(context, target)) {
      return { from: word?.from ?? context.pos, options: instanceMembers, validFor: /^[\w$]*$/ };
    }
    return null;
  }

  if (!word && !context.explicit) return null;
  return {
    from: word?.from ?? context.pos,
    options: standaloneExports,
    validFor: /^[\w$]*$/,
  };
}
