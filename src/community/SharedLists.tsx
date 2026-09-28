import { useEffect, useRef, useState } from "react";
import { Users, LogIn, Plus, Search } from "lucide-react";
import { api } from "../bridge";
import type { Game, Member, SharedState, ShoppingList } from "../types";
import { catalogs, gameNames } from "../catalog/catalogs";
import { ListDetail } from "../planner/ShoppingLists";
import { Dialog } from "../ui/Dialog";

const initial: SharedState = {
  account: {
    state: "signed-out",
    message: "Connect your Bancy.gg account to share lists.",
  },
  lists: [],
  active: null,
  online: false,
  message: "",
};
export function useSharing() {
  const [state, setState] = useState(initial);
  useEffect(() => {
    let live = true;
    const off = api.onShared((s) => {
      if (live) setState(s);
    });
    api
      .sharedStatus()
      .then((s) => {
        if (live) setState(s);
      })
      .catch(() => {});
    return () => {
      live = false;
      off();
    };
  }, []);
  return state;
}
export function AccountSettings({ state }: { state: SharedState }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(disconnect = false) {
    setBusy(true);
    setError("");
    try {
      if (disconnect) await api.accountDisconnect();
      else await api.accountConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel content-panel">
      <h2>
        <Users size={22} />
        Website account
      </h2>
      <p>
        Share private shopping lists with friends using your existing Bancy.gg
        account. No cipher key is needed.
      </p>
      {state.account.user && (
        <p>
          <strong>{state.account.user.displayName}</strong>
          <br />
          <small>{state.account.user.email}</small>
        </p>
      )}
      <p role="status">{state.account.message}</p>
      {error && <p role="alert">{error}</p>}
      <div className="actions">
        <button
          className="button primary"
          disabled={busy || !window.bancy}
          onClick={() => act()}
        >
          <LogIn size={17} />
          {state.account.state === "connected"
            ? "Reconnect website account"
            : state.account.state === "connecting"
              ? "Open connection again"
              : "Connect to Bancy.gg"}
        </button>
        {state.account.state !== "signed-out" && (
          <button
            className="button outline"
            disabled={busy}
            onClick={() => act(true)}
          >
            Disconnect
          </button>
        )}
      </div>
      <p className="small muted">
        The browser asks you to approve this app. Your bank and Blackbox still
        require a cipher key and existing website permissions.
      </p>
    </section>
  );
}
export function SharedLists({
  game,
  local,
  state,
}: {
  game: Game;
  local: ShoppingList[];
  state: SharedState;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [source, setSource] = useState(""),
    [friend, setFriend] = useState(""),
    [results, setResults] = useState<Member[]>([]),
    [adding, setAdding] = useState(false),
    [query, setQuery] = useState(""),
    [quantity, setQuantity] = useState(1),
    [deleting, setDeleting] = useState(false),
    [views, setViews] = useState<
      Record<
        string,
        { collapsed: Record<string, boolean>; hideCompleted: boolean }
      >
    >({});
  const lock = useRef(false);
  const active = state.active?.game === game ? state.active : null;
  const own = active?.ownerUid === state.account.user?.uid;
  useEffect(() => {
    setResults([]);
    setFriend("");
    setAdding(false);
    setDeleting(false);
    setError("");
  }, [active?.id, game]);
  async function run(action: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save shared changes.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (state.account.state !== "connected")
    return (
      <>
        <div className="page-heading shared-lists-heading">
          <div>
            <p className="eyebrow">BUILD TOGETHER</p>
            <h2>Shared lists</h2>
            <p>Your friends, the same requirements, live progress.</p>
          </div>
        </div>
        <AccountSettings state={state} />
      </>
    );
  const disabled = busy || !state.online;
  const displayed = active ? { ...active, ...views[active.id] } : null;
  function change(next: ShoppingList) {
    if (!active) return;
    setViews((v) => ({
      ...v,
      [active.id]: {
        collapsed: next.collapsed,
        hideCompleted: next.hideCompleted,
      },
    }));
    const fields = ["name", "targets", "recipes", "progress"] as const;
    if (
      fields.some((f) => JSON.stringify(next[f]) !== JSON.stringify(active[f]))
    )
      void run(() => api.sharedChange(active.id, active, next));
  }
  return (
    <>
      <div className="page-heading shared-lists-heading">
        <div>
          <p className="eyebrow">BUILD TOGETHER</p>
          <h2>Shared lists</h2>
          <p>
            {gameNames[game]} · {state.account.user?.displayName} ·{" "}
            {state.online ? "Live connection" : "Reconnecting"}
          </p>
        </div>
        <Users size={32} />
      </div>
      {(state.message || error) && (
        <div className="notice" role="alert">
          {error || state.message}
        </div>
      )}
      {active && displayed ? (
        <>
          <section className="panel content-panel shared-members">
            <h2>People on this list</h2>
            <div className="actions">
              {active.members.map((m) => (
                <span className="member-chip" key={m.uid}>
                  {m.displayName}
                  {m.uid === active.ownerUid ? " · Owner" : ""}
                  {own && m.uid !== active.ownerUid && (
                    <button
                      className="text-button"
                      disabled={disabled}
                      aria-label={"Remove " + m.displayName}
                      onClick={() =>
                        run(() => api.sharedRemoveMember(active.id, m.uid))
                      }
                    >
                      Remove
                    </button>
                  )}
                </span>
              ))}
            </div>
            {own && (
              <form
                className="actions"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () =>
                    setResults(await api.sharedSearch(friend)),
                  );
                }}
              >
                <label>
                  Find a friend
                  <input
                    aria-label="Friend display name"
                    value={friend}
                    minLength={2}
                    maxLength={32}
                    onChange={(e) => {
                      setFriend(e.target.value);
                      setResults([]);
                    }}
                    placeholder="Their Bancy.gg display name"
                  />
                </label>
                <button
                  className="button outline"
                  disabled={disabled || friend.trim().length < 2}
                >
                  <Search size={16} />
                  Search people
                </button>
              </form>
            )}
            {results.map((m) => (
              <div className="actions" key={m.uid}>
                <span>
                  {m.displayName} <small>…{m.uid.slice(-6)}</small>
                </span>
                <button
                  className="button outline"
                  disabled={
                    disabled || active.members.some((p) => p.uid === m.uid)
                  }
                  onClick={() =>
                    run(async () => {
                      await api.sharedAdd(active.id, m.uid);
                      setResults([]);
                      setFriend("");
                    })
                  }
                >
                  Add friend
                </button>
              </div>
            ))}
            {own && (
              <p className="small muted">
                Friends appear after they connect their account in BancyCraft.
                Everyone on this list can edit targets and progress. Only you
                can add or remove members.
              </p>
            )}
          </section>
          {adding && (
            <section className="panel content-panel">
              <h2>Add an item</h2>
              <div className="actions">
                <input
                  aria-label="Search shared list items"
                  placeholder={`Search ${gameNames[game]}…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <label>
                  Quantity
                  <input
                    aria-label="Shared item quantity"
                    type="number"
                    min={1}
                    max={999999}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(
                            999999,
                            Math.floor(Number(e.target.value) || 1),
                          ),
                        ),
                      )
                    }
                  />
                </label>
              </div>
              {query.trim().length >= 2 &&
                catalogs[game].items
                  .filter((i) =>
                    i.name.toLowerCase().includes(query.toLowerCase()),
                  )
                  .slice(0, 12)
                  .map((item) => (
                    <div className="actions shared-item-result" key={item.id}>
                      <span>{item.name}</span>
                      <button
                        className="button outline"
                        disabled={disabled}
                        onClick={() => {
                          const targets = active.targets.map((t) => ({ ...t })),
                            existing = targets.find(
                              (t) => t.itemId === item.id,
                            );
                          if (existing) existing.quantity += quantity;
                          else
                            targets.push({
                              itemId: item.id,
                              name: item.name,
                              quantity,
                            });
                          change({ ...active, targets });
                        }}
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  ))}
            </section>
          )}
          <ListDetail
            key={active.id}
            list={displayed}
            supplies={[]}
            busy={disabled}
            shared
            canDelete={own}
            onChange={change}
            onBack={() => run(() => api.sharedWatch(null))}
            onBrowse={() => setAdding(!adding)}
            onDelete={() => setDeleting(true)}
            activity={Object.fromEntries(
              Object.entries(active.activity).map(([key, a]) => [
                key,
                `${a.amount === 0 ? "Reset" : "Updated"} by ${active.members.find((m) => m.uid === a.byUid)?.displayName || "Former member"} · ${new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
              ]),
            )}
          />
          {deleting && (
            <Dialog
              title="Delete shared list?"
              onClose={() => setDeleting(false)}
            >
              <p>
                This removes “{active.name}” for everyone. Your original local
                list stays on this computer.
              </p>
              <div className="modal-actions">
                <button
                  className="button outline"
                  onClick={() => setDeleting(false)}
                >
                  Keep list
                </button>
                <button
                  className="button danger"
                  disabled={disabled}
                  onClick={() => run(() => api.sharedRemove(active.id))}
                >
                  Delete shared list
                </button>
              </div>
            </Dialog>
          )}
        </>
      ) : (
        <>
          <section className="panel content-panel">
            <h2>Share a local list</h2>
            <p>
              Create a shared copy, then invite a friend. The original remains
              local. Personal supplies are not included in shared calculations.
            </p>
            <div className="actions">
              <select
                aria-label="Local list to share"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">Choose a saved list…</option>
                {local
                  .filter((l) => l.game === game)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
              </select>
              <button
                className="button primary"
                disabled={disabled || !source}
                onClick={() => run(() => api.sharedCreate(source))}
              >
                <Users size={16} />
                Share list
              </button>
            </div>
          </section>
          <div className="saved-list-grid">
            {state.lists
              .filter((l) => l.game === game)
              .map((l) => (
                <button
                  className="panel saved-list-card"
                  key={l.id}
                  disabled={busy}
                  onClick={() => run(() => api.sharedWatch(l.id))}
                >
                  <Users size={24} />
                  <span>
                    <strong>{l.name}</strong>
                    <small>
                      {l.members} {l.members === 1 ? "person" : "people"} ·{" "}
                      {l.ownerUid === state.account.user?.uid
                        ? "Your shared list"
                        : "Shared with you"}
                    </small>
                  </span>
                </button>
              ))}
          </div>
          {!state.lists.some((l) => l.game === game) && (
            <p className="muted">No shared lists for this game yet.</p>
          )}
        </>
      )}
      <p className="small muted">
        Shared changes save online and appear for everyone connected to the
        list. Offline local lists remain available. Simultaneous edits to the
        same row prompt you to review your friend’s latest progress.
      </p>
    </>
  );
}
