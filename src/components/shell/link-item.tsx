import { resolveLinkImageUrl, resolveLinkTitle } from "@/link-display/link-display";
import type { Link } from "@/library/types";

type LinkItemProps = {
  link: Link;
  showTitle?: boolean;
};

export function LinkItem({ link, showTitle = true }: LinkItemProps) {
  const title = resolveLinkTitle(link);
  const imageUrl = resolveLinkImageUrl(link);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="shell-link-item flex items-center gap-2 rounded-[12px] px-2 py-1.5 text-sm transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
      title={title}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" width={20} height={20} className="shell-image rounded-sm" />
      ) : (
        <span className="inline-block h-5 w-5 rounded-sm bg-black/10" />
      )}
      {showTitle ? <span className="truncate">{title}</span> : null}
    </a>
  );
}
