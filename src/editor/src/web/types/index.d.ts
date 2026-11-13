declare namespace NodeJS {
  /** Adds bundler-provided HMR support to the existing Node module declaration. */
  interface Module {
    /**
     * Hot module replacement API, available in development builds only.
     * The bundler provides `module` in production too, but omits `hot`.
     */
    hot?: HotModuleReplacement;
  }

  /**
   * HMR methods implemented by Turbopack in Next.js 15.3.2.
   * Dependency-specific accept/decline overloads throw and are intentionally omitted.
   * Webpack's update-management API is only partially implemented by Turbopack.
   * @see https://github.com/vercel/next.js/blob/v15.3.2/turbopack/crates/turbopack-ecmascript-runtime/js/src/browser/runtime/base/dev-base.ts
   */
  interface HotModuleReplacement {
    /**
     * Reject replacement of this module, making Next.js fall back to a full page reload.
     * Also applies to updates of dependencies that propagate to this module.
     * Does not reload immediately when called.
     */
    decline(): void;
  }
}
