import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: (props) => <h1 className="text-3xl font-bold mt-6 mb-3" {...props} />,
    h2: (props) => <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
    h3: (props) => <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />,
    p: (props) => <p className="leading-relaxed my-3 text-ink/90" {...props} />,
    ul: (props) => <ul className="list-disc pl-6 my-3 space-y-1" {...props} />,
    ol: (props) => <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />,
    a: (props) => <a className="text-accent underline hover:no-underline" {...props} />,
  };
}
