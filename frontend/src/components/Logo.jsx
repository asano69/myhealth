import { createResource, Show } from "solid-js";
import { A } from "@solidjs/router";

// size: overall pixel size of the icon (width == height). Defaults to
// 40px (the old fixed "h-10 w-10" Tailwind size).
// showTitle: whether to render "App Title" next to the icon.
// linkable: whether clicking the logo navigates home ("/"). Defaults to
// false, since Login renders pre-auth where there's nowhere to navigate
// to yet -- it uses Logo without linkable and gets plain text/icon.
// onClick: if provided, the logo becomes a plain clickable button
// instead of a link, and `linkable` is ignored.
export default function Logo(props) {
  // Fetches the running server version from the public, unauthenticated
  // /api/version endpoint (see internal/serve/handler.go), instead of
  // hardcoding it here.
  const [version] = createResource(async () => {
    const res = await fetch("/api/version");
    const data = await res.json();
    return data.version;
  });

  const size = () => props.size ?? 30;
  const icon = (
    // stroke uses currentColor instead of a fixed hex, so the icon
    // follows whatever text color is in scope. Since body already sets
    // text-text (see base.css), and --color-text is defined with
    // light-dark() in theme.css, this adapts to light/dark mode with no
    // extra CSS needed here.
    <svg
      viewBox="0 0 32 32"
      fill="none"
      style={{ width: `${size()}px`, height: `${size()}px` }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M29.9 17.5C29.7 17.2 29.4 17 29 17C26.8 17 24.7 18 23.4 19.8L22.5 21C21.4 22.3 19.7 23 18 23H15C14.4 23 14 22.6 14 22C14 21.4 14.4 21 15 21H16.9C18.5 21 20 19.7 20 18.1C20 18.1 20 18 20 18C20 17.5 19.5 17 19 17L12.9 17C9.3 17 6.4 18.6 4.8 21.2L2.1 25.4C1.9 25.7 1.9 26.1 2.1 26.4L5.1 31.4C5.2 31.6 5.5 31.8 5.7 31.9C5.8 31.9 5.8 31.9 5.9 31.9C6.1 31.9 6.3 31.8 6.5 31.7C10.3 29.2 14.7 27.9 19.2 27.9C22.5 27.9 25.5 26.1 27.1 23.2L29.8 18.4C30 18.2 30 17.8 29.9 17.5Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12.9 15C12.9 15 12.9 15 12.9 15L19 15C20.6 15 22 16.3 22 17.9L22 18.1C22 18.1 22 18.1 22 18.1L28.2 11.7C30.6 9.2 30.6 5.3 28.2 2.8C27 1.7 25.5 1 23.9 1C22.3 1 20.7 1.7 19.5 2.9L19 3.4L18.5 2.9C17.3 1.7 15.8 1 14.1 1C12.5 1 11 1.7 9.8 2.9C7.4 5.4 7.4 9.3 9.8 11.8L12.9 15Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M14 9H15.6L17.3 7.3C17.5 7.1 17.8 7 18.2 7C18.5 7.1 18.8 7.3 18.9 7.5L19.9 9.5L21.1 6.6C21.2 6.3 21.5 6 21.9 6C22.3 6 22.6 6.1 22.8 6.4L24.8 9.4"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
  // Scales with the icon: at the old default size (40px), this works
  // out to 24px, matching the previous fixed "text-2xl" class.
  const titleFontSize = () => size() * 0.6;
  const title = () =>
    props.showTitle && (
      <div
        class="logo font-display"
        style={{ "font-size": `${titleFontSize()}px` }}
      >
        {__APP_NAME__}
      </div>
    );
  // Wraps `children` in whatever interactive element this instance
  // needs: a plain button when onClick is given (takes priority over
  // linkable), a home link with the original hover effects when
  // linkable, or a plain flex container otherwise (Login's case).
  const Wrap = (p) =>
    props.onClick ? (
      <button type="button" onClick={props.onClick} class="contents">
        {p.children}
      </button>
    ) : props.linkable ? (
      <A
        href="/"
        class="group flex items-center gap-2 transition-opacity hover:opacity-60 hover:scale-[1.02]"
      >
        {p.children}
      </A>
    ) : (
      <div class="flex items-center gap-2">{p.children}</div>
    );
  return (
    <div class="flex items-center gap-2">
      <Wrap>
        {icon}
        {title()}
      </Wrap>
      {/* Rendered outside Wrap so it's never part of the clickable
          logo (button/link). */}
      <Show when={version()}>
        <span class="font-mono text-xs">v{version()}</span>
      </Show>
    </div>
  );
}
