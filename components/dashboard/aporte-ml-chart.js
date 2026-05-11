"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AreaSeries, ColorType, createChart } from "lightweight-charts";
import { formatCurrency, formatNumber } from "@/src/shared/formatters";

export function AporteMlChart({ paidItems = [], cancelledItems = [], items = [], loading = false, compact = false }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const paidSeriesRef = useRef(null);
  const cancelledSeriesRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const paidData = useMemo(() => normalizeSeries(paidItems.length ? paidItems : items), [items, paidItems]);
  const cancelledData = useMemo(() => normalizeSeries(cancelledItems), [cancelledItems]);

  const totals = useMemo(() => ({
    paid: sumSeries(paidData),
    cancelled: sumSeries(cancelledData)
  }), [cancelledData, paidData]);

  const hasData = paidData.length > 0 || cancelledData.length > 0;
  const comparison = totals.paid.aporteMl - totals.cancelled.aporteMl;
  const bestDay = useMemo(() => {
    return mergeSeriesByDate(paidData, cancelledData).sort((a, b) => (b.paid + b.cancelled) - (a.paid + a.cancelled))[0] || null;
  }, [cancelledData, paidData]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const container = containerRef.current;
    const chartHeight = compact ? 300 : 360;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
        fontFamily: "Arial, Helvetica, sans-serif"
      },
      grid: {
        vertLines: { color: "#eef2f7" },
        horzLines: { color: "#eef2f7" }
      },
      rightPriceScale: {
        borderVisible: false
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true
      },
      localization: {
        priceFormatter: (value) => formatCurrency(value)
      },
      crosshair: {
        horzLine: { labelVisible: true },
        vertLine: { labelVisible: true }
      }
    });

    const paidSeries = chart.addSeries(AreaSeries, {
      title: "Pagadas",
      lineColor: "#3483fa",
      topColor: "rgba(52, 131, 250, 0.34)",
      bottomColor: "rgba(52, 131, 250, 0.02)",
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: false
    });

    const cancelledSeries = chart.addSeries(AreaSeries, {
      title: "Canceladas",
      lineColor: "#ef4444",
      topColor: "rgba(239, 68, 68, 0.24)",
      bottomColor: "rgba(239, 68, 68, 0.02)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false
    });

    chartRef.current = chart;
    paidSeriesRef.current = paidSeries;
    cancelledSeriesRef.current = cancelledSeries;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      if (width > 0) {
        chart.resize(width, chartHeight);
      }
    });

    resizeObserver.observe(container);

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        setTooltip(null);
        return;
      }

      const paidPoint = param.seriesData.get(paidSeries);
      const cancelledPoint = param.seriesData.get(cancelledSeries);

      setTooltip({
        x: param.point.x,
        y: param.point.y,
        date: String(param.time),
        paid: Number(paidPoint?.value || 0),
        cancelled: Number(cancelledPoint?.value || 0)
      });
    });

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      paidSeriesRef.current = null;
      cancelledSeriesRef.current = null;
    };
  }, [compact]);

  useEffect(() => {
    if (!paidSeriesRef.current || !cancelledSeriesRef.current || !chartRef.current) return;

    paidSeriesRef.current.setData(paidData.map(({ time, value }) => ({ time, value })));
    cancelledSeriesRef.current.setData(cancelledData.map(({ time, value }) => ({ time, value })));
    if (hasData) {
      chartRef.current.timeScale().fitContent();
    }
  }, [cancelledData, hasData, paidData]);

  return (
    <div className="aporte-chart-shell">
      <div className="aporte-chart-head">
        <div>
          <strong>{formatCurrency(totals.paid.aporteMl)}</strong>
          <span>Aporte pagadas</span>
        </div>
        <div>
          <strong>{formatCurrency(totals.cancelled.aporteMl)}</strong>
          <span>Aporte canceladas</span>
        </div>
        <div>
          <strong>{formatNumber(totals.paid.orders + totals.cancelled.orders)}</strong>
          <span>Ordenes graficadas</span>
        </div>
        <div>
          <strong>{formatCurrency(comparison)}</strong>
          <span>Diferencia neta</span>
        </div>
      </div>
      <div className="aporte-chart-legend">
        <span><i className="legend-dot legend-dot--paid" /> Pagadas</span>
        <span><i className="legend-dot legend-dot--cancelled" /> Canceladas</span>
        {bestDay ? <span className="aporte-chart-note">Pico: {bestDay.date} · {formatCurrency(bestDay.paid + bestDay.cancelled)}</span> : null}
      </div>
      <div className="aporte-chart-frame">
        {loading ? <div className="chart-loading">Cargando grafico...</div> : null}
        {!loading && !hasData ? <div className="chart-loading">No hay datos para graficar.</div> : null}
        <div ref={containerRef} className="aporte-chart" />
        {tooltip ? (
          <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            <strong>{tooltip.date}</strong>
            <span><i className="legend-dot legend-dot--paid" /> Pagadas {formatCurrency(tooltip.paid)}</span>
            <span><i className="legend-dot legend-dot--cancelled" /> Canceladas {formatCurrency(tooltip.cancelled)}</span>
            <small>Neto {formatCurrency(tooltip.paid - tooltip.cancelled)}</small>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function normalizeSeries(items = []) {
  return items.map((item) => ({
    time: item.date,
    value: Number(item.aporteMl || 0),
    orders: Number(item.orders || 0),
    revenue: Number(item.revenue || 0)
  })).filter((item) => item.time && Number.isFinite(item.value));
}

function sumSeries(data = []) {
  return data.reduce((acc, item) => ({
    aporteMl: acc.aporteMl + item.value,
    orders: acc.orders + item.orders,
    revenue: acc.revenue + item.revenue
  }), { aporteMl: 0, orders: 0, revenue: 0 });
}

function mergeSeriesByDate(paidData = [], cancelledData = []) {
  const byDate = new Map();

  paidData.forEach((item) => {
    byDate.set(item.time, { date: item.time, paid: item.value, cancelled: 0 });
  });

  cancelledData.forEach((item) => {
    const current = byDate.get(item.time) || { date: item.time, paid: 0, cancelled: 0 };
    byDate.set(item.time, { ...current, cancelled: item.value });
  });

  return Array.from(byDate.values());
}
