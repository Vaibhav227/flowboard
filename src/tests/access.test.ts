import { beforeEach, describe, expect, it } from "vitest";
import { canAccessContainer } from "../services/access";
import { containers, grants, users } from "../models/fixtures";
import {
  selectTasks,
  selectVisibleLists,
  useAppStore,
} from "../stores/appStore";

describe("access model", () => {
  beforeEach(() => useAppStore.getState().reset());

  it("allows the admin to view every list", () => {
    expect(
      selectVisibleLists(useAppStore.getState())
        .map((list) => list.id)
        .sort(),
    ).toEqual(["launch", "platform", "research"]);
  });

  it("filters private areas for Bob while honouring an explicit list grant", () => {
    const bob = users.find((user) => user.id === "bob")!;

    expect(canAccessContainer(bob, "launch", containers, grants)).toBe(true);
    expect(canAccessContainer(bob, "platform", containers, grants)).toBe(true);
    expect(canAccessContainer(bob, "research", containers, grants)).toBe(false);
  });

  it("allows Carol to see the complete explicitly granted private path", () => {
    const carol = users.find((user) => user.id === "carol")!;

    expect(canAccessContainer(carol, "product", containers, grants)).toBe(true);

    expect(canAccessContainer(carol, "discovery", containers, grants)).toBe(
      true,
    );

    expect(canAccessContainer(carol, "research", containers, grants)).toBe(
      true,
    );
  });

  it("prevents a member from selecting or mutating a denied list", () => {
    const store = useAppStore.getState();
    store.setCurrentUser("bob");

    expect(store.setSelectedList("research")).toMatchObject({
      error: { code: 403 },
    });

    expect(store.updateTask("t11", { title: "Not allowed" })).toMatchObject({
      error: { code: 403 },
    });
  });

  it("rejects a status belonging to a different list", () => {
    const store = useAppStore.getState();

    expect(store.updateTask("t1", { statusId: "research-done" })).toMatchObject(
      { error: { code: 422 } },
    );
  });

  it("simulates a predictable failure without mutating a task", () => {
    const store = useAppStore.getState();
    store.setSimulateFailures(true);

    const before = selectTasks(store, "launch").find(
      (task) => task.id === "t1",
    )!.title;

    expect(
      store.updateTask("t1", { title: "Should not persist" }),
    ).toMatchObject({ error: { code: 503 } });

    expect(
      useAppStore.getState().tasks.find((task) => task.id === "t1")!.title,
    ).toBe(before);
  });

  it("bulk updates selected tasks through the validation layer", () => {
    const store = useAppStore.getState();

    expect(
      store.bulkUpdateTasks(["t1", "t2"], {
        statusId: "launch-progress",
        assigneeIds: ["carol"],
      }),
    ).toMatchObject({ data: undefined });

    const updated = useAppStore
      .getState()
      .tasks.filter((task) => ["t1", "t2"].includes(task.id));

    expect(
      updated.every(
        (task) =>
          task.statusId === "launch-progress" && task.assigneeIds[0] === "carol",
      ),
    ).toBe(true);
  });
});
