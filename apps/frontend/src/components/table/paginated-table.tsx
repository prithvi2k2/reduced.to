import { component$, JSXChildren, useSignal, $, QwikChangeEvent, PropFunction, useResource$, Resource } from '@builder.io/qwik';
import { authorizedFetch } from '../../shared/auth.service';

export enum SortOrder {
  DESC = 'desc',
  ASC = 'asc',
}

export interface PaginationParams {
  limit: number;
  page: number;
  filter?: string;
  sort?: {
    column: string;
    order: SortOrder;
  };
}

export interface TableProps {
  url: string;
  headers: { name: string; customName?: string; hide?: true }[];
  options?: {
    rowsPerPage?: number;
  };
}

export const PaginatedTable = component$(<T extends string>(props: TableProps) => {
  const rowsPerPage = useSignal(props.options?.rowsPerPage || 10);
  const currentPage = useSignal(1);
  const filter = useSignal('');

  const fetch = async () => {
    const paginationParams = new URLSearchParams({
      limit: rowsPerPage.value.toString(),
      page: currentPage.value.toString(),
      filter: filter.value,
    });

    const data = await authorizedFetch(`${props.url}?${paginationParams}`);
    return data.json();
  };

  const resource = useResource$(({ track }) => {
    track(rowsPerPage);
    track(currentPage);
    track(filter);

    return fetch();
  });

  return (
    <div class="flex flex-col justify-start">
      <table id="table" class="table table-zebra w-full">
        <thead>
          <tr>{props.headers.map((header) => (header.customName ? <th>{header.customName}</th> : <th>{header.name}</th>))}</tr>
        </thead>

        <Resource
          value={resource}
          onPending={() => <p>Loading...</p>}
          onResolved={({ data }) => {
            const filteredData = (data as unknown as Record<T, JSXChildren>[]).map((row) => {
              return Object.keys(row).reduce((acc: { [key: string]: unknown }, k) => {
                const key = k as T;
                if (props.headers?.[key]?.hide) {
                  return acc;
                }
                acc[k] = row[key];
                return acc;
              }, {});
            });
            return (
              <tbody>
                {/* ts inference bug atm with useresource */}
                {filteredData.map((row) => (
                  <tr>
                    {(Object.values(row) as JSXChildren[]).map((cell) => (
                      <td>{cell?.toString()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            );
          }}
        />
        <tfoot>
          <tr>
            <td colSpan={100}>
              <div class="flex gap-2">
                {/* first page */}
                <button
                  class="btn border rounded p-1 "
                  onClick$={async () => {
                    currentPage.value = 0;
                  }}
                  disabled={isOnFirstPage}
                >
                  {'<<'}
                </button>
                {/* prev page -1 */}
                <button
                  class="btn border rounded p-1"
                  onClick$={() => {
                    setPageNumber('prev');
                  }}
                  disabled={isOnFirstPage}
                >
                  {'<'}
                </button>
                {/* next page +1 */}
                <button
                  class="btn border rounded p-1"
                  onClick$={async () => {
                    setPageNumber('next');
                  }}
                  disabled={isOnLastPage}
                >
                  {'>'}
                </button>
                {/* last page */}
                <button
                  class="btn border rounded p-1"
                  onClick$={async () => {
                    currentPage.value = maxPages.value - 1;
                  }}
                  disabled={isOnLastPage}
                >
                  {'>>'}
                </button>
                {/* pages of totalpages */}
                <span class="flex items-center gap-1">
                  <div>Page</div>
                  <strong>
                    {currentPage.value + 1} of {maxPages.value}
                  </strong>
                </span>
                {/* got to page input */}
                {/* <span class="flex items-center gap-2 mx-3">
                  <span>Go to page:</span>
                  <input
                    type="number"
                    value={currentPage.value + 1}
                    min="1"
                    max={maxPages.value}
                    onChange$={(e) => {
                      const page = e.target.value ? Number(e.target.value) - 1 : 0;
                      currentPage.value = page;
                    }}
                    // class="border p-1 rounded w-16"
                    class="input input-bordered w-full"
                  />
                </span> */}
                {/* rowsperpage select */}
                <select
                  value={rowsPerPage.value}
                  onChange$={(ev: QwikChangeEvent<HTMLSelectElement>) => {
                    rowsPerPage.value = +ev.target.value;
                  }}
                  class="select-text px-2 mx-3 rounded-md"
                >
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <option value={pageSize}>{'Show ' + pageSize}</option>
                  ))}
                </select>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});
