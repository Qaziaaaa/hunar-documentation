"use client";

import { useRoleModal } from "./role-modal";

export function OpenRoleModalButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useRoleModal();
  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}