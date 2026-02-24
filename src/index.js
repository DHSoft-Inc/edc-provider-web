import Modal, {useModal} from "@clayui/modal";

export function ControlledModal({open, title, size = "sm", className, onClose, body, footer}) {
    const {observer} = useModal({onClose});
    if (!open) return null;

    return (
        <Modal className={className} observer={observer} size={size}>
            <Modal.Header>{title}</Modal.Header>
            <Modal.Body>{body}</Modal.Body>
            <Modal.Footer last={footer}/>
        </Modal>
    );
}

export function getPortletCtx(resKey) {
    const ctx = window.EDCPortletInfo?.portletParams || {};
    const ns = ctx.namespace || "";
    const resURL = ctx.ResourceURLs[resKey];
    return { ns, resURL };
}

export function buildURL(action, params = {}, resKey) {
    const {ns, resURL} = getPortletCtx(resKey);
    const url = new URL(resURL, window.location.origin);
    url.searchParams.set(`${ns}op`, action);
    url.searchParams.set(`op`, action);
    for (const [k, v] of Object.entries(params ?? {})) {
        if (v != null) url.searchParams.set(`${ns}${k}`, String(v));
        url.searchParams.set(k, String(v));
    }
    return url.toString();
}

export async function apiGET(action, params, resKey) {
    const url = buildURL(action, params, resKey);
    const res = await fetch(url, { credentials: "include" });
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    try { return JSON.parse(raw); }
    catch { throw new Error("Not JSON → " + raw.slice(0, 200)); }
}

export async function apiPOST(action, params, resKey) {
    const { ns, resURL } = getPortletCtx(resKey);
    const body = new URLSearchParams();
    body.set(`${ns}op`, action);
    body.set("op", action);

    for (const [k, v] of Object.entries(params || {})) {
        if (v == null) continue;
        body.set(`${ns}${k}`, String(v));
        body.set(k, String(v));
    }

    const res = await fetch(resURL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: body.toString(),
    });

    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const trimmed = raw.trim();
    if (!trimmed) return { ok: true };
    try {
        return JSON.parse(trimmed);
    } catch {
        throw new Error("Not JSON : " + trimmed.slice(0, 200));
    }
}

export function asItems(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    return data.items || data.rows || data.data || [];
}