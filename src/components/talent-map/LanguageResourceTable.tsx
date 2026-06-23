import type { LanguageResource, Readiness } from "@/types/talent";

type LanguageResourceTableProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function readinessBadgeClass(readiness: Readiness) {
  const styles: Record<Readiness, string> = {
    Core: "language-resource-readiness--core",
    Stable: "language-resource-readiness--stable",
    Developing: "language-resource-readiness--developing",
    Backup: "language-resource-readiness--backup",
    Gap: "language-resource-readiness--gap",
  };

  return `language-resource-readiness ${styles[readiness]}`;
}

function codeBadgeClass(code: string) {
  const tones: Record<string, string> = {
    AR: "purple",
    EN: "blue",
    ES: "cyan",
    ID: "green",
    JA: "purple",
    MS: "amber",
    PT: "green",
    TH: "orange",
    TR: "blue",
    VI: "green",
  };

  return `language-resource-code language-resource-code--${tones[code] ?? "cyan"}`;
}

export function LanguageResourceTable({
  resources,
  selectedId,
  onSelect,
}: LanguageResourceTableProps) {
  return (
    <div
      className="language-resource-table-shell"
      data-matrix-movable="matrix-table"
      data-matrix-label="Table"
    >
      <div className="language-resource-table-scroll">
        <table className="language-resource-table">
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                <span data-matrix-movable="column-code" data-matrix-label="Code column">
                  Code
                </span>
              </th>
              <th>
                <span data-matrix-movable="column-language" data-matrix-label="Language column">
                  Language
                </span>
              </th>
              <th>
                <span data-matrix-movable="column-region" data-matrix-label="Region column">
                  Region
                </span>
              </th>
              <th>
                <span data-matrix-movable="column-total" data-matrix-label="Total column">
                  Total Resources
                </span>
              </th>
              <th>
                <span data-matrix-movable="column-active" data-matrix-label="Active column">
                  Active Talents
                </span>
              </th>
              <th>
                <span data-matrix-movable="column-online" data-matrix-label="Online column">
                  Online Now
                </span>
              </th>
              <th>
                <span data-matrix-movable="column-readiness" data-matrix-label="Readiness column">
                  Readiness
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {resources.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={selectedId === item.id ? "is-selected" : undefined}
              >
                <td>
                  <span
                    className={codeBadgeClass(item.code)}
                    data-matrix-movable="column-code"
                    data-matrix-label="Code column"
                  >
                    {item.code}
                  </span>
                </td>
                <td>
                  <span
                    className="language-cell"
                    data-matrix-movable="column-language"
                    data-matrix-label="Language column"
                  >
                    {item.language}
                  </span>
                </td>
                <td>
                  <span data-matrix-movable="column-region" data-matrix-label="Region column">
                    {item.region}
                  </span>
                </td>
                <td>
                  <span
                    className="numeric-cell"
                    data-matrix-movable="column-total"
                    data-matrix-label="Total column"
                  >
                    {item.totalResources}
                  </span>
                </td>
                <td>
                  <span
                    className="numeric-cell"
                    data-matrix-movable="column-active"
                    data-matrix-label="Active column"
                  >
                    {item.activeTalents}
                  </span>
                </td>
                <td>
                  <span
                    className="online-cell"
                    data-matrix-movable="column-online"
                    data-matrix-label="Online column"
                  >
                    {item.onlineNow}
                  </span>
                </td>
                <td>
                  <span
                    className={readinessBadgeClass(item.readiness)}
                    data-matrix-movable="column-readiness"
                    data-matrix-label="Readiness column"
                  >
                    {item.readiness}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
