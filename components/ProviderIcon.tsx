import React from "react";

interface ProviderIconProps {
  id: string;
  className?: string;
  size?: number;
}

export default function ProviderIcon({
  id,
  className = "h-5 w-5",
  size = 20,
}: ProviderIconProps) {
  switch (id) {
    case "openai":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-label="OpenAI"
        >
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.98 4.182a5.985 5.985 0 0 0-3.997 2.9 6.046 6.046 0 0 0 .742 7.097 5.98 5.98 0 0 0 .511 4.91 6.051 6.051 0 0 0 6.515 2.9 5.985 5.985 0 0 0 4.509 2.011 6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.998-2.9 6.056 6.056 0 0 0-.748-7.073zm-9.022 12.608a4.476 4.476 0 0 1-2.876-1.04l.142-.081 4.778-2.758a.795.795 0 0 0 .393-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.505 4.505 0 0 1-4.495 4.494zm-9.66-4.125a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.758a.771.771 0 0 0 .78 0l5.843-3.368v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.499 4.499 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.814 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855L13.104 8.364 15.12 7.2a.076.076 0 0 1 .07 0l4.831 2.791a4.494 4.494 0 0 1-.676 8.104v-5.677a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.41 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.499 4.499 0 0 1 6.68 4.66zM8.307 12.863l-2.02-1.164a.08.08 0 0 1-.039-.057V6.074a4.499 4.499 0 0 1 7.376-3.454l-.142.08-5.877 3.396a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3l-2.597 1.5-2.607-1.5z" />
        </svg>
      );

    case "anthropic":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-label="Anthropic Claude"
        >
          <path d="M13.827 3.52c-.676-1.36-2.63-1.36-3.306 0L8.14 8.27l-5.01 1.74a1.85 1.85 0 0 0 0 3.496l5.01 1.74 2.38 4.75c.677 1.36 2.63 1.36 3.307 0l2.38-4.75 5.01-1.74a1.85 1.85 0 0 0 0-3.496l-5.01-1.74-2.38-4.75z" />
        </svg>
      );

    case "google-gemini":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-label="Google Gemini"
        >
          <path d="M11.04 1.83C11.37.95 12.63.95 12.96 1.83l2.25 5.98a8.2 8.2 0 0 0 4.98 4.98l5.98 2.25c.88.33.88 1.59 0 1.92l-5.98 2.25a8.2 8.2 0 0 0-4.98 4.98l-2.25 5.98c-.33.88-1.59.88-1.92 0l-2.25-5.98a8.2 8.2 0 0 0-4.98-4.98l-5.98-2.25c-.88-.33-.88-1.59 0-1.92l5.98-2.25a8.2 8.2 0 0 0 4.98-4.98l2.25-5.98z" />
        </svg>
      );

    case "xai":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-label="xAI"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    case "perplexity":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-label="Perplexity"
        >
          <path d="M12 2a1.25 1.25 0 0 1 1.25 1.25v3.42l3.41-1.97a1.25 1.25 0 1 1 1.25 2.16L14.5 8.84v6.32l3.41 1.97a1.25 1.25 0 0 1-1.25 2.16L13.25 17.33v3.42a1.25 1.25 0 1 1-2.5 0v-3.42l-3.41 1.97a1.25 1.25 0 1 1-1.25-2.16L9.5 15.16V8.84L6.09 6.86a1.25 1.25 0 1 1 1.25-2.16l3.41 1.97V3.25A1.25 1.25 0 0 1 12 2z" />
        </svg>
      );

    case "deepseek":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-label="DeepSeek"
        >
          <path d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12c0 3.2 1.5 6.05 3.85 7.85l-.85 1.65a.75.75 0 0 0 .95 1.05l2.45-.95A9.45 9.45 0 0 0 12 22c5.25 0 9.5-4.25 9.5-9.5S17.25 2.5 12 2.5zm0 16.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm-1.5-9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      );
  }
}
