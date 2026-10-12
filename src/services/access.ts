import type { Container, Grant, User } from "../models/types";

export function canAccessContainer(
  user: User,
  containerId: string,
  containers: Container[],
  grants: Grant[],
) {
  if (user.role === "admin") return true;
  const byId = new Map(containers.map((item) => [item.id, item]));
  let current = byId.get(containerId);

  while (current) {
    const grant = grants.find(
      (item) => item.resourceId === current!.id && item.userId === user.id,
    );

    if (grant?.mode === "deny") return false;
    if (current.visibility === "private" && grant?.mode !== "allow")
      return false;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return true;
}

export function isValidChild(
  parent: Container | undefined,
  childType: Container["type"],
) {
  const legal: Record<string, Container["type"][]> = {
    workspace: ["space"],
    space: ["folder"],
    folder: ["list"],
  };

  return Boolean(parent && legal[parent.type]?.includes(childType));
}
