import eslint from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

// Simple constants for configuring rules
const DISABLED = 'off';
const WARNING = 'warn';
const ERROR = 'error';

// Ayyy don't ask me what any of this is, I just copypaste from the internet
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

// const eslintConfig = [
export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    ignorePatterns: [
      ".next/",
      "dist/",
      'coverage/',
      'eslint.config.mjs',
      'src/web/test/integration/mock/assets/scripts/'
    ],
  }),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      next: {
        rootDir: 'src/web',
      },
    },
    rules: {
      // Rules that are explicitly disabled
      '@typescript-eslint/no-explicit-any': DISABLED, // Too restrictive, you need `any` in certain situations
      'react-hooks/exhaustive-deps': DISABLED, // Stupid rule. You often want to specifically ignore certain dependencies.
      'no-fallthrough': DISABLED, // Fallthrough is a feature
      '@typescript-eslint/unbound-method': DISABLED, // Nice in theory, but would create more noise than is worth
      '@typescript-eslint/restrict-template-expressions': DISABLED, // Would create more noise than is worth
      'no-empty-pattern': DISABLED, // Nah, its more convenient to have this sometimes
      '@typescript-eslint/prefer-promise-reject-errors': DISABLED, // Promise rejections can be anything
      '@typescript-eslint/no-misused-promises': DISABLED, // Would be nice to have, but probably more effort than its worth (lots of `() => void foo()` in JSX event handlers)

      // Rules that are explicitly a warning
      '@typescript-eslint/no-unused-vars': [WARNING, {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_',
      }],

      // Rules that are explicitly an error
      'eol-last': ERROR,
      'semi': ERROR,
      'comma-dangle': [ERROR, 'always-multiline'],
      '@typescript-eslint/explicit-function-return-type': [ERROR, { allowExpressions: true }],
      'react/no-unknown-property': [ERROR, { ignore: ['class'] }],
      '@typescript-eslint/no-floating-promises': ERROR,
      '@typescript-eslint/no-var-requires': ERROR,
      '@typescript-eslint/no-empty-object-type': [ERROR, { allowInterfaces: 'always' }], // Frequently want empty interfaces that I haven't built yet (e.g. props)
      // @NOTE From: https://github.com/Microsoft/TypeScript/issues/14306#issuecomment-552890299
      "no-restricted-globals": [ERROR, "postMessage", "blur", "focus", "close", "frames", "self", "parent", "opener", "top", "length", "closed", "location", "origin", "name", "locationbar", "menubar", "personalbar", "scrollbars", "statusbar", "toolbar", "status", "frameElement", "navigator", "customElements", "external", "screen", "innerWidth", "innerHeight", "scrollX", "pageXOffset", "scrollY", "pageYOffset", "screenX", "screenY", "outerWidth", "outerHeight", "clientInformation", "screenLeft", "screenTop", "defaultStatus", "defaultstatus", "styleMedia", "onanimationend", "onanimationiteration", "onanimationstart", "onsearch", "ontransitionend", "onwebkitanimationend", "onwebkitanimationiteration", "onwebkitanimationstart", "onwebkittransitionend", "isSecureContext", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting", "onwheel", "onauxclick", "ongotpointercapture", "onlostpointercapture", "onpointerdown", "onpointermove", "onpointerup", "onpointercancel", "onpointerover", "onpointerout", "onpointerenter", "onpointerleave", "onafterprint", "onbeforeprint", "onbeforeunload", "onhashchange", "onlanguagechange", "onmessage", "onmessageerror", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onrejectionhandled", "onstorage", "onunhandledrejection", "onunload", "stop", "open", "print", "captureEvents", "releaseEvents", "getComputedStyle", "matchMedia", "moveTo", "moveBy", "resizeTo", "resizeBy", "getSelection", "find", "createImageBitmap", "scroll", "scrollTo", "scrollBy", "onappinstalled", "onbeforeinstallprompt", "crypto", "ondevicemotion", "ondeviceorientation", "ondeviceorientationabsolute", "indexedDB", "webkitStorageInfo", "chrome", "visualViewport", "speechSynthesis", "webkitRequestFileSystem", "webkitResolveLocalFileSystemURL", "openDatabase"],
    },
  },
);
