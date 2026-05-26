"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  AlertTriangle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  Gauge,
  LogOut,
  Mail,
  Megaphone,
  Moon,
  PlayCircle,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Trash2,
  UserPlus,
  UserCircle
} from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AporteMlChart } from "@/components/dashboard/aporte-ml-chart";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/src/shared/formatters";

const PAGE_SIZE = 100;
const DATADOG_URL = "https://us5.datadoghq.com/logs/livetail?query=service%3Acentral-promos-enginee%20MLA17373038&agg_m=count&agg_m_source=base&agg_t=count&cols=host%2Cservice&messageDisplay=inline&refresh_mode=sliding&storage=driveline&stream_sort=desc&viz=stream&from_ts=1778544856723&to_ts=1778545756723&live=true";

const navItems = [
  { id: "orders", label: "Ordenes", icon: ClipboardList },
  { id: "central", label: "Central", icon: Gauge },
  { id: "catalog", label: "Catalogo", icon: Store },
  { id: "pricing", label: "Pricing", icon: Calculator },
  { id: "actions", label: "Acciones", icon: SlidersHorizontal },
  { id: "logs", label: "DataDog", icon: Activity },
  { id: "notifications", label: "Notificaciones", icon: Bell }
];

const statusFilters = [
  { value: "", label: "Todas" },
  { value: "ACTIVE", label: "Activas" },
  { value: "SYNCED", label: "Sync" },
  { value: "DELETED", label: "Eliminadas" }
];

const orderStatusFilters = [
  { value: "", label: "Todas" },
  { value: "paid", label: "Pagadas" },
  { value: "cancelled", label: "Canceladas" }
];

const emptyPromotionStats = {
  total: 0,
  smart: { total: 0, pending: 0, active: 0, paused: 0, synced: 0, deleted: 0, finished: 0, failedSync: 0, failedActivation: 0, failedDeactivation: 0 },
  deal: { total: 0, pending: 0, active: 0, paused: 0, synced: 0, deleted: 0, finished: 0, failedSync: 0, failedActivation: 0, failedDeactivation: 0 },
  preNegotiated: { total: 0, pending: 0, active: 0, paused: 0, synced: 0, deleted: 0, finished: 0, failedSync: 0, failedActivation: 0, failedDeactivation: 0 }
};

async function readOptionalJson(result) {
  if (result.status !== "fulfilled" || !result.value.ok) {
    return {};
  }

  return result.value.json();
}

export function PromotionsDashboard() {
  const [section, setSection] = useState("central");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [promotions, setPromotions] = useState({ data: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [promotionStats, setPromotionStats] = useState(emptyPromotionStats);
  const [orders, setOrders] = useState({ data: [], total: 0 });
  const [catalog, setCatalog] = useState({ data: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState({ central: true, orders: true, catalog: true, profile: true });
  const [error, setError] = useState("");
  const [nightMode, setNightMode] = useState(false);
  const isBusy = loading.central || loading.orders || loading.catalog || loading.profile;

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCoreData() {
      setLoading((current) => ({ ...current, central: true, orders: true }));
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE)
      });

      if (status) params.set("status", status);
      if (query) params.set("q", query);

      try {
        const [promotionsResult, ordersResult, statsResult] = await Promise.allSettled([
          fetch(`/api/promotions?${params}`, { signal: abortController.signal }),
          fetch("/api/orders?limit=12", { signal: abortController.signal }),
          fetch("/api/promotion-stats", { signal: abortController.signal })
        ]);

        if (promotionsResult.status === "rejected") {
          throw promotionsResult.reason;
        }

        const promotionsResponse = promotionsResult.value;

        if (promotionsResponse.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!promotionsResponse.ok) throw new Error("No se pudieron cargar promociones");

        const promotionsData = await promotionsResponse.json();
        const ordersResponse = ordersResult.status === "fulfilled" ? ordersResult.value : null;
        const ordersData = ordersResponse?.ok ? await ordersResponse.json() : { data: [], total: 0 };
        const statsData = await readOptionalJson(statsResult);

        setPromotions(promotionsData);
        setPromotionStats({ ...emptyPromotionStats, ...statsData });
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
        const params = new URLSearchParams({ page: "1", limit: "100" });
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
    <main className={nightMode ? "ops-shell is-night" : "ops-shell"}>
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="ops-brand-media">
            <img src="/meli-logo.png" alt="Mercado Libre" />
          </div>
          <div className="ops-brand-copy">
          
            <strong>Central de promociones</strong>
          </div>
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

        <div className="ops-sidebar-footer">
          <button className={section === "configuration" ? "ops-logout is-active" : "ops-logout"} onClick={() => setSection("configuration")}>
            <Settings size={18} />
            Configuracion
          </button>
          <span>V.0.01</span>
        </div>
      </aside>

      <section className="ops-main">
        {isBusy ? (
          <div className="panel-busy-indicator">
            <LoadingSpinner size="sm" label="Actualizando panel" />
            Actualizando
          </div>
        ) : null}

        <header className="ops-header">
          <div>
            <span className="ops-kicker"><ShieldCheck size={15} /> Central de promociones MELI</span>
            <h1>{titleFor(section)}</h1>
            <p>{descriptionFor(section)}</p>
          </div>
          <div className="ops-header-actions">
            <span className="user-chip"><UserCircle size={17} /> {profile?.email || "Sesion activa"}</span>
            <button className="clear-button" onClick={() => window.location.reload()}>
              {isBusy ? <LoadingSpinner size="sm" label="Actualizando datos" /> : <RefreshCw size={17} />}
              Actualizar
            </button>
          </div>
        </header>

        {section === "central" ? (
          <CentralSection
            promotions={promotions}
            selected={selected}
            setSelected={setSelected}
            stats={promotionStats}
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
        {section === "pricing" ? <PricingSection /> : null}
        {section === "actions" ? <ActionsSection /> : null}
        {section === "logs" ? <LogsSection /> : null}
        {section === "notifications" ? <NotificationsSection notifications={notifications} /> : null}
        {section === "configuration" ? <ConfigurationSection profile={profile} nightMode={nightMode} setNightMode={setNightMode} onLogout={logout} /> : null}
      </section>
    </main>
  );
}

function CentralSection({ promotions, selected, setSelected, stats, status, changeStatus, query, setQuery, page, setPage, loading, error }) {
  return (
    <div className="module-stack">
      <PromotionStats stats={stats} loading={loading} />

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

      <section className="central-data-stack">
        <PromotionsTable items={promotions.data || []} selected={selected} onSelect={setSelected} loading={loading} />
        <PromotionDetail promotion={selected} />
      </section>

      <Pagination page={page} totalPages={promotions.totalPages || 1} onPage={setPage} />
    </div>
  );
}

function PromotionStats({ stats, loading }) {
  const groups = [
    { key: "smart", label: "SMART", data: stats.smart },
    { key: "deal", label: "DEAL", data: stats.deal },
    { key: "preNegotiated", label: "PRE_NEGOTIATED", data: stats.preNegotiated }
  ];

  if (loading) {
    return <LoadingBlock label="Cargando estadisticas de promociones" compact />;
  }

  return (
    <section className="promotion-stats-grid">
      <article className="clean-card promotion-total-card">
        <span>Total promociones</span>
        <strong>{formatNumber(stats.total || 0)}</strong>
       
      </article>
      {groups.map((group) => (
        <article className="clean-card promotion-type-card" key={group.key}>
          <div className="promotion-type-head">
            <div>
              <span>{group.label}</span>
              <strong>{formatNumber(group.data?.total || 0)}</strong>
            </div>
            <small>Total del tipo</small>
          </div>
          <div className="promotion-type-breakdown">
            <StatusMetric label="Activas" value={group.data?.active || 0} tone="active" />
            <StatusMetric label="Synced" value={group.data?.synced || 0} tone="synced" />
            <StatusMetric label="Finalizadas" value={group.data?.finished || 0} tone="finished" />
            <StatusMetric label="Eliminadas" value={group.data?.deleted || 0} tone="deleted" />
            <StatusMetric label="Pendientes" value={group.data?.pending || 0} tone="pending" subtle />
            <StatusMetric label="Pausadas" value={group.data?.paused || 0} tone="paused" subtle />
          </div>
          <div className="promotion-alert-strip">
            <StatusMetric label="Failed sync" value={group.data?.failedSync || 0} tone="failed" compact />
            <StatusMetric label="Fallidas act." value={group.data?.failedActivation || 0} tone="failed" compact />
            <StatusMetric label="Fallidas desact." value={group.data?.failedDeactivation || 0} tone="critical" compact />
          </div>
        </article>
      ))}
    </section>
  );
}

function StatusMetric({ label, value, tone, compact = false, subtle = false }) {
  return (
    <div className={`status-metric status-metric--${tone}${compact ? " status-metric--compact" : ""}${subtle ? " status-metric--subtle" : ""}`}>
      <span><i aria-hidden="true" />{label}</span>
      <strong>{formatNumber(value || 0)}</strong>
    </div>
  );
}

function OrdersSection({ orders, loading: parentLoading }) {
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("2026-05-01");
  const [toDate, setToDate] = useState("");
  const [offset, setOffset] = useState(0);
  const [ordersData, setOrdersData] = useState(orders);
  const [loading, setLoading] = useState(parentLoading);
  const [error, setError] = useState("");
  const limit = 50;

  useEffect(() => {
    const abortController = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        fromDate: `${fromDate} 00:00:00`,
        groupBy: "day"
      });

      if (toDate) params.set("toDate", `${toDate} 23:59:59`);
      if (status) params.set("status", status);

      try {
        const response = await fetch(`/api/orders?${params}`, { signal: abortController.signal });
        if (!response.ok) throw new Error("No se pudieron cargar ordenes");
        setOrdersData(await response.json());
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message);
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    }

    loadOrders();
    return () => abortController.abort();
  }, [fromDate, offset, status, toDate]);

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setOffset(0);
  }

  const overview = ordersData?.overview || {};
  const byStatus = ordersData?.byStatus || [];
  const paidTimeseries = ordersData?.paidTimeseries || ordersData?.timeseries || [];
  const cancelledTimeseries = ordersData?.cancelledTimeseries || [];

  return (
    <div className="module-stack">
      <section className="metric-grid-clean orders-metrics">
        <Metric icon={ClipboardList} label="Ordenes" value={formatNumber(overview.totalOrders || 0)} detail="Con aporte ML" />
        <Metric icon={Megaphone} label="Aporte ML" value={formatCurrency(overview.totalAporteMl || 0)} detail={`Promedio ${formatCurrency(overview.avgAporteMl || 0)}`} />
        <Metric icon={Store} label="Revenue" value={formatCurrency(overview.totalRevenue || 0)} detail={`Ticket ${formatCurrency(overview.avgTicket || 0)}`} />
      </section>

      <section className="ops-toolbar orders-toolbar">
        <div className="orders-date-filters">
          <label>
            Analytics desde
            <input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setOffset(0); }} />
          </label>
          <label>
            Analytics hasta
            <input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setOffset(0); }} />
          </label>
        </div>
        <div className="filter-tabs">
          {orderStatusFilters.map((filter) => (
            <button key={filter.value || "all"} className={status === filter.value ? "is-active" : ""} onClick={() => changeStatus(filter.value)}>
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="inline-alert">{error}</div> : null}

      <div className="orders-analytics-grid">
        <section className="clean-card">
          <SectionHead title="Aporte ML por fecha" text="Pagadas y canceladas desde analytics/aporte-ml/timeseries." />
          <AporteMlChart paidItems={paidTimeseries} cancelledItems={cancelledTimeseries} loading={loading} />
        </section>

        <section className="clean-card">
          <SectionHead title="Por estado" text="Ordenes, revenue y aporte agrupados." />
          <div className="status-breakdown">
            {loading ? <LoadingBlock label="Cargando estados" compact /> : byStatus.map((item) => (
              <article key={item.status}>
                <span className="soft-badge">{item.status}</span>
                <strong>{formatNumber(item.orders)} ordenes</strong>
                <small>{formatCurrency(item.aporteMl)} aporte · {formatCurrency(item.revenue)} revenue</small>
              </article>
            ))}
            {!loading && !byStatus.length ? <div className="panel-placeholder">No hay estados para mostrar.</div> : null}
          </div>
        </section>
      </div>

      <section className="clean-card">
        <SectionHead title="Ordenes con aporte ML" text="Datos desde /api/mercadolibre/orders/aporte-ml." />
        <div className="table-scroll-clean">
          <table className="clean-table orders-table">
            <thead>
              <tr>
                <th>Nro venta</th>
                <th>SKU / Producto</th>
                <th>Estado</th>
                <th>Aporte ML</th>
                <th>Precio venta</th>
                <th>Ubicacion</th>
                <th>Fecha</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableLoadingRow columns={8} label="Cargando ordenes" /> : (ordersData?.data || []).map((order) => (
                <tr key={order.id || order.nroVenta}>
                  <td><strong>{order.nroVenta || order.id}</strong><small>{order.id}</small></td>
                  <td><strong>{order.sku || "-"}</strong><small>{order.nombreProducto || "-"}</small></td>
                  <td><span className="soft-badge">{order.estadoOrden || order.status || "-"}</span></td>
                  <td><strong>{formatCurrency(order.aporteMl)}</strong></td>
                  <td>{formatCurrency(order.precioVenta)}</td>
                  <td><strong>{order.ciudad || "-"}</strong><small>{order.provincia || "-"}</small></td>
                  <td>{formatDateTime(order.fechaVenta)}</td>
                  <td>
                    <div className="order-links">
                      {order.linkMl ? <a href={order.linkMl} target="_blank" rel="noreferrer">ML</a> : null}
                      {order.linkAmazon ? <a href={order.linkAmazon} target="_blank" rel="noreferrer">Amazon</a> : null}
                      {!order.linkMl && !order.linkAmazon ? "-" : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !(ordersData?.data || []).length ? <tr><td colSpan="8" className="empty-cell">No hay ordenes para este filtro.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="pagination-clean">
        <span>Mostrando {formatNumber(ordersData?.count || 0)} de {formatNumber(ordersData?.total || 0)} · offset {formatNumber(ordersData?.offset || 0)}</span>
        <div>
          <button onClick={() => setOffset((value) => Math.max(0, value - limit))} disabled={loading || offset <= 0}><ChevronLeft size={18} /></button>
          <button onClick={() => setOffset(ordersData?.nextOffset || offset + limit)} disabled={loading || !ordersData?.hasNext}><ChevronRight size={18} /></button>
        </div>
      </footer>
    </div>
  );
}

function CatalogSection({ catalog, loading }) {
  const [selectedType, setSelectedType] = useState("");
  const catalogItems = catalog.data || [];
  const typeSummary = useMemo(() => {
    const summary = catalogItems.reduce((acc, promotion) => {
      const type = promotion.type || "SIN_TIPO";
      if (!acc[type]) acc[type] = { type, count: 0, candidates: 0, names: [] };
      acc[type].count += 1;
      acc[type].candidates += Number(promotion.totalCandidates || 0);
      if (promotion.name && acc[type].names.length < 3) acc[type].names.push(promotion.name);
      return acc;
    }, {});

    return Object.values(summary).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
  }, [catalogItems]);
  const visibleCatalog = selectedType
    ? catalogItems.filter((promotion) => (promotion.type || "SIN_TIPO") === selectedType)
    : catalogItems;

  return (
    <div className="module-stack">
      <section className="catalog-summary-grid">
        {loading ? <LoadingBlock label="Cargando resumen de catalogo" compact /> : typeSummary.map((group) => (
          <article className="clean-card catalog-summary-card" key={group.type}>
            <span>{group.type}</span>
            <strong>{formatNumber(group.count)} promociones</strong>
            <small>{formatNumber(group.candidates)} candidatos totales</small>
            <p>{group.names.join(", ")}</p>
          </article>
        ))}
      </section>

      <section className="ops-toolbar catalog-toolbar">
        <div>
          <strong>{formatNumber(visibleCatalog.length)} visibles</strong>
          <span> de {formatNumber(catalog.total || catalogItems.length)} promociones</span>
        </div>
        <div className="filter-tabs">
          <button className={selectedType === "" ? "is-active" : ""} onClick={() => setSelectedType("")}>Todos</button>
          {typeSummary.map((group) => (
            <button key={group.type} className={selectedType === group.type ? "is-active" : ""} onClick={() => setSelectedType(group.type)}>
              {group.type}
            </button>
          ))}
        </div>
      </section>

      <section className="clean-card">
        <SectionHead title="Catalogo de promociones" text="Campañas disponibles para participar, analizar o accionar." />
        <div className="table-scroll-clean">
          <table className="clean-table catalog-table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>ID</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Candidatos</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableLoadingRow columns={8} label="Cargando catalogo" /> : visibleCatalog.map((promotion) => (
                <tr key={promotion._id || promotion.promotionId}>
                  <td><strong>{promotion.name}</strong><small>{promotion._id || "-"}</small></td>
                  <td>{promotion.promotionId}</td>
                  <td>{promotion.type}</td>
                  <td><span className="soft-badge">{promotion.status}</span></td>
                  <td><strong>{formatNumber(promotion.totalCandidates || 0)}</strong></td>
                  <td>{formatDateTime(promotion.startDate)}</td>
                  <td>{formatDateTime(promotion.finishDate)}</td>
                  <td>{formatDateTime(promotion.deadlineDate)}</td>
                </tr>
              ))}
              {!loading && !visibleCatalog.length ? <tr><td colSpan="8" className="empty-cell">No hay promociones para este tipo.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PricingSection() {
  const [form, setForm] = useState({
    mla: "MLA2228742950",
    categoryId: "MLA31040",
    publicationType: "gold_special",
    sku: "B0F47N62NN",
    salePrice: "731399",
    meliContributionPercentage: "2.4"
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function calculatePricing(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload = {
      ...form,
      salePrice: Number(form.salePrice)
    };

    if (!form.meliContributionPercentage) {
      delete payload.meliContributionPercentage;
    } else {
      payload.meliContributionPercentage = Number(form.meliContributionPercentage);
    }

    try {
      const response = await fetch("/api/pricing/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.message || "No se pudo calcular pricing");
      setResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pricing-layout">
      <section className="clean-card pricing-form-card">
        <SectionHead title="Pricing de promocion" text="Componer precio, aporte MELI y rentabilidad para una publicacion." />
        <form className="pricing-form" onSubmit={calculatePricing}>
          <PricingField label="mla" value={form.mla} onChange={(value) => updateField("mla", value)} placeholder="MLA2228742950" />
          <PricingField label="categoryId" value={form.categoryId} onChange={(value) => updateField("categoryId", value)} placeholder="MLA31040" />
          <PricingField label="publicationType" value={form.publicationType} onChange={(value) => updateField("publicationType", value)} placeholder="gold_special" />
          <PricingField label="sku" value={form.sku} onChange={(value) => updateField("sku", value)} placeholder="B0F47N62NN" />
          <PricingField label="salePrice" type="number" value={form.salePrice} onChange={(value) => updateField("salePrice", value)} placeholder="731399" />
          <PricingField label="meliContributionPercentage" type="number" value={form.meliContributionPercentage} onChange={(value) => updateField("meliContributionPercentage", value)} placeholder="Opcional" optional />
          <button className="primary-action pricing-submit" type="submit" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" label="Calculando pricing" /> : <Calculator size={18} />}
            {loading ? "Calculando..." : "Calcular pricing"}
          </button>
        </form>
        {error ? <p className="inline-alert">{error}</p> : null}
      </section>

      <section className="clean-card pricing-result-card">
        <SectionHead title="Resultado" text="Respuesta de getProfit/details agrupada por los mismos nombres del servicio." />
        {loading ? <LoadingBlock label="Calculando pricing" /> : null}
        {!loading && !result ? <div className="panel-placeholder">Completa los datos y calcula para ver el detalle.</div> : null}
        {!loading && result ? <PricingResult result={result} /> : null}
      </section>
    </div>
  );
}

function PricingField({ label, value, onChange, placeholder, type = "text", optional = false }) {
  return (
    <label className="pricing-field">
      <span>{label}{optional ? <small>Opcional</small> : null}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} step={type === "number" ? "any" : undefined} />
    </label>
  );
}

function PricingResult({ result }) {
  const groups = ["input", "prices", "datosBase", "tiposDeCambio", "costosOperativos", "emo", "costosCalculados", "resultados", "precio"];

  return (
    <div className="pricing-result">
      {groups.filter((group) => result[group]).map((group) => (
        <article className="pricing-result-group" key={group}>
          <h3>{group}</h3>
          <div>
            {Object.entries(result[group]).map(([key, value]) => (
              <Info key={`${group}-${key}`} label={key} value={formatPricingValue(value)} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function formatPricingValue(value) {
  if (typeof value === "number") return formatNumber(value);
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function ActionsSection() {
  const [promotionId, setPromotionId] = useState("");
  const [result, setResult] = useState("");
  const [running, setRunning] = useState("");
  const schedulerRows = [
    { label: "Sincronizacion", schedule: "Todos los dias a las 09:00" },
    { label: "Activacion", schedule: "Todos los dias a las 00:00, 06:00, 12:00 y 18:00" },
    { label: "Desactivacion", schedule: "Todos los dias a las 03:00, 15:00 y 21:00" }
  ];
  const actionRows = [
    {
      action: "resync",
      title: "Sincronizar campañas",
      text: "Ejecuta el scheduler de sync manualmente. Deja las promociones actualizadas desde MELI.",
      icon: RefreshCw
    },
    {
      action: "activateAll",
      title: "Scheduler de activacion",
      text: "Evalua reglas economicas y participa promociones aptas.",
      icon: PlayCircle
    },
    {
      action: "deactivateAll",
      title: "Scheduler de desactivacion",
      text: "Revisa promociones activas y desparticipa las que ya no cumplen criterio.",
      icon: Trash2
    },
    {
      action: "deactivateFailed",
      title: "Reintentar fallidas de desactivacion",
      text: "Vuelve a intentar desactivar las promociones que quedaron en failedDeactivation.",
      icon: AlertTriangle,
      danger: true
    }
  ];

  function run(action) {
    if (action === "syncOne" && !promotionId.trim()) {
      setResult("Promotion ID requerido.");
      return;
    }

    setRunning(action);
    const message = "Proceso iniciado en segundo plano. Puede tardar 30 minutos o mas.";
    const payload = action === "syncOne"
      ? { promotionId: promotionId.trim(), updatedBy: "arturo" }
      : { updatedBy: "arturo" };

    fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload })
    }).catch(() => {});

    setResult(message);
    window.alert(message);
    setTimeout(() => setRunning(""), 700);
  }

  return (
    <div className="actions-page">
      <section className="clean-card scheduler-card">
        <SectionHead title="Agenda automatica" text="Horarios configurados para Argentina. Estos procesos corren solos todos los dias." />
        <div className="scheduler-grid">
          {schedulerRows.map((row) => (
            <article key={row.label}>
              <div className="scheduler-icon"><Clock size={18} /></div>
              <div>
                <strong>{row.label}</strong>
                <span>{row.schedule}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="scheduler-note">
          <AlertTriangle size={17} />
          <span>Las ejecuciones manuales no reemplazan la agenda automatica; solo disparan una corrida adicional.</span>
        </div>
      </section>

      <section className="clean-card operations-card">
        <SectionHead title="Ejecucion manual" text="Estos botones disparan el proceso y el backend sigue trabajando en segundo plano." />
        <div className="operation-list">
          {actionRows.map((row) => {
            const Icon = row.icon;
            return (
              <article className={row.danger ? "operation-item is-danger" : "operation-item"} key={row.action}>
                <div className="operation-icon"><Icon size={20} /></div>
                <div className="operation-copy">
                  <strong>{row.title}</strong>
                  <p>{row.text}</p>
                </div>
                <button onClick={() => run(row.action)} disabled={Boolean(running)}>
                  {running === row.action ? <LoadingSpinner size="sm" label={row.title} /> : <PlayCircle size={17} />}
                  Ejecutar
                </button>
              </article>
            );
          })}
        </div>
        {result ? <p className="action-result">{result}</p> : null}
      </section>

      <section className="clean-card sync-one-card">
        <SectionHead title="Sincronizar una campaña" text="Usa sync-one con Promotion ID y updatedBy fijo como arturo." />
        <div className="sync-one-form">
          <label className="field-label">
            Promotion ID
            <input value={promotionId} onChange={(event) => setPromotionId(event.target.value)} placeholder="P-MLA17373038" />
          </label>
          <button className="primary-action" onClick={() => run("syncOne")} disabled={!promotionId.trim() || Boolean(running)}>
            {running === "syncOne" ? <LoadingSpinner size="sm" label="Sincronizando campaña" /> : <RefreshCw size={18} />}
            {running === "syncOne" ? "Sincronizando..." : "Sincronizar campaña"}
          </button>
        </div>
      </section>
    </div>
  );
}

function LogsSection() {
  return (
    <section className="clean-card logs-card">
      <div className="logs-head">
        <SectionHead title="Logs DataDog" text="Live tail de central-promos-enginee filtrado por MLA17373038." />
        <a className="datadog-link" href={DATADOG_URL} target="_blank" rel="noreferrer">
          <Activity size={18} />
          Abrir en DataDog
          <ExternalLink size={16} />
        </a>
      </div>
      <div className="datadog-frame-shell">
        <iframe
          title="DataDog live tail central promos"
          src={DATADOG_URL}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="datadog-note">
        Si DataDog bloquea el iframe por permisos de seguridad, usa el boton para abrir la misma vista en una pestaña nueva.
      </p>
    </section>
  );
}

function ProfileSection({ profile, loading }) {
  return (
    <section className="clean-card profile-card">
      <SectionHead title="Usuario logueado" text="Datos de sesion validados contra auth-api." />
      {loading ? <LoadingBlock label="Cargando perfil" /> : (
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

function ConfigurationSection({ profile, nightMode, setNightMode, onLogout }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function inviteUser(event) {
    event.preventDefault();
    if (!inviteEmail) return;

    setSaving(true);
    setMessage("");
    await new Promise((resolve) => setTimeout(resolve, 650));
    setSaving(false);
    setMessage(`Invitacion preparada para ${inviteEmail}.`);
    setInviteEmail("");
  }

  return (
    <div className="settings-grid">
      <section className="clean-card settings-card">
        <SectionHead title="Configuracion del panel" text="Preferencias visuales y operativas del command center." />
        <div className="settings-list">
          <div className="settings-row">
            <div className="settings-row-icon"><Moon size={18} /></div>
            <div>
              <strong>Modo nocturno</strong>
              <p>Activa una vista oscura para operar con menos brillo.</p>
            </div>
            <button className={nightMode ? "switch-control is-on" : "switch-control"} type="button" onClick={() => setNightMode((value) => !value)} aria-pressed={nightMode}>
              <span />
            </button>
          </div>
        </div>
      </section>

      <section className="clean-card settings-card">
        <SectionHead title="Datos de usuario" text="Informacion de la sesion actual." />
        <div className="profile-grid settings-profile">
          <Info label="Nombre" value={profile?.name || "-"} />
          <Info label="Email" value={profile?.email || "-"} />
          <Info label="Rol" value={profile?.role || "operator"} />
          <Info label="ID" value={profile?.id || "-"} />
        </div>
        <div className="settings-actions">
          <button className="logout-action" type="button" onClick={onLogout}>
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </section>

      <section className="clean-card settings-card settings-card--wide">
        <SectionHead title="Invitar usuario" text="Carga el email de una persona para sumarla al panel." />
        <form className="invite-form" onSubmit={inviteUser}>
          <label>
            Email del usuario
            <span>
              <Mail size={18} />
              <input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="usuario@empresa.com" />
            </span>
          </label>
          <button className="primary-action invite-button" type="submit" disabled={!inviteEmail || saving}>
            {saving ? <LoadingSpinner size="sm" label="Preparando invitacion" /> : <UserPlus size={18} />}
            {saving ? "Invitando..." : "Invitar usuario"}
          </button>
        </form>
        {message ? <p className="action-result">{message}</p> : null}
      </section>
    </div>
  );
}

function PromotionsTable({ items, selected, onSelect, loading }) {
  return (
    <section className="clean-card central-table">
      <SectionHead title="Promociones en Mongo" text="Listado completo desde /promotions, con scroll para volumen alto." />
      <div className="table-scroll-clean central-promotions-scroll">
        <table className="clean-table promotions-full-table">
          <thead>
            <tr>
              <th>Promocion</th>
              <th>Estado</th>
              <th>Item</th>
              <th>SKU</th>
              <th>Categoria</th>
              <th>Listing</th>
              <th>Tipo</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Deadline</th>
              <th>Precio original</th>
              <th>Precio sugerido</th>
              <th>Min / Max</th>
              <th>Costo</th>
              <th>Profit</th>
              <th>Rentab.</th>
              <th>Margen</th>
              <th>Profitable</th>
              <th>Should pause</th>
              <th>Resigna total</th>
              <th>ML resigna</th>
              <th>Seller resigna</th>
              <th>Offer</th>
              <th>Sync</th>
              <th>Activacion</th>
              <th>Updated by</th>
              <th>Proceso</th>
              <th>Motivo</th>
              <th>Audit</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableLoadingRow columns={30} label="Cargando promociones" /> : items.map((item) => (
              <tr key={item._id || item.itemId} className={selected?._id === item._id ? "is-selected" : ""} onClick={() => onSelect(item)}>
                <td><strong>{item.name || "-"}</strong><small>{item.promotionId || item._id || "-"}</small></td>
                <td><StatusPill status={item.status} /></td>
                <td><strong>{item.itemId || "-"}</strong></td>
                <td>{item.sku || "-"}</td>
                <td>{item.categoryId || "-"}</td>
                <td>{item.listingTypeId || "-"}</td>
                <td>{item.type || "-"}</td>
                <td>{formatDateTime(item.startDate)}</td>
                <td>{formatDateTime(item.finishDate)}</td>
                <td>{formatDateTime(item.deadlineDate)}</td>
                <td>{formatCurrency(item.prices?.originalPrice)}</td>
                <td><strong>{formatCurrency(item.prices?.suggestedPrice)}</strong></td>
                <td><strong>{formatCurrency(item.prices?.minPrice)}</strong><small>{formatCurrency(item.prices?.maxPrice)}</small></td>
                <td>{formatCurrency(item.economics?.cost)}</td>
                <td className={item.economics?.profitable ? "positive" : "negative"}><strong>{formatCurrency(item.economics?.profit)}</strong><small>{formatPercent(item.economics?.profitability)}</small></td>
                <td>{formatPercent(item.economics?.profitability)}</td>
                <td>{formatPercent(item.economics?.margin)}</td>
                <td><BooleanBadge value={item.economics?.profitable} /></td>
                <td><BooleanBadge value={item.economics?.shouldPause} /></td>
                <td><strong>{formatPercent(item.terms?.resignation?.total)}</strong></td>
                <td><strong>{formatPercent(item.terms?.resignation?.mercadolibre?.percentage)}</strong><small>{formatCurrency(item.terms?.resignation?.mercadolibre?.amount)}</small></td>
                <td><strong>{formatPercent(item.terms?.resignation?.seller?.percentage)}</strong><small>{formatCurrency(item.terms?.resignation?.seller?.amount)}</small></td>
                <td>{item.offerId || "-"}</td>
                <td>{formatDateTime(item.metadata?.syncedAt)}</td>
                <td>{formatDateTime(item.metadata?.activatedAt)}</td>
                <td>{item.metadata?.updatedBy || "-"}</td>
                <td>{item.metadata?.sourceProcess || "-"}</td>
                <td className="reason-cell">{item.metadata?.statusReason || "-"}</td>
                <td>{formatNumber((item.auditTrail || []).length)}</td>
                <td>{formatDateTime(item.updatedAt)}</td>
              </tr>
            ))}
            {!loading && !items.length ? <tr><td colSpan="30" className="empty-cell">No hay promociones para este filtro.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BooleanBadge({ value }) {
  if (value === true) return <span className="boolean-badge is-yes">Si</span>;
  if (value === false) return <span className="boolean-badge is-no">No</span>;
  return <span className="boolean-badge">-</span>;
}

function PromotionDetail({ promotion }) {
  if (!promotion) {
    return (
      <aside className="clean-card detail-clean">
        <div className="promotion-detail-empty">
          <Search size={22} />
          <strong>Selecciona una promocion</strong>
          <span>El detalle economico y operativo aparece aca.</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="clean-card detail-clean">
      <div className="promotion-detail-hero">
        <div>
          <StatusPill status={promotion.status} />
          <h2>{promotion.name || promotion.itemId}</h2>
          <p>{promotion.promotionId || "-"} · {promotion.type || "-"}</p>
        </div>
        <BooleanBadge value={promotion.economics?.profitable} />
      </div>

      <div className="promotion-detail-section">
        <h3>Identificacion</h3>
        <div className="info-grid-compact">
          <Info label="Item" value={promotion.itemId || "-"} />
          <Info label="SKU" value={promotion.sku || "-"} />
          <Info label="Categoria" value={promotion.categoryId || "-"} />
          <Info label="Listing" value={promotion.listingTypeId || "-"} />
          <Info label="Offer" value={promotion.offerId || "-"} />
          <Info label="Mongo ID" value={promotion._id || "-"} />
        </div>
      </div>

      <div className="promotion-detail-section">
        <h3>Economia</h3>
        <div className="info-grid-compact">
          <Info label="Precio original" value={formatCurrency(promotion.prices?.originalPrice)} />
          <Info label="Precio sugerido" value={formatCurrency(promotion.prices?.suggestedPrice)} />
          <Info label="Costo" value={formatCurrency(promotion.economics?.cost)} />
          <Info label="Profit" value={formatCurrency(promotion.economics?.profit)} />
          <Info label="Rentabilidad" value={formatPercent(promotion.economics?.profitability)} />
          <Info label="Margen" value={formatPercent(promotion.economics?.margin)} />
        </div>
      </div>

      <div className="promotion-detail-section">
        <h3>Resignacion</h3>
        <div className="info-grid-compact">
          <Info label="Total" value={formatPercent(promotion.terms?.resignation?.total)} />
          <Info label="Mercado Libre" value={`${formatPercent(promotion.terms?.resignation?.mercadolibre?.percentage)} · ${formatCurrency(promotion.terms?.resignation?.mercadolibre?.amount)}`} />
          <Info label="Seller" value={`${formatPercent(promotion.terms?.resignation?.seller?.percentage)} · ${formatCurrency(promotion.terms?.resignation?.seller?.amount)}`} />
          <Info label="Should pause" value={promotion.economics?.shouldPause ? "Si" : "No"} />
        </div>
      </div>

      <div className="promotion-detail-section">
        <h3>Fechas y metadata</h3>
        <div className="info-grid-compact">
          <Info label="Inicio" value={formatDateTime(promotion.startDate)} />
          <Info label="Fin" value={formatDateTime(promotion.finishDate)} />
          <Info label="Deadline" value={formatDateTime(promotion.deadlineDate)} />
          <Info label="Actualizado" value={formatDateTime(promotion.updatedAt)} />
          <Info label="Sync" value={formatDateTime(promotion.metadata?.syncedAt)} />
          <Info label="Activacion" value={formatDateTime(promotion.metadata?.activatedAt)} />
          <Info label="Updated by" value={promotion.metadata?.updatedBy || "-"} />
          <Info label="Proceso" value={promotion.metadata?.sourceProcess || "-"} />
        </div>
      </div>

      <div className="decision-box">
        <strong>Motivo / decision</strong>
        <p>{promotion.metadata?.statusReason || promotion.metadata?.reason || "Sin motivo informado"}</p>
      </div>

      <div className="mini-timeline">
        <h3>Audit trail</h3>
        {(promotion.auditTrail || []).length ? (
          (promotion.auditTrail || []).slice().reverse().slice(0, 6).map((event, index) => (
            <article key={`${event.process}-${event.executedAt}-${index}`}>
              <span />
              <div>
                <strong>{event.process || "-"}</strong>
                <small>{event.status || "-"} · {formatDateTime(event.executedAt)}</small>
                <p>{event.reason || "-"}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="detail-muted">Sin eventos registrados.</p>
        )}
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

function TableLoadingRow({ columns, label }) {
  return (
    <tr className="table-loading-row">
      <td colSpan={columns}>
        <LoadingBlock label={label} compact />
      </td>
    </tr>
  );
}

function LoadingBlock({ label, compact = false }) {
  return (
    <div className={compact ? "loading-block loading-block--compact" : "loading-block"}>
      <LoadingSpinner label={label} />
      <span>{label}...</span>
    </div>
  );
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
    pricing: "Pricing",
    actions: "Acciones operativas",
    logs: "Logs de DataDog",
    notifications: "Notificaciones",
    configuration: "Configuracion"
  }[section];
}

function descriptionFor(section) {
  return {
    orders: "Ordenes que llegan desde promociones y campañas activas.",
    central: "Todas las promociones del Mongo con filtros por estado y lectura economica.",
    catalog: "Campañas disponibles para activar, auditar o cruzar contra la central.",
    pricing: "Calcula pricing, aporte MELI y rentabilidad para una promocion.",
    actions: "Activaciones, desactivaciones y sincronizaciones controladas.",
    logs: "Acceso directo al stream operativo para investigar procesos.",
    notifications: "Ultimos procesos, cambios de estado y eventos importantes.",
    configuration: "Preferencias del panel, administracion de usuario e invitaciones."
  }[section];
}
