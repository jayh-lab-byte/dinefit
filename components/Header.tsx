"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export function Header({ back }: { back?: boolean }) {
  const router = useRouter();
  return (
    <header className="topbar">
      <div className="top-slot">
        {back ? (
          <button className="icon-btn" type="button" aria-label="뒤로" onClick={() => router.back()}>
            <Icon name="back" />
          </button>
        ) : null}
      </div>
      <Link className="brand" href="/">
        Dinefit
      </Link>
      <Link className="icon-btn" href="/saved" aria-label="보관">
        <Icon name="bookmark" />
      </Link>
    </header>
  );
}
