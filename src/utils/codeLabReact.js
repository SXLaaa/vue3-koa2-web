/**
 * @Description: React JSX空白模板与CDN映射，固定版本并共享同一React实例。
 * @Date: 2026-11-20
 */
export const REACT_IMPORT_MAP = {
  imports: {
    react: "https://esm.sh/react@19.2.4?dev",
    "react/jsx-runtime": "https://esm.sh/react@19.2.4/jsx-runtime?dev&external=react",
    "react-dom/client": "https://esm.sh/react-dom@19.2.4/client?dev&external=react",
  },
};

export const REACT_PRESET = {
  html: '<div id="root"></div>',
  css: "",
  script: `import React from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));

root.render(
  <>
  </>
);`,
};
