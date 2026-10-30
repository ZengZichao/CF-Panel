// src/renderer/components/VectorTable.tsx
// Linear table style — header, row hover, pagination, search input
// Explicit ARIA grid semantics (role=grid > rowgroup > row > gridcell)
// Row-level keyboard model — roving tabindex cursor, ↑↓/Home/End, Enter/Space select
// Sortable headers via real <button> elements with aria-sort
// Ψ/N values unified through lib/format.ts

import React, { useMemo, useRef, useEffect, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef
} from '@tanstack/react-table'
import type { CFVector } from '../types/cf'
import { useProjectStore } from '../stores/project'
import { useSelectionStore } from '../stores/selection'
import { useSettingsStore } from '../stores/settings'
import { formatPsi, formatN, formatLength } from '../lib/format'
import { loadExample, openDirectory } from '../lib/loaders'
import { Icon } from './Icon'

const columnHelper = createColumnHelper<CFVector>()

const VectorTable: React.FC = () => {
  const { project } = useProjectStore()
  const { selectedBranchId, hoveredBranchId, selectBranch, hoverBranch, activeCFType } = useSelectionStore()
  const { t } = useSettingsStore()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // 键盘游标（roving tabindex 落点），独立于选中态
  const [cursorId, setCursorId] = useState<number | null>(null)
  const rowRefs = useRef(new Map<number, HTMLTableRowElement>())

  const data = useMemo(() => (project ? project.vectors : []), [project])

  const columns = useMemo<ColumnDef<CFVector, any>[]>(() => {
    const cols: ColumnDef<CFVector, any>[] = [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 60,
        cell: info => <span className="cell-id">{info.getValue()}</span>
      }),
      columnHelper.accessor('label', {
        header: 'Label',
        size: 120,
        cell: info => {
          const val = info.getValue()
          return val ? <span className="cell-label" title={val}>{val.length > 20 ? val.substring(0, 20) + '…' : val}</span> : ''
        }
      }),
    ]

    // Dynamic columns based on activeCFType — units from format.ts
    if (activeCFType === 'gene') {
      cols.push(
        columnHelper.accessor('genePsi1', { header: 'gΨ₁', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('genePsi2', { header: 'gΨ₂', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('genePsi3', { header: 'gΨ₃', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('genePsi4', { header: 'gΨ₄', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('geneN', { header: 'gN', size: 60, cell: info => formatN(info.getValue()) }),
      )
    } else if (activeCFType === 'site') {
      cols.push(
        columnHelper.accessor('sitePsi1', { header: 'sΨ₁', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('sitePsi2', { header: 'sΨ₂', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('sitePsi3', { header: 'sΨ₃', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('sitePsi4', { header: 'sΨ₄', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('siteN', { header: 'sN', size: 70, cell: info => formatN(info.getValue()) }),
      )
    } else {
      cols.push(
        columnHelper.accessor('quartetPsi1', { header: 'qΨ₁', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('quartetPsi2', { header: 'qΨ₂', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('quartetPsi3', { header: 'qΨ₃', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('quartetPsi4', { header: 'qΨ₄', size: 76, cell: info => formatPsi(info.getValue()) }),
        columnHelper.accessor('quartetN', { header: 'qN', size: 70, cell: info => formatN(info.getValue()) }),
        columnHelper.accessor('quartetPsi1Pp', { header: 'qpp₁', size: 60, cell: info => info.getValue()?.toFixed(1) }),
        columnHelper.accessor('quartetPsi2Pp', { header: 'qpp₂', size: 60, cell: info => info.getValue()?.toFixed(1) }),
        columnHelper.accessor('quartetPsi3Pp', { header: 'qpp₃', size: 60, cell: info => info.getValue()?.toFixed(1) }),
      )
    }

    cols.push(
      // 独立表头 key
      columnHelper.accessor('lengthSubsPerSite', {
        header: t.subsPerSiteHeader,
        size: 110,
        cell: info => formatLength(info.getValue())
      }),
      columnHelper.accessor('lengthCoalescent', {
        header: t.coalescentHeader,
        size: 110,
        cell: info => formatLength(info.getValue())
      })
    )

    return cols
  }, [activeCFType, t])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const q = filterValue.toLowerCase()
      const v = row.original
      return Boolean(
        String(v.id).includes(q) ||
        String(v.geneN).includes(q) ||
        String(v.siteN).includes(q) ||
        (v.label != null && v.label.toLowerCase().includes(q))
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 }
    }
  })

  // Auto-jump to the page containing the selected row
  useEffect(() => {
    if (selectedBranchId === null || !tableContainerRef.current) return
    const allRows = table.getSortedRowModel().rows
    const rowIndex = allRows.findIndex(r => r.original.id === selectedBranchId)
    if (rowIndex === -1) return
    const pageIndex = Math.floor(rowIndex / table.getState().pagination.pageSize)
    if (pageIndex !== table.getState().pagination.pageIndex) {
      table.setPageIndex(pageIndex)
    }
    // After page change, scroll into view
    requestAnimationFrame(() => {
      const selectedRow = tableContainerRef.current?.querySelector(`[data-branch-id="${selectedBranchId}"]`)
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }, [selectedBranchId, table])

  // 外部选中（树/三元图点击）同步游标，使 roving 落点跟随（不抢焦点）
  useEffect(() => {
    if (selectedBranchId !== null) setCursorId(selectedBranchId)
  }, [selectedBranchId])

  if (!project || project.vectors.length === 0) {
    return (
      <div className="vector-table-empty">
        <div className="empty-icon" aria-hidden="true"><Icon name="table" size={36} /></div>
        <div className="empty-text">{t.emptyTable}</div>
        {/* Empty state provides next action */}
        <div className="empty-actions">
          <button className="btn-mini btn-mini--primary" onClick={loadExample}>
            <Icon name="chart" size={14} /> {t.welcomeExampleData}
          </button>
          <button className="btn-mini" onClick={openDirectory}>
            <Icon name="folder" size={14} /> {t.openDirectory}
          </button>
        </div>
      </div>
    )
  }

  const visibleRows = table.getRowModel().rows
  // roving 落点：游标 → 选中 → 首行
  const rovingId = cursorId ?? selectedBranchId ?? (visibleRows[0]?.original.id ?? null)

  // 行级键盘模型（事件委托在 tbody 上）
  const handleTbodyKeyDown = (e: React.KeyboardEvent) => {
    if (visibleRows.length === 0) return
    const ids = visibleRows.map(r => r.original.id)
    const current = rovingId != null ? ids.indexOf(rovingId) : -1

    if (e.key === 'Enter' || e.key === ' ') {
      if (current >= 0) {
        e.preventDefault()
        selectBranch(ids[current])
      }
      return
    }

    let nextIdx: number
    switch (e.key) {
      case 'ArrowDown': nextIdx = current < 0 ? 0 : Math.min(current + 1, ids.length - 1); break
      case 'ArrowUp': nextIdx = current < 0 ? 0 : Math.max(current - 1, 0); break
      case 'Home': nextIdx = 0; break
      case 'End': nextIdx = ids.length - 1; break
      default: return
    }
    e.preventDefault()
    e.stopPropagation() // 不触发全局 ↑↓ 分支导航
    const nextId = ids[nextIdx]
    setCursorId(nextId)
    rowRefs.current.get(nextId)?.focus()
  }

  return (
    <div className="vector-table-container" role="region" aria-label={t.ariaVectorTable}>
      {/* Toolbar with search */}
      <div className="table-toolbar">
        <input
          type="text"
          placeholder={t.search}
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="table-search"
          aria-label={t.search}
        />
        <span className="table-count">
          {table.getFilteredRowModel().rows.length} {t.branches} · {t.tablePsiHint}
        </span>
      </div>

      {/* Table body — explicit grid semantics */}
      <div className="table-scroll" ref={tableContainerRef}>
        <table
          className="vector-table"
          role="grid"
          aria-rowcount={table.getFilteredRowModel().rows.length}
          aria-colcount={columns.length}
        >
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                    >
                      {canSort ? (
                        // 真实按钮 — Tab 可达、Enter/Space 触发
                        <button
                          type="button"
                          className="th-sort"
                          onClick={header.column.getToggleSortingHandler()}
                          title={`${String(header.column.columnDef.header ?? '')} — ${t.sortLabel}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span
                            className={`sort-indicator ${sorted ? 'is-active' : ''}`}
                            aria-hidden="true"
                          >
                            {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅'}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody onKeyDown={handleTbodyKeyDown}>
            {visibleRows.map(row => {
              const branchId = row.original.id
              const isSelected = branchId === selectedBranchId
              const isHovered = branchId === hoveredBranchId
              const isCursor = branchId === rovingId
              return (
                <tr
                  key={row.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(branchId, el)
                    else rowRefs.current.delete(branchId)
                  }}
                  data-branch-id={branchId}
                  className={`table-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                  onClick={() => { selectBranch(branchId); setCursorId(branchId) }}
                  onMouseEnter={() => hoverBranch(branchId)}
                  onMouseLeave={() => hoverBranch(null)}
                  onFocus={() => setCursorId(branchId)}
                  tabIndex={isCursor ? 0 : -1}
                  role="row"
                  aria-selected={isSelected}
                  aria-label={`Branch ${branchId}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} role="gridcell" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label={t.previousPage}>‹</button>
        <span>{t.page} {table.getState().pagination.pageIndex + 1} {t.of} {table.getPageCount()}</span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label={t.nextPage}>›</button>
      </div>
    </div>
  )
}

export default VectorTable
