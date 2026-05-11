"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Gauge,
  LogOut,
  Megaphone,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Trash2,
  UserCircle
} from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { calculatePromotionMetrics } from "@/src/domain/promotions/promotion-metrics";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/src/shared/formatters";

const PAGE_SIZE = 50;
const DATADOG_URL = "https://us5.datadoghq.com/logs?query=&agg_m=count&agg_m_source=base&agg_t=count&cols=host%2Cservice&fromUser=true&messageDisplay=inline&refresh_mode=sliding&storage=hot&stream_sort=desc&viz=stream&from_ts=1776178805789&to_ts=1776179705789&live=true";

const navItems = [
  { id: "orders", label: "Ordenes", icon: ClipboardList },
  { id: "central", label: "Central", icon: Gauge },
  { id: "catalog", label: "Catalogo", icon: Store },
  { id: "actions", label: "Acciones", icon: SlidersHorizontal },
  { id: "logs", label: "DataDog", icon: Activity },
  { id: "profile", label: "Perfil", icon: UserCircle },
  { id: "notifications", label: "Notificaciones", icon: Bell }
];

const statusFilters = [
  { value: "ACTIVE", label: "Activas" },
  { value: "SYNC", label: "Sincronizadas" },
  { value: "DELETED", label: "Eliminadas" }
];

export function PromotionsDashboard() {
  const [section, setSection] = useState("central");
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [promotions, setPromotions] = useState({ data: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [orders, setOrders] = useState({ data: [], total: 0 });
  const [catalog, setCatalog] = useState({ data: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState({ central: true, orders: true, catalog: true, profile: true });
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCoreData() {
      setLoading((current) => ({ ...current, central: true, orders: true }));
      setError("");

      const params = new URLSearchParams({
        status,
        page: String(page),
        limit: String(PAGE_SIZE),
        q: query
      });

      try {
        const [promotionsResponse, ordersResponse] = await Promise.all([
          fetch(`/api/promotions?${params}`, { signal: abortController.signal }),
          fetch("/api/orders?limit=12", { signal: abortController.signal })
        ]);

        if (promotionsResponse.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!promotionsResponse.ok) throw new Error("No se pudieron cargar promociones");

        const promotionsData = await promotionsResponse.json();
        const ordersData = ordersResponse.ok ? await ordersResponse.json() : { data: [], total: 0 };

        setPromotions(promotionsData);
        setOrders(ordersData);
        setSelected((current) => current || promotionsData.data?.[0] || null);
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading((current) => ({ ...current, central: false, orders: false }));
        }
      }
    }

    loadCoreData();
    return () => abortController.abort();
  }, [page, query, status]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCatalog() {
      setLoading((current) => ({ ...current, catalog: true }));

      try {
        const params = new URLSearchParams({ page: "1", limit: "50" });
        const response = await fetch(`/api/promotion-catalog?${params}`, { signal: abortController.signal });
        if (response.ok) setCatalog(await response.json());
      } finally {
        if (!abortController.signal.aborted) {
          setLoading((current) => ({ ...current, catalog: false }));
        }
      }
    }

    loadCatalog();
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/auth/me");
      if (response.ok) setProfile(await response.json());
      setLoading((current) => ({ ...current, profile: false }));
    }

    loadProfile();
  }, []);

  const metrics = useMemo(() => calculatePromotionMetrics(promotions.data, promotions.total), [promotions]);
  const notifications = useMemo(() => buildNotifications(promotions.data, orders.data), [promotions.data, orders.data]);

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setPage(1);
    setSelected(null);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div>CP</div>
          <span>Promo Center</span>
        </div>

        <nav className="ops-nav" aria-label="Secciones del panel">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={section === item.id ? "is-active" : ""} onClick={() => setSection(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button className="ops-logout" onClick={logout}>
          <LogOut size={18} />
          Salir
        </button>
      </aside>

      <section className="ops-main">
        <header className="ops-header">
          <div>
            <span className="ops-kicker"><ShieldCheck size={15} /> Central de promociones MELI</span>
            <h1>{titleFor(section)}</h1>
            <p>{descriptionFor(section)}</p>
          </div>
          <div className="ops-header-actions">
            <span className="user-chip"><UserCircle size={17} /> {profile?.email || "Sesion activa"}</span>
            <button className="clear-button" onClick={() => window.location.reload()}>
              <RefreshCw size={17} />
              Actualizar
            </button>
          </div>
        </header>

        {section === "central" ? (
          <CentralSection
            promotions={promotions}
            selected={selected}
            setSelected={setSelected}
            metrics={metrics}
            status={status}
            changeStatus={changeStatus}
            query={query}
            setQuery={setQuery}
            page={page}
            setPage={setPage}
            loading={loading.central}
            error={error}
          />
        ) : null}

        {section === "orders" ? <OrdersSection orders={orders} loading={loading.orders} /> : null}
        {section === "catalog" ? <CatalogSection catalog={catalog} loading={loading.catalog} /> : null}
        {section === "actions" ? <ActionsSection /> : null}
        {section === "logs" ? <LogsSection /> : null}
        {section === "profile" ? <ProfileSection profile={profile} loading={loading.profile} /> : null}
        {section === "notifications" ? <NotificationsSection notifications={notifications} /> : null}
      </section>
    </main>
  );
}

function CentralSection({ promotions, selected, setSelected, metrics, status, changeStatus, query, setQuery, page, setPage, loading, error }) {
  return (
    <div className="module-stack">
      <section className="metric-grid-clean">
        <Metric icon={Boxes} label="Promociones" value={formatNumber(metrics.total)} detail="Total filtrado en Mongo" />
        <Metric icon={CheckCircle2} label="Rentables" value={formatNumber(metrics.profitable)} detail="En la pagina actual" />
        <Metric icon={PauseCircle} label="Should pause" value={formatNumber(metrics.shouldPause)} detail="Alertas del algoritmo" />
        <Metric icon={Megaphone} label="Rentabilidad prom." value={formatPercent(metrics.avgProfitability)} detail="Promedio visible" />
      </section>

      <section className="ops-toolbar">
        <div className="search-box-clean">
          <Search size={18} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar SKU, item, promocion o nombre" />
        </div>
        <div className="filter-tabs">
          {statusFilters.map((filter) => (
            <button key={filter.value} className={status === filter.value ? "is-active" : ""} onClick={() => changeStatus(filter.value)}>
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="inline-alert">{error}</div> : null}

      <section className="split-panel">
        <PromotionsTable items={promotions.data || []} selected={selected} onSelect={setSelected} loading={loading} />
        <PromotionDetail promotion={selected} />
      </section>

      <Pagination page={page} totalPages={promotions.totalPages || 1} onPage={setPage} />
    </div>
  );
}

function OrdersSection({ orders, loading }) {
  return (
    <section className="clean-card">
      <SectionHead title="Ordenes de promociones" text="Ordenes que entran por campañas y promociones activas." />
      <div className="table-scroll-clean">
        <table className="clean-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Item</th>
              <th>Promocion</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows columns={6} /> : (orders.data || []).map((order) => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{order.itemId || "-"}</td>
                <td>{order.promotionId || "-"}</td>
                <td><span className="soft-badge">{order.status || "-"}</span></td>
                <td>{formatCurrency(order.grossAmount)}</td>
                <td>{formatDateTime(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CatalogSection({ catalog, loading }) {
  return (
    <section className="clean-card">
      <SectionHead title="Catalogo de promociones" text="Campañas disponibles para participar, analizar o accionar." />
      <div className="table-scroll-clean">
        <table className="clean-table">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>ID</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows columns={7} /> : (catalog.data || []).map((promotion) => (
              <tr key={promotion._id || promotion.promotionId}>
                <td><strong>{promotion.name}</strong></td>
                <td>{promotion.promotionId}</td>
                <td>{promotion.type}</td>
                <td><span className="soft-badge">{promotion.status}</span></td>
                <td>{formatDateTime(promotion.startDate)}</td>
                <td>{formatDateTime(promotion.finishDate)}</td>
                <td>{formatDateTime(promotion.deadlineDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionsSection() {
  const [promotionId, setPromotionId] = useState("");
  const [result, setResult] = useState("");
  const [running, setRunning] = useState("");

  async function run(action) {
    setRunning(action);
    setResult("");

    const response = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: { promotionId } })
    });

    const data = await response.json().catch(() => ({}));
    setRunning("");
    setResult(response.ok ? "Accion enviada correctamente." : data.message || "No se pudo ejecutar la accion.");
  }

  return (
    <div className="actions-grid">
      <section className="clean-card">
        <SectionHead title="Acciones masivas" text="Operaciones sobre la central. Dejadas separadas para reducir errores." />
        <div className="action-list">
          <button onClick={() => run("activateAll")} disabled={Boolean(running)}><PlayCircle size={18} /> Activar todas las aptas</button>
          <button onClick={() => run("deactivateAll")} disabled={Boolean(running)}><Trash2 size={18} /> Desactivar todas</button>
          <button onClick={() => run("resync")} disabled={Boolean(running)}><RefreshCw size={18} /> Sincronizar central</button>
        </div>
      </section>

      <section className="clean-card">
        <SectionHead title="Activar campaña" text="Ejecuta participacion para una campaña puntual del catalogo." />
        <label className="field-label">
          Promotion ID
          <input value={promotionId} onChange={(event) => setPromotionId(event.target.value)} placeholder="P-MLA17339026" />
        </label>
        <button className="primary-action" onClick={() => run("activateCampaign")} disabled={!promotionId || Boolean(running)}>
          <PlayCircle size={18} />
          Activar campaña
        </button>
        {result ? <p className="action-result">{running ? "Procesando..." : result}</p> : null}
      </section>
    </div>
  );
}

function LogsSection() {
  return (
    <section className="clean-card logs-card">
      <SectionHead title="Logs DataDog" text="Acceso directo al stream de logs operativo de la central." />
      <a className="datadog-link" href={DATADOG_URL} target="_blank" rel="noreferrer">
        <Activity size={20} />
        Abrir logs en DataDog
        <ExternalLink size={17} />
      </a>
    </section>
  );
}

function ProfileSection({ profile, loading }) {
  return (
    <section className="clean-card profile-card">
      <SectionHead title="Usuario logueado" text="Datos de sesion validados contra auth-api." />
      {loading ? <div className="panel-placeholder">Cargando perfil...</div> : (
        <div className="profile-grid">
          <Info label="Nombre" value={profile?.name || "-"} />
          <Info label="Email" value={profile?.email || "-"} />
          <Info label="Rol" value={profile?.role || "-"} />
          <Info label="ID" value={profile?.id || "-"} />
        </div>
      )}
    </section>
  );
}

function NotificationsSection({ notifications }) {
  return (
    <section className="clean-card">
      <SectionHead title="Notificaciones" text="Ultimos procesos detectados desde promociones, ordenes y audit trail." />
      <div className="notification-list">
        {notifications.map((item) => (
          <article key={item.id}>
            <span className={`dot dot--${item.tone}`} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
              <small>{item.date}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromotionsTable({ items, selected, onSelect, loading }) {
  return (
    <section className="clean-card central-table">
      <SectionHead title="Promociones en Mongo" text="Vista paginada por estado, optimizada para volumen alto." />
      <div className="table-scroll-clean">
        <table className="clean-table">
          <thead>
            <tr>
              <th>Promocion</th>
              <th>Item / SKU</th>
              <th>Precio</th>
              <th>Profit</th>
              <th>Margen</th>
              <th>Estado</th>
              <th>Ultima accion</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows columns={7} /> : items.map((item) => (
              <tr key={item._id || item.itemId} className={selected?._id === item._id ? "is-selected" : ""} onClick={() => onSelect(item)}>
                <td><strong>{item.name}</strong><small>{item.promotionId} · {item.type}</small></td>
                <td><strong>{item.itemId}</strong><small>{item.sku || "-"} · {item.categoryId || "-"}</small></td>
                <td><strong>{formatCurrency(item.prices?.suggestedPrice)}</strong><small>Base {formatCurrency(item.prices?.originalPrice)}</small></td>
                <td className={item.economics?.profitable ? "positive" : "negative"}><strong>{formatCurrency(item.economics?.profit)}</strong><small>{formatPercent(item.economics?.profitability)}</small></td>
                <td><strong>{formatPercent(item.economics?.margin)}</strong><small>Costo {formatCurrency(item.economics?.cost)}</small></td>
                <td><StatusPill status={item.status} /></td>
                <td><strong>{item.metadata?.sourceProcess || "-"}</strong><small>{formatDateTime(item.updatedAt)}</small></td>
              </tr>
            ))}
            {!loading && !items.length ? <tr><td colSpan="7" className="empty-cell">No hay promociones para este filtro.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PromotionDetail({ promotion }) {
  if (!promotion) {
    return (
      <aside className="clean-card detail-clean">
        <div className="panel-placeholder">Selecciona una promocion para ver su detalle.</div>
      </aside>
    );
  }

  return (
    <aside className="clean-card detail-clean">
      <div className="detail-title">
        <StatusPill status={promotion.status} />
        <h2>{promotion.itemId}</h2>
        <p>{promotion.name}</p>
      </div>

      <div className="info-grid-compact">
        <Info label="Precio sugerido" value={formatCurrency(promotion.prices?.suggestedPrice)} />
        <Info label="Profit" value={formatCurrency(promotion.economics?.profit)} />
        <Info label="Seller resigna" value={formatPercent(promotion.terms?.resignation?.seller?.percentage)} />
        <Info label="ML resigna" value={formatPercent(promotion.terms?.resignation?.mercadolibre?.percentage)} />
      </div>

      <div className="decision-box">
        <strong>Decision del algoritmo</strong>
        <p>{promotion.metadata?.statusReason || promotion.metadata?.reason || "Sin motivo informado"}</p>
      </div>

      <div className="mini-timeline">
        <h3>Audit trail</h3>
        {(promotion.auditTrail || []).slice().reverse().slice(0, 5).map((event, index) => (
          <article key={`${event.process}-${event.executedAt}-${index}`}>
            <span />
            <div>
              <strong>{event.process}</strong>
              <small>{event.status} · {formatDateTime(event.executedAt)}</small>
              <p>{event.reason}</p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <article className="metric-clean">
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function SectionHead({ title, text }) {
  return (
    <div className="section-head-clean">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <footer className="pagination-clean">
      <span>Pagina {page} de {formatNumber(totalPages)}</span>
      <div>
        <button onClick={() => onPage((value) => Math.max(1, value - 1))} disabled={page <= 1}><ChevronLeft size={18} /></button>
        <button onClick={() => onPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}><ChevronRight size={18} /></button>
      </div>
    </footer>
  );
}

function SkeletonRows({ columns }) {
  return Array.from({ length: 8 }).map((_, index) => (
    <tr key={index} className="skeleton-row-clean">
      <td colSpan={columns}><span /></td>
    </tr>
  ));
}

function buildNotifications(promotions = [], orders = []) {
  const auditEvents = promotions.flatMap((promotion) => (promotion.auditTrail || []).slice(-2).map((event) => ({
    id: `${promotion.itemId}-${event.process}-${event.executedAt}`,
    title: event.process,
    text: `${promotion.itemId}: ${event.reason}`,
    date: formatDateTime(event.executedAt),
    tone: event.status === "DELETED" ? "red" : event.status === "ACTIVE" ? "green" : "blue"
  })));

  const orderEvents = orders.slice(0, 3).map((order) => ({
    id: order.id,
    title: "Orden de promocion",
    text: `${order.id} · ${order.itemId || "sin item"} · ${formatCurrency(order.grossAmount)}`,
    date: formatDateTime(order.createdAt),
    tone: "amber"
  }));

  return [...auditEvents, ...orderEvents].slice(0, 12);
}

function titleFor(section) {
  return {
    orders: "Ordenes",
    central: "Central de promociones",
    catalog: "Catalogo de promociones",
    actions: "Acciones operativas",
    logs: "Logs de DataDog",
    profile: "Perfil",
    notifications: "Notificaciones"
  }[section];
}

function descriptionFor(section) {
  return {
    orders: "Ordenes que llegan desde promociones y campañas activas.",
    central: "Todas las promociones del Mongo con filtros por estado y lectura economica.",
    catalog: "Campañas disponibles para activar, auditar o cruzar contra la central.",
    actions: "Activaciones, desactivaciones y sincronizaciones controladas.",
    logs: "Acceso directo al stream operativo para investigar procesos.",
    profile: "Informacion del usuario autenticado con auth-api.",
    notifications: "Ultimos procesos, cambios de estado y eventos importantes."
  }[section];
}
